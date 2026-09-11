import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Turns the real buildcores/buildcores-open-db dump in `parts/` into the
 * compact, tiered catalog `lib/buildcores/data/*.json` the app ships. Run
 * with `node scripts/build-parts-index.mjs` whenever `parts/` changes.
 *
 * The open-db dataset has real specs but no pricing anywhere (verified: zero
 * files contain a price/msrp field), so there is nothing to build a dollar
 * budget from. Instead every part gets a 1-5 `tier` computed from its real
 * specs, ranked against every other part in its own filtered category pool.
 * `lib/ai/builder.ts` targets a tier instead of a dollar amount.
 *
 * Scope is intentionally narrowed to one modern platform (AM5) so
 * compatibility logic stays a straightforward single-socket model, same
 * simplification the original hand-written catalog used.
 */

const ROOT = new URL("..", import.meta.url).pathname;
const PARTS_DIR = join(ROOT, "parts");
const OUT_DIR = join(ROOT, "lib/buildcores/data");

function readCategory(name) {
  const dir = join(PARTS_DIR, name);
  const files = readdirSync(dir);
  const out = [];
  for (const f of files) {
    try {
      out.push(JSON.parse(readFileSync(join(dir, f), "utf8")));
    } catch {
      // Skip unparsable files rather than fail the whole index.
    }
  }
  return out;
}

/** Equal-sized quintiles: highest-scoring items land in tier 5. */
function assignTiers(items, scoreOf) {
  const sorted = [...items].sort((a, b) => scoreOf(a) - scoreOf(b));
  const n = sorted.length;
  const tiered = new Map();
  sorted.forEach((item, i) => {
    const tier = Math.min(5, Math.max(1, Math.ceil(((i + 1) / n) * 5)));
    tiered.set(item, tier);
  });
  return tiered;
}

// Amazon canonicalizes /dp/{ASIN} regardless of region, and channel codes
// here map to real Amazon storefronts; both patterns were spot-checked
// against live pages before use. Newegg listings resolve the same way at
// /p/{item_id}. Anything else in the dataset (price-comparison aggregators,
// retailers with unverified URL shapes) is skipped rather than guessed at.
const AMAZON_DOMAIN = {
  us: "amazon.com",
  ca: "amazon.ca",
  uk: "amazon.co.uk",
  de: "amazon.de",
  fr: "amazon.fr",
  es: "amazon.es",
  it: "amazon.it",
  nl: "amazon.nl",
  se: "amazon.se",
  pl: "amazon.pl",
  au: "amazon.com.au",
  jp: "amazon.co.jp",
  be: "amazon.com.be",
  ie: "amazon.ie",
  sg: "amazon.sg",
};

function retailerUrl(raw) {
  const listings = raw.identifiers?.retailer_listings ?? [];
  const amazon = listings.find((l) => l.source === "amazon" && l.channel === "us") ?? listings.find((l) => l.source === "amazon");
  if (amazon) {
    const domain = AMAZON_DOMAIN[amazon.channel] ?? "amazon.com";
    return `https://www.${domain}/dp/${amazon.source_product_id}`;
  }
  const newegg = listings.find((l) => l.source === "newegg");
  if (newegg) return `https://www.newegg.com/p/${newegg.source_product_id}`;
  return undefined;
}

function moboFormFactor(raw) {
  if (raw === "ATX") return "atx";
  if (raw === "Micro ATX") return "matx";
  if (raw === "Mini-ITX") return "itx";
  return null;
}

function caseFormFactor(supported) {
  if (!Array.isArray(supported)) return null;
  if (supported.includes("ATX")) return "atx";
  if (supported.includes("Micro ATX")) return "matx";
  if (supported.includes("Mini-ITX")) return "itx";
  return null;
}

const EFFICIENCY_RANK = { "80+ White": 1, "80+ Standard": 2, "80+ Bronze": 3, "80+ Silver": 4, "80+ Gold": 5, "80+ Platinum": 6, "80+ Titanium": 7 };
const MODULAR_RANK = { "Non-Modular": 0, "Semi-Modular": 1, "Full Modular": 2, Full: 2, Semi: 1, None: 0 };

function buildCpuIndex() {
  const raw = readCategory("CPU").filter((j) => j.socket === "AM5" && j.metadata?.name);
  const scoreOf = (j) => (j.cores?.total ?? 0) * 2 + (j.cores?.threads ?? 0) * 0.5 + (j.clocks?.performance?.boost ?? 0) * 10 + (j.cache?.l3 ?? 0) * 0.3;
  const tiers = assignTiers(raw, scoreOf);
  return raw.map((j) => ({
    id: j.opendb_id,
    category: "cpu",
    name: j.metadata.name,
    brand: j.metadata.manufacturer,
    socket: "AM5",
    watts: j.specifications?.tdp ?? undefined,
    specs: { Cores: `${j.cores?.total ?? "?"}C/${j.cores?.threads ?? "?"}T`, Boost: `${j.clocks?.performance?.boost ?? "?"} GHz` },
    tier: tiers.get(j),
    url: retailerUrl(j),
  }));
}

function buildGpuIndex() {
  const raw = readCategory("GPU").filter((j) => ["GDDR6", "GDDR6X", "GDDR7"].includes(j.memory_type) && j.metadata?.name);
  const scoreOf = (j) => (j.memory ?? 0) * 3 + (j.core_boost_clock ?? 0) * 0.05 + (j.memory_bus ?? 0) * 0.2;
  const tiers = assignTiers(raw, scoreOf);
  return raw.map((j) => ({
    id: j.opendb_id,
    category: "gpu",
    name: j.metadata.name,
    brand: j.metadata.manufacturer,
    watts: j.tdp ?? undefined,
    lengthMm: j.length ?? undefined,
    specs: { VRAM: `${j.memory}GB ${j.memory_type}`, Boost: `${j.core_boost_clock ?? "?"} MHz` },
    tier: tiers.get(j),
    url: retailerUrl(j),
  }));
}

function buildMotherboardIndex() {
  const raw = readCategory("Motherboard")
    .filter((j) => j.socket === "AM5" && j.metadata?.name)
    .map((j) => ({ j, ff: moboFormFactor(j.form_factor) }))
    .filter(({ ff }) => ff);
  const scoreOf = ({ j }) => {
    const pcieLanes = (j.pcie_slots ?? []).reduce((s, p) => s + (p.gen === "5.0" ? p.lanes * 3 : p.gen === "4.0" ? p.lanes * 2 : p.lanes), 0);
    const m2 = (j.m2_slots ?? []).length * 4;
    const wireless = j.wireless_networking ? 5 : 0;
    const usb4 = (j.usb_headers?.usb_4 ?? 0) * 10;
    return pcieLanes + m2 + wireless + usb4;
  };
  const tiers = assignTiers(raw, scoreOf);
  return raw.map((entry) => ({
    id: entry.j.opendb_id,
    category: "motherboard",
    name: entry.j.metadata.name,
    brand: entry.j.metadata.manufacturer,
    socket: "AM5",
    formFactor: entry.ff,
    specs: { Chipset: entry.j.chipset ?? "AMD" },
    tier: tiers.get(entry),
    url: retailerUrl(entry.j),
  }));
}

function buildMemoryIndex() {
  const raw = readCategory("RAM").filter((j) => j.ram_type === "DDR5" && j.metadata?.name && j.capacity && j.speed);
  const scoreOf = (j) => j.capacity + j.speed / 100;
  const tiers = assignTiers(raw, scoreOf);
  return raw.map((j) => ({
    id: j.opendb_id,
    category: "memory",
    name: j.metadata.name,
    brand: j.metadata.manufacturer,
    specs: { Capacity: `${j.capacity}GB`, Speed: `DDR5-${j.speed}` },
    tier: tiers.get(j),
    url: retailerUrl(j),
  }));
}

function buildStorageIndex() {
  const raw = readCategory("Storage").filter(
    (j) => j.storage_type === "SSD" && typeof j.interface === "string" && j.interface.startsWith("M.2 PCIe") && j.metadata?.name && j.capacity,
  );
  const genBonus = (j) => (j.interface.includes("5.0") ? 30 : j.interface.includes("4.0") ? 15 : 0);
  const scoreOf = (j) => j.capacity + genBonus(j);
  const tiers = assignTiers(raw, scoreOf);
  return raw.map((j) => ({
    id: j.opendb_id,
    category: "storage",
    name: j.metadata.name,
    brand: j.metadata.manufacturer,
    specs: { Capacity: j.capacity >= 1000 ? `${j.capacity / 1000}TB` : `${j.capacity}GB`, Interface: j.interface },
    tier: tiers.get(j),
    url: retailerUrl(j),
  }));
}

function buildPsuIndex() {
  const raw = readCategory("PSU").filter(
    (j) => j.form_factor === "ATX" && typeof j.efficiency_rating === "string" && j.efficiency_rating in EFFICIENCY_RANK && j.wattage && j.metadata?.name,
  );
  const scoreOf = (j) => j.wattage * 0.05 + EFFICIENCY_RANK[j.efficiency_rating] * 10 + (MODULAR_RANK[j.modular] ?? 0) * 3;
  const tiers = assignTiers(raw, scoreOf);
  return raw.map((j) => ({
    id: j.opendb_id,
    category: "psu",
    name: j.metadata.name,
    brand: j.metadata.manufacturer,
    watts: j.wattage,
    formFactor: "atx",
    specs: { Efficiency: j.efficiency_rating, Modular: j.modular ?? "Non-Modular" },
    tier: tiers.get(j),
    url: retailerUrl(j),
  }));
}

function buildCaseIndex() {
  const raw = readCategory("PCCase")
    .filter((j) => j.max_video_card_length && j.max_cpu_cooler_height && j.metadata?.name)
    .map((j) => ({ j, ff: caseFormFactor(j.supported_motherboard_form_factors) }))
    .filter(({ ff }) => ff);
  const scoreOf = ({ j }) => (j.max_video_card_length ?? 0) * 0.1 + (j.max_cpu_cooler_height ?? 0) * 0.2 + (j.expansion_slots ?? 0) * 3 + (j.volume ?? 0) * 0.5;
  const tiers = assignTiers(raw, scoreOf);
  return raw.map((entry) => ({
    id: entry.j.opendb_id,
    category: "case",
    name: entry.j.metadata.name,
    brand: entry.j.metadata.manufacturer,
    formFactor: entry.ff,
    lengthMm: entry.j.max_video_card_length,
    maxCoolerHeightMm: entry.j.max_cpu_cooler_height,
    specs: { Layout: entry.j.form_factor ?? "Mid Tower" },
    tier: tiers.get(entry),
    url: retailerUrl(entry.j),
  }));
}

function buildCoolerIndex() {
  const raw = readCategory("CPUCooler").filter((j) => (j.cpu_sockets ?? []).includes("AM5") && j.metadata?.name);
  // The dataset publishes no rated max-TDP for coolers, so capacity is an
  // engineering approximation from radiator size (AIO) or tower height (air):
  // roughly 1.1W of sustained dissipation per mm of radiator, or 1.5W per mm
  // of tower height, both anchored to real-world air/AIO cooler reviews.
  const capacityOf = (j) => (j.water_cooled ? (j.radiator_size ?? 120) * 1.1 : (j.height ?? 120) * 1.5);
  const scoreOf = (j) => capacityOf(j) - (j.min_noise_level ?? 30) * 0.3;
  const tiers = assignTiers(raw, scoreOf);
  return raw.map((j) => ({
    id: j.opendb_id,
    category: "cooler",
    name: j.metadata.name,
    brand: j.metadata.manufacturer,
    watts: Math.round(capacityOf(j)),
    coolerHeightMm: j.water_cooled ? 0 : (j.height ?? undefined),
    specs: { Noise: (j.min_noise_level ?? 30) <= 25 ? "low" : "normal", Type: j.water_cooled ? `${j.radiator_size ?? "?"}mm AIO` : "Air tower" },
    tier: tiers.get(j),
    url: retailerUrl(j),
  }));
}

mkdirSync(OUT_DIR, { recursive: true });

const indexes = {
  cpu: buildCpuIndex(),
  gpu: buildGpuIndex(),
  motherboard: buildMotherboardIndex(),
  memory: buildMemoryIndex(),
  storage: buildStorageIndex(),
  psu: buildPsuIndex(),
  case: buildCaseIndex(),
  cooler: buildCoolerIndex(),
};

for (const [category, list] of Object.entries(indexes)) {
  writeFileSync(join(OUT_DIR, `${category}.json`), JSON.stringify(list, null, 2));
  console.log(`${category}: ${list.length} parts`);
}

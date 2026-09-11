import { CATALOG } from "@/lib/buildcores/catalog";
import { runCompatibilityChecks } from "@/lib/buildcores/compatibility";
import {
  AIMode,
  AI_MODE_LABEL,
  Build,
  BuildComponentSlot,
  BuildRequirements,
  CATEGORY_ORDER,
  ComponentCategory,
  PartOption,
  PerformanceRating,
  RequirementTier,
  TIER_LABEL,
} from "@/lib/types";

/**
 * Build assembly against the real, tiered catalog in `lib/buildcores/data`.
 * `assemble` is the deterministic core, used for static/offline builds (see
 * `lib/explore-builds.ts`) and as the shortlist source for the eve agent's
 * tools (`agent/tools/get_part_candidates.ts`, `agent/tools/finalize_build.ts`).
 * The agent picks the actual part per category from a closed set of real ids
 * `applySelection` validates; anything else is rejected and that category
 * quietly keeps its deterministic pick, so the model can never present a
 * part that isn't real and in the catalog.
 */

export interface BuildCandidate {
  id: string;
  name: string;
  tier: number;
  brief: string;
}

export interface PartPick {
  category: ComponentCategory;
  id: string;
  reason: string;
}

const TIER_BASE: Record<RequirementTier, number> = { entry: 1.4, mid: 2.6, "high-end": 3.8, enthusiast: 4.8 };

/** How much a use-case mode nudges a category above/below the overall tier target. */
const TIER_ADJUST: Record<AIMode, Partial<Record<ComponentCategory, number>>> = {
  gaming: { gpu: 0.8, cpu: -0.2, cooler: -0.3 },
  productivity: { cpu: 0.6, gpu: -0.3, memory: 0.3 },
  "ai-ml": { gpu: 1.2, cpu: -0.2, case: -0.4, cooler: -0.3 },
  streaming: { gpu: 0.4, cpu: 0.5 },
  quiet: { case: 0.6, cooler: 0.8, gpu: -0.2 },
  sff: { case: -0.8, cooler: -0.3 },
};

function targetTier(tier: RequirementTier, mode: AIMode, category: ComponentCategory): number {
  const adjust = TIER_ADJUST[mode]?.[category] ?? 0;
  return Math.min(5, Math.max(1, TIER_BASE[tier] + adjust));
}

function resolveFormFactor(req: BuildRequirements): "itx" | "matx" | "atx" {
  if (req.formFactor === "itx" || req.mode === "sff") return "itx";
  if (req.formFactor === "matx") return "matx";
  return "atx";
}

function ratingFromTier(tier: number): PerformanceRating["rating"] {
  if (tier >= 4) return "Excellent";
  if (tier >= 3) return "Great";
  if (tier >= 1.8) return "Good";
  return "Limited";
}

function scoreFromRating(rating: PerformanceRating["rating"]): number {
  return { Excellent: 5, Great: 4, Good: 3, Limited: 2 }[rating];
}

/** Tier distance, with a small penalty for parts with no real product link so near-ties favor the one with a link. */
function tierDistance(part: PartOption, target: number): number {
  return Math.abs(part.tier - target) + (part.url ? 0 : 0.15);
}

function pickClosestByTier(pool: PartOption[], target: number): PartOption {
  return [...pool].sort((a, b) => tierDistance(a, target) - tierDistance(b, target))[0];
}

/** A case only ever needs to be as big as (or bigger than) the board it houses. */
function poolFor(category: ComponentCategory, mode: AIMode, formFactor: "itx" | "matx" | "atx"): PartOption[] {
  switch (category) {
    case "cpu":
      return CATALOG.cpu.filter((p) => p.socket === "AM5");
    case "motherboard":
      return CATALOG.motherboard.filter((m) => m.socket === "AM5" && m.formFactor === formFactor);
    case "case":
      return CATALOG.case.filter((c) => {
        if (formFactor === "itx") return c.formFactor === "itx";
        if (formFactor === "atx") return c.formFactor === "atx";
        return c.formFactor !== "itx";
      });
    case "cooler":
      return mode === "quiet" ? CATALOG.cooler.filter((c) => c.specs.Noise === "low" || (c.watts ?? 0) >= 250) : CATALOG.cooler;
    default:
      return CATALOG[category];
  }
}

function stepByField(pool: PartOption[], current: PartOption, field: "watts" | "tier", direction: 1 | -1): PartOption {
  const sorted = [...pool].sort((a, b) => (a[field] ?? 0) - (b[field] ?? 0));
  const idx = sorted.findIndex((p) => p.id === current.id);
  return sorted[idx + direction] ?? current;
}

function reasonFor(category: ComponentCategory, part: PartOption, req: BuildRequirements, mode: AIMode): string {
  const modeLabel = AI_MODE_LABEL[mode].toLowerCase();
  switch (category) {
    case "cpu":
      return req.primaryUse === "gaming" || mode === "gaming"
        ? `Your build is primarily gaming-focused, so I'm putting more toward the graphics card rather than extra CPU cores. The ${part.name} still gives ${req.games[0] ?? "your games"} plenty of headroom.`
        : `${part.name} gives you the multi-core performance ${modeLabel} workloads lean on, without starving the rest of the build.`;
    case "gpu":
      return req.resolution
        ? `${part.name} is the strongest graphics card that fits this tier at ${req.resolution}, so I prioritized it first.`
        : `${part.name} carries the most weight here since it drives performance more than any other single part for a ${modeLabel} build.`;
    case "motherboard":
      return `${part.name} covers what this build actually needs, DDR5 support and enough PCIe lanes for the graphics card, without paying for overclocking headroom you won't use.`;
    case "memory":
      return `${part.specs.Capacity} of ${part.specs.Speed} is the sweet spot for ${req.games[0] ?? "modern games"} and background multitasking without overspending on speed you won't feel.`;
    case "storage":
      return `${part.specs.Capacity} of NVMe storage keeps ${req.games.length ? req.games.join(", ") : "your games and apps"} loading fast with room to grow.`;
    case "psu":
      return `${part.name} keeps roughly 20% headroom above what the CPU and GPU draw under full load, which is what keeps a system stable for years.`;
    case "case":
      return mode === "quiet"
        ? `${part.name} is sound-dampened, which matters more than looks for a quiet build.`
        : `${part.name} fits every part in this build with room for airflow.`;
    case "cooler":
      return mode === "quiet"
        ? `${part.name} moves the same heat at a lower noise floor, which is the whole point of a quiet build.`
        : `${part.name} keeps the CPU cool under sustained load without overspending on cooling you don't need.`;
  }
}

function briefFor(part: PartOption): string {
  const specs = Object.entries(part.specs)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");
  return specs ? `${part.brand}, ${specs}` : part.brand;
}

function titleFor(req: BuildRequirements, mode: AIMode): string {
  const tierLabel = TIER_LABEL[req.tier];
  if (req.resolution && mode === "gaming") {
    return `${tierLabel} ${req.resolution} Gaming PC`;
  }
  return `${tierLabel} ${AI_MODE_LABEL[mode]} Build`;
}

/** PSU wattage headroom and cooler clearance/capacity are hard constraints, checked after every pick (deterministic or agent-chosen). */
function enforceHardConstraints(picks: Map<ComponentCategory, PartOption>): void {
  const draw = (picks.get("cpu")!.watts ?? 0) + (picks.get("gpu")!.watts ?? 0) + 90;
  let psu = picks.get("psu")!;
  let guard = 0;
  while ((psu.watts ?? 0) * 0.8 < draw && guard < 8) {
    const next = stepByField(CATALOG.psu, psu, "watts", 1);
    if (next.id === psu.id) break;
    psu = next;
    guard++;
  }
  picks.set("psu", psu);

  const coolerPoolFor = (maxHeight: number) =>
    CATALOG.cooler.filter((c) => (c.coolerHeightMm ?? 0) === 0 || (c.coolerHeightMm ?? 0) <= maxHeight);
  const maxHeight = picks.get("case")!.maxCoolerHeightMm ?? Infinity;
  let cooler = picks.get("cooler")!;
  if ((cooler.coolerHeightMm ?? 0) > maxHeight) {
    cooler = pickClosestByTier(coolerPoolFor(maxHeight), cooler.tier);
  }
  const cpuWatts = picks.get("cpu")!.watts ?? 0;
  guard = 0;
  while ((cooler.watts ?? 0) < cpuWatts && guard < 8) {
    const next = stepByField(coolerPoolFor(maxHeight), cooler, "watts", 1);
    if (next.id === cooler.id) break;
    cooler = next;
    guard++;
  }
  picks.set("cooler", cooler);
}

function finalize(
  picks: Map<ComponentCategory, PartOption>,
  req: BuildRequirements,
  mode: AIMode,
  agentReasons?: Partial<Record<ComponentCategory, string>>,
): Build {
  const components: Partial<Record<ComponentCategory, BuildComponentSlot>> = {};
  for (const cat of CATEGORY_ORDER) {
    const part = picks.get(cat)!;
    components[cat] = { part, reason: agentReasons?.[cat] ?? reasonFor(cat, part, req, mode) };
  }

  const gpuTier = components.gpu!.part.tier;
  const cpuTier = components.cpu!.part.tier;
  const memTier = components.memory!.part.tier;

  const resolutionBonus = req.resolution === "4K" ? -1 : req.resolution === "1080p" ? 2 : 0;
  const gamingRating = ratingFromTier(gpuTier + resolutionBonus);
  const performance: PerformanceRating[] = [
    { label: `${req.resolution ?? "1440p"} Gaming`, rating: gamingRating, score: scoreFromRating(gamingRating) },
  ];
  if (req.apps.length || req.primaryUse === "creator" || req.primaryUse === "productivity") {
    const rating = ratingFromTier(cpuTier);
    performance.push({ label: req.apps[0] ? capitalize(req.apps[0]) : "Creator workflows", rating, score: scoreFromRating(rating) });
  }
  if (mode === "streaming") {
    const rating = ratingFromTier(cpuTier);
    performance.push({ label: "Streaming", rating, score: scoreFromRating(rating) });
  }
  const multiRating = ratingFromTier((cpuTier + memTier) / 2);
  performance.push({ label: "Multitasking", rating: multiRating, score: scoreFromRating(multiRating) });

  const build: Build = {
    id: `build_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title: titleFor(req, mode),
    createdAt: new Date().toISOString(),
    requirements: req,
    components,
    performance,
    compatibility: [],
  };

  build.compatibility = runCompatibilityChecks(build);
  return build;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Deterministic baseline: always available, no LLM involved. */
export function assemble(req: BuildRequirements): Build {
  const mode = req.mode;
  const formFactor = resolveFormFactor(req);
  const picks = new Map<ComponentCategory, PartOption>();
  for (const cat of CATEGORY_ORDER) {
    picks.set(cat, pickClosestByTier(poolFor(cat, mode, formFactor), targetTier(req.tier, mode, cat)));
  }
  enforceHardConstraints(picks);
  return finalize(picks, req, mode);
}

/** Real candidates near the requirement's target tier for the agent to choose from; never invented, never off-catalog. */
export function buildCandidatePools(req: BuildRequirements): Record<ComponentCategory, BuildCandidate[]> {
  const mode = req.mode;
  const formFactor = resolveFormFactor(req);
  const pools = {} as Record<ComponentCategory, BuildCandidate[]>;
  for (const cat of CATEGORY_ORDER) {
    const target = targetTier(req.tier, mode, cat);
    const shortlist = [...poolFor(cat, mode, formFactor)]
      .sort((a, b) => tierDistance(a, target) - tierDistance(b, target))
      .slice(0, 8);
    pools[cat] = shortlist.map((p) => ({ id: p.id, name: p.name, tier: p.tier, brief: briefFor(p) }));
  }
  return pools;
}

/**
 * Turns the eve agent's picks into a finished build. Every pick is checked
 * against that category's real candidate shortlist; a pick that isn't in
 * the shortlist (invalid id, wrong category) is dropped and that category
 * falls back to the deterministic baseline pick instead.
 */
export function applySelection(req: BuildRequirements, picks: PartPick[]): Build {
  const baseline = assemble(req);
  const pools = buildCandidatePools(req);

  const resolved = new Map<ComponentCategory, PartOption>();
  const reasons: Partial<Record<ComponentCategory, string>> = {};
  for (const cat of CATEGORY_ORDER) {
    resolved.set(cat, baseline.components[cat]!.part);
  }
  for (const pick of picks) {
    const candidateIds = new Set(pools[pick.category]?.map((c) => c.id) ?? []);
    if (!candidateIds.has(pick.id)) continue;
    const part = CATALOG[pick.category].find((p) => p.id === pick.id);
    if (!part) continue;
    resolved.set(pick.category, part);
    reasons[pick.category] = pick.reason;
  }

  enforceHardConstraints(resolved);
  return finalize(resolved, req, req.mode, reasons);
}

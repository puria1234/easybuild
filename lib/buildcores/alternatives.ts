import { AlternativeOption, ComponentCategory, PartOption } from "@/lib/types";
import { CATALOG } from "./catalog";

export function getAlternatives(category: ComponentCategory, current: PartOption): AlternativeOption[] {
  let pool = CATALOG[category];

  if (category === "motherboard" || category === "case") {
    pool = pool.filter((p) => p.formFactor === current.formFactor);
  }
  if (category === "cpu") {
    pool = pool.filter((p) => p.socket === current.socket);
  }

  const sorted = [...pool].sort((a, b) => a.tier - b.tier || a.name.localeCompare(b.name));
  const idx = sorted.findIndex((p) => p.id === current.id);
  if (idx === -1) return [];

  const results: AlternativeOption[] = [];
  if (idx > 0) {
    const down = sorted.slice(0, idx).reverse().find((p) => p.tier < current.tier) ?? sorted[idx - 1];
    results.push({ part: down, tierDelta: down.tier - current.tier, relation: "downgrade" });
  }
  if (idx < sorted.length - 1) {
    const up = sorted.slice(idx + 1).find((p) => p.tier > current.tier) ?? sorted[idx + 1];
    results.push({ part: up, tierDelta: up.tier - current.tier, relation: "upgrade" });
  }
  return results;
}

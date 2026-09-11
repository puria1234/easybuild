import { ComponentCategory, PartOption } from "@/lib/types";
import cpuData from "./data/cpu.json";
import gpuData from "./data/gpu.json";
import motherboardData from "./data/motherboard.json";
import memoryData from "./data/memory.json";
import storageData from "./data/storage.json";
import psuData from "./data/psu.json";
import caseData from "./data/case.json";
import coolerData from "./data/cooler.json";

/**
 * Real parts, real specs: generated from buildcores/buildcores-open-db (see
 * `scripts/build-parts-index.mjs`) rather than hand-typed. The open dataset
 * has no pricing anywhere, so there is no dollar figure on any part here;
 * `tier` (1-5, computed from real specs against the rest of its category)
 * is what the AI builder targets instead of a price.
 *
 * Scoped to AM5 (AMD's current desktop platform) so the compatibility model
 * stays a single-socket world, same simplification the original hand-typed
 * catalog used.
 */
export const CATALOG: Record<ComponentCategory, PartOption[]> = {
  cpu: cpuData as PartOption[],
  gpu: gpuData as PartOption[],
  motherboard: motherboardData as PartOption[],
  memory: memoryData as PartOption[],
  storage: storageData as PartOption[],
  psu: psuData as PartOption[],
  case: caseData as PartOption[],
  cooler: coolerData as PartOption[],
};

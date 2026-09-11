export type ComponentCategory =
  | "cpu"
  | "gpu"
  | "motherboard"
  | "memory"
  | "storage"
  | "psu"
  | "case"
  | "cooler";

export const CATEGORY_LABEL: Record<ComponentCategory, string> = {
  cpu: "Processor",
  gpu: "Graphics Card",
  motherboard: "Motherboard",
  memory: "Memory",
  storage: "Storage",
  psu: "Power Supply",
  case: "Case",
  cooler: "Cooling",
};

export const CATEGORY_ORDER: ComponentCategory[] = [
  "cpu",
  "gpu",
  "motherboard",
  "memory",
  "storage",
  "psu",
  "case",
  "cooler",
];

export interface PartOption {
  id: string;
  category: ComponentCategory;
  name: string;
  brand: string;
  /** Thermal design power / draw in watts, used for PSU sizing. */
  watts?: number;
  /** Socket or platform, used for compatibility checks (cpu + motherboard). */
  socket?: string;
  /** Form factor, used for case + motherboard clearance checks. */
  formFactor?: string;
  /** Physical length in mm, used for gpu + case clearance checks. */
  lengthMm?: number;
  /** Max supported cooler height in mm, used for case + cooler checks. */
  maxCoolerHeightMm?: number;
  coolerHeightMm?: number;
  specs: Record<string, string>;
  /** 1-5 rank computed from real specs against the rest of its category pool. */
  tier: 1 | 2 | 3 | 4 | 5;
  /** Real retailer product page (Amazon or Newegg), when the open-db record has one. */
  url?: string;
}

export interface BuildComponentSlot {
  part: PartOption;
  reason: string;
}

export type CompatibilityStatus = "ok" | "warning" | "error";

export interface CompatibilityCheck {
  id: string;
  label: string;
  status: CompatibilityStatus;
  message?: string;
  suggestion?: string;
}

export interface PerformanceRating {
  label: string;
  rating: "Excellent" | "Great" | "Good" | "Limited";
  score: number;
}

export type RequirementTier = "entry" | "mid" | "high-end" | "enthusiast";

export const TIER_LABEL: Record<RequirementTier, string> = {
  entry: "Entry",
  mid: "Mid-Range",
  "high-end": "High-End",
  enthusiast: "Enthusiast",
};

export const TIER_ORDER: RequirementTier[] = ["entry", "mid", "high-end", "enthusiast"];

export type AIMode =
  | "gaming"
  | "productivity"
  | "ai-ml"
  | "streaming"
  | "quiet"
  | "sff";

export const AI_MODE_LABEL: Record<AIMode, string> = {
  gaming: "Gaming",
  productivity: "Productivity",
  "ai-ml": "AI / ML",
  streaming: "Streaming",
  quiet: "Quiet",
  sff: "Small Form Factor",
};

export interface BuildRequirements {
  rawPrompt: string;
  tier: RequirementTier;
  primaryUse: "gaming" | "productivity" | "creator" | "mixed";
  games: string[];
  apps: string[];
  resolution?: "1080p" | "1440p" | "4K";
  fpsTarget?: number;
  formFactor?: "atx" | "matx" | "itx";
  quiet?: boolean;
  mode: AIMode;
}

export interface Build {
  id: string;
  title: string;
  createdAt: string;
  requirements: BuildRequirements;
  components: Partial<Record<ComponentCategory, BuildComponentSlot>>;
  performance: PerformanceRating[];
  compatibility: CompatibilityCheck[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: string;
}

export interface AlternativeOption {
  part: PartOption;
  tierDelta: number;
  relation: "downgrade" | "sidegrade" | "upgrade";
}

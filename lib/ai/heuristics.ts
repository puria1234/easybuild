import { AIMode, BuildRequirements, RequirementTier } from "@/lib/types";

/**
 * Deterministic, zero-dependency parsing used for the static marketing
 * "Explore builds" examples (`lib/explore-builds.ts`), which render at build
 * time without a live agent call. The real chat builder in `/build` talks to
 * the eve agent (`agent/`) instead.
 */

const GAME_KEYWORDS = [
  "fortnite",
  "valorant",
  "warzone",
  "cs2",
  "counter-strike",
  "csgo",
  "apex",
  "league of legends",
  "cyberpunk",
  "baldur's gate",
  "helldivers",
  "minecraft",
  "overwatch",
  "call of duty",
];

const CREATOR_KEYWORDS = [
  "blender",
  "premiere",
  "davinci",
  "after effects",
  "photoshop",
  "unreal",
  "unity",
  "render",
  "video editing",
  "3d modeling",
];

const AI_ML_KEYWORDS = ["machine learning", "stable diffusion", "pytorch", "tensorflow", "llm", "train models", "ai training"];

function extractTier(lower: string): RequirementTier {
  if (/best|no expense|money is no object|enthusiast|top of the line|flagship|fastest possible|no budget cap|max performance/.test(lower))
    return "enthusiast";
  if (/high.?end|great performance|powerful|serious/.test(lower)) return "high-end";
  if (/budget|cheap|affordable|entry.?level|starter|basic|best value|value build/.test(lower)) return "entry";
  return "mid";
}

function extractResolution(lower: string): BuildRequirements["resolution"] {
  if (/4k|2160p/.test(lower)) return "4K";
  if (/1440p|1440/.test(lower)) return "1440p";
  if (/1080p|1080/.test(lower)) return "1080p";
  return undefined;
}

function extractFps(lower: string): number | undefined {
  const match = lower.match(/(\d{2,3})\s?fps/);
  return match ? parseInt(match[1], 10) : undefined;
}

function extractMode(lower: string): AIMode {
  if (AI_ML_KEYWORDS.some((k) => lower.includes(k))) return "ai-ml";
  if (/quiet|silent/.test(lower)) return "quiet";
  if (/itx|mini|compact|small form factor|sff/.test(lower)) return "sff";
  if (/streaming|stream|twitch|obs/.test(lower)) return "streaming";
  if (/workstation|blender|render|editing|productivity/.test(lower)) return "productivity";
  return "gaming";
}

function extractFormFactor(lower: string): BuildRequirements["formFactor"] {
  if (/itx|mini|compact|small form factor|sff/.test(lower)) return "itx";
  if (/micro.?atx|matx/.test(lower)) return "matx";
  return undefined;
}

export function parseRequestHeuristic(prompt: string): BuildRequirements {
  const lower = prompt.toLowerCase();
  const games = GAME_KEYWORDS.filter((g) => lower.includes(g));
  const apps = CREATOR_KEYWORDS.filter((a) => lower.includes(a)).concat(AI_ML_KEYWORDS.filter((a) => lower.includes(a)));
  const mode = extractMode(lower);
  const primaryUse: BuildRequirements["primaryUse"] =
    apps.length && games.length ? "mixed" : apps.length ? "productivity" : "gaming";

  return {
    rawPrompt: prompt,
    tier: extractTier(lower),
    primaryUse,
    games,
    apps,
    resolution: extractResolution(lower),
    fpsTarget: extractFps(lower),
    formFactor: extractFormFactor(lower),
    quiet: /quiet|silent/.test(lower),
    mode,
  };
}

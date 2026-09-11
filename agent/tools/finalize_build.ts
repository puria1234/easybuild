import { defineTool } from "eve/tools";
import { z } from "zod";
import { applySelection } from "../../lib/ai/builder";
import { BuildRequirements } from "../../lib/types";

const requirementsSchema = z.object({
  rawPrompt: z.string(),
  tier: z.enum(["entry", "mid", "high-end", "enthusiast"]),
  primaryUse: z.enum(["gaming", "productivity", "creator", "mixed"]),
  games: z.array(z.string()).default([]),
  apps: z.array(z.string()).default([]),
  resolution: z.enum(["1080p", "1440p", "4K"]).optional(),
  fpsTarget: z.number().optional(),
  formFactor: z.enum(["atx", "matx", "itx"]).optional(),
  quiet: z.boolean().default(false),
  mode: z.enum(["gaming", "productivity", "ai-ml", "streaming", "quiet", "sff"]),
});

export default defineTool({
  description:
    "Build the final, complete PC from your picks. Pass the same requirements you gave get_part_candidates, plus exactly one pick per category (cpu, gpu, motherboard, memory, storage, psu, case, cooler) using only ids that get_part_candidates gave you. This validates power supply headroom and cooler clearance, correcting a pick only when it can't physically or electrically work, and returns the finished build with performance ratings and compatibility results.",
  inputSchema: z.object({
    requirements: requirementsSchema,
    picks: z
      .array(
        z.object({
          category: z.enum(["cpu", "gpu", "motherboard", "memory", "storage", "psu", "case", "cooler"]),
          id: z.string().describe("Must be exactly one of the ids get_part_candidates gave you for this category."),
          reason: z.string().describe("One concrete sentence explaining why this part fits, referencing its real name or specs."),
        }),
      )
      .length(8),
  }),
  label: {
    start: () => "Finalizing the build",
  },
  async execute({ requirements, picks }) {
    const req: BuildRequirements = {
      rawPrompt: requirements.rawPrompt,
      tier: requirements.tier,
      primaryUse: requirements.primaryUse,
      games: requirements.games,
      apps: requirements.apps,
      resolution: requirements.resolution,
      fpsTarget: requirements.fpsTarget,
      formFactor: requirements.formFactor,
      quiet: requirements.quiet,
      mode: requirements.mode,
    };
    return applySelection(req, picks);
  },
});

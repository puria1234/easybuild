import { defineTool } from "eve/tools";
import { z } from "zod";
import { buildCandidatePools } from "../../lib/ai/builder";
import { BuildRequirements } from "../../lib/types";

const requirementsSchema = z.object({
  rawPrompt: z.string().describe("A short natural-language summary of what the person asked for, to store on the build."),
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
    "Get real, currently-cataloged PC parts that fit the given requirements, grouped by category (cpu, gpu, motherboard, memory, storage, psu, case, cooler). Every candidate is already filtered to the same platform and compatible form factor. Call this before finalize_build -- you can only pick ids that appear here.",
  inputSchema: requirementsSchema,
  label: {
    start: (input) => `Finding parts for a ${input.tier} ${input.mode} build`,
  },
  async execute(input) {
    const requirements: BuildRequirements = {
      rawPrompt: input.rawPrompt,
      tier: input.tier,
      primaryUse: input.primaryUse,
      games: input.games,
      apps: input.apps,
      resolution: input.resolution,
      fpsTarget: input.fpsTarget,
      formFactor: input.formFactor,
      quiet: input.quiet,
      mode: input.mode,
    };
    return {
      requirements,
      candidates: buildCandidatePools(requirements),
    };
  },
});

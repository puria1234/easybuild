import { assemble } from "@/lib/ai/builder";
import { parseRequestHeuristic } from "@/lib/ai/heuristics";
import { Build } from "@/lib/types";

export interface ExploreBuildPreset {
  slug: string;
  title: string;
  prompt: string;
  blurb: string;
}

export const EXPLORE_PRESETS: ExploreBuildPreset[] = [
  {
    slug: "entry-gaming",
    title: "Entry Gaming PC",
    prompt: "Build me an entry-level gaming PC for 1080p, best value",
    blurb: "Solid 1080p frame rates without paying for headroom you won't use.",
  },
  {
    slug: "1440p-gaming-high-end",
    title: "High-End 1440p Gaming PC",
    prompt: "I want a high-end PC for 1440p gaming in Fortnite and Valorant",
    blurb: "The most common pairing in real 1440p builds right now: a Ryzen X3D chip and a 70-class GPU.",
  },
  {
    slug: "creator-workstation-enthusiast",
    title: "Enthusiast Creator Workstation",
    prompt: "Build an enthusiast workstation for Blender and Premiere",
    blurb: "Rendering and exports that don't leave you waiting.",
  },
  {
    slug: "silent-productivity",
    title: "Silent Productivity PC",
    prompt: "Build a high-end quiet workstation for Blender, keep it silent",
    blurb: "Workstation power that never announces itself.",
  },
  {
    slug: "compact-itx",
    title: "Compact ITX Build",
    prompt: "Make me a mid-range compact ITX gaming build",
    blurb: "Full-size performance, a fraction of the footprint.",
  },
];

export function getExploreBuilds(): (ExploreBuildPreset & { build: Build })[] {
  return EXPLORE_PRESETS.map((preset) => {
    const requirements = parseRequestHeuristic(preset.prompt);
    const build = assemble(requirements);
    build.title = preset.title;
    return { ...preset, build };
  });
}

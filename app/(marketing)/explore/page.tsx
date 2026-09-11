import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AmbientVideo } from "@/components/media/ambient-video";
import { getExploreBuilds } from "@/lib/explore-builds";
import { CATEGORY_ORDER, TIER_LABEL } from "@/lib/types";

export const metadata = {
  title: "Explore Builds | EasyBuild.",
};

export default function ExplorePage() {
  const builds = getExploreBuilds();

  return (
    <div className="flex flex-1 flex-col">
      <div className="relative h-[260px] overflow-hidden border-b border-border/60 bg-background sm:h-[320px]">
        <AmbientVideo src="/media/pc-interior-flythrough.mp4" className="h-full w-full opacity-70" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, color-mix(in oklab, var(--background) 20%, transparent) 0%, var(--background) 92%)",
          }}
        />
        <div className="absolute inset-0 flex items-end">
          <div className="mx-auto w-full max-w-5xl px-5 pb-8 sm:px-8">
            <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Explore builds</h1>
            <p className="mt-3 max-w-lg text-muted-foreground">
              Real configurations the AI has already put together. Start from one instead of a blank page.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-5xl px-5 py-14 sm:px-8">
        <div className="divide-y divide-border/60 border-t border-border/60">
          {builds.map(({ slug, title, blurb, prompt, build }) => {
            const keyParts = [build.components.cpu, build.components.gpu, build.components.memory].filter(Boolean);
            return (
              <div key={slug} className="grid gap-6 py-8 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h2 className="font-heading text-xl font-medium">{title}</h2>
                    <span className="font-data text-lg text-primary">{TIER_LABEL[build.requirements.tier]}</span>
                  </div>
                  <p className="mt-1.5 max-w-md text-sm text-muted-foreground">{blurb}</p>

                  <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1.5">
                    {keyParts.map((slot) =>
                      slot ? (
                        <span key={slot.part.id} className="text-xs text-muted-foreground">
                          {slot.part.name}
                        </span>
                      ) : null,
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {build.performance.slice(0, 3).map((p) => (
                      <span key={p.label} className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground">
                        {p.label} &middot; {p.rating}
                      </span>
                    ))}
                  </div>
                </div>

                <Link
                  href={`/build?q=${encodeURIComponent(prompt)}`}
                  className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border px-4 py-2 text-sm transition-colors hover:border-primary/50 hover:text-primary"
                >
                  Build something similar
                  <ArrowRight size={14} />
                </Link>
              </div>
            );
          })}
        </div>

        <p className="mt-10 text-xs text-muted-foreground">
          {CATEGORY_ORDER.length} components are checked for compatibility in every build above before it&apos;s shown to you.
        </p>
      </div>
    </div>
  );
}

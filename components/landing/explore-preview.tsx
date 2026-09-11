import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getExploreBuilds } from "@/lib/explore-builds";
import { TIER_LABEL } from "@/lib/types";

export function ExplorePreview() {
  const builds = getExploreBuilds();

  return (
    <section className="border-t border-border/60 py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-md">
            <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Explore builds</h2>
            <p className="mt-3 text-muted-foreground">Real configurations the AI has already put together.</p>
          </div>
          <Link href="/explore" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            See all builds
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="mt-10 flex gap-5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {builds.map(({ slug, title, blurb, prompt, build }) => {
            const wide = build.requirements.tier === "high-end" || build.requirements.tier === "enthusiast";
            return (
              <Link
                key={slug}
                href={`/build?q=${encodeURIComponent(prompt)}`}
                className={`group relative shrink-0 overflow-hidden rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/50 ${
                  wide ? "w-80" : "w-64"
                }`}
              >
                <div className="font-data text-2xl text-foreground">{TIER_LABEL[build.requirements.tier]}</div>
                <h3 className="mt-3 font-heading text-base font-medium">{title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{blurb}</p>
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {build.performance.slice(0, 2).map((p) => (
                    <span key={p.label} className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground">
                      {p.label} &middot; {p.rating}
                    </span>
                  ))}
                </div>
                <div className="mt-5 flex items-center gap-1.5 text-xs text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Build something similar
                  <ArrowRight size={12} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

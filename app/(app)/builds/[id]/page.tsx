"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Boxes, Sparkles } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { getSavedBuild, saveBuildToHistory } from "@/lib/build-history";
import { runCompatibilityChecks } from "@/lib/buildcores";
import { Build, CATEGORY_ORDER, ComponentCategory, PartOption } from "@/lib/types";
import { SummaryPanel } from "@/components/builder/summary-panel";

const ALL_REVEALED = new Set(CATEGORY_ORDER);

export default function SavedBuildPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const [build, setBuild] = useState<Build | null | undefined>(undefined);
  const [saved, setSaved] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getSavedBuild(id).then((b) => {
      setBuild(b);
      setSaved(true);
    });
  }, [user, id]);

  function onSwapPart(category: ComponentCategory, part: PartOption) {
    setBuild((current) => {
      if (!current) return current;
      const previousName = current.components[category]?.part.name ?? "the previous part";
      const draft: Build = {
        ...current,
        components: {
          ...current.components,
          [category]: { part, reason: `Swapped in as an alternative to ${previousName}.` },
        },
      };
      draft.compatibility = runCompatibilityChecks(draft);
      return draft;
    });
    setSaved(false);
  }

  async function onSave() {
    if (!build) return;
    setSaveError(null);
    const result = await saveBuildToHistory(build);
    if (result.ok) {
      setSaved(true);
    } else {
      setSaveError(result.message ?? "Something went wrong. Try again in a moment.");
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
      <Link href="/builds" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={14} />
        My builds
      </Link>

      {authLoading || build === undefined ? (
        <div className="mt-10 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : !user ? (
        <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-20 text-center">
          <Boxes size={22} className="text-muted-foreground/60" />
          <p className="text-sm text-muted-foreground">Sign in to see this build.</p>
        </div>
      ) : build === null ? (
        <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-20 text-center">
          <Boxes size={22} className="text-muted-foreground/60" />
          <p className="text-sm text-muted-foreground">Couldn&apos;t find that build.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-border/60">
          <div className="flex items-center justify-between border-b border-border/60 bg-card px-4 py-3">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">Saved build</span>
            <Link
              href={`/build?continue=${build.id}`}
              className="flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground"
            >
              <Sparkles size={12} />
              Continue with AI
            </Link>
          </div>
          <SummaryPanel build={build} revealed={ALL_REVEALED} onSwapPart={onSwapPart} onSave={onSave} saved={saved} saveError={saveError} />
        </div>
      )}
    </div>
  );
}

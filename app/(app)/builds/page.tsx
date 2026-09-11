"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Boxes, Trash2 } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { loadBuildHistory, removeBuildFromHistory } from "@/lib/build-history";
import { Build, TIER_LABEL } from "@/lib/types";

export default function MyBuildsPage() {
  const { user, loading: authLoading } = useAuth();
  const [builds, setBuilds] = useState<Build[] | null>(null);

  useEffect(() => {
    if (!user) {
      queueMicrotask(() => setBuilds(null));
      return;
    }
    loadBuildHistory().then(setBuilds);
  }, [user]);

  async function remove(id: string) {
    await removeBuildFromHistory(id);
    setBuilds((prev) => prev?.filter((b) => b.id !== id) ?? prev);
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-16 sm:px-8 sm:py-20">
      <div className="max-w-lg">
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">My builds</h1>
        <p className="mt-3 text-muted-foreground">Builds you&apos;ve saved from the AI builder, tied to your account.</p>
      </div>

      {authLoading ? (
        <div className="mt-14 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : !user ? (
        <div className="mt-14 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-20 text-center">
          <Boxes size={22} className="text-muted-foreground/60" />
          <p className="text-sm text-muted-foreground">Sign in to see builds you&apos;ve saved.</p>
          <Link href="/sign-in?next=/builds" className="mt-1 flex items-center gap-1.5 text-sm text-primary">
            Sign in
            <ArrowRight size={14} />
          </Link>
        </div>
      ) : builds === null ? (
        <div className="mt-14 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : builds.length === 0 ? (
        <div className="mt-14 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-20 text-center">
          <Boxes size={22} className="text-muted-foreground/60" />
          <p className="text-sm text-muted-foreground">You haven&apos;t saved a build yet.</p>
          <Link href="/build" className="mt-1 flex items-center gap-1.5 text-sm text-primary">
            Start building
            <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="mt-14 divide-y divide-border/60 border-t border-border/60">
          {builds.map((build) => (
            <div key={build.id} className="flex items-center justify-between gap-4 py-6">
              <div>
                <div className="flex items-baseline gap-3">
                  <h2 className="font-heading text-lg font-medium">{build.title}</h2>
                  <span className="font-data text-primary">{TIER_LABEL[build.requirements.tier]}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Saved {new Date(build.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/builds/${build.id}`}
                  className="rounded-full border border-border px-3.5 py-1.5 text-xs transition-colors hover:border-primary/50 hover:text-primary"
                >
                  View
                </Link>
                <button
                  onClick={() => remove(build.id)}
                  aria-label="Remove build"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

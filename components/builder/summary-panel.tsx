"use client";

import { motion } from "framer-motion";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { Build, CATEGORY_ORDER, ComponentCategory, PartOption, RequirementTier } from "@/lib/types";
import { ComponentCard } from "./component-card";
import { CompatibilityChecklist } from "./compatibility-checklist";
import { TierSelector } from "./tier-selector";
import { PerformanceSummary } from "./performance-summary";

export function SummaryPanel({
  build,
  revealed,
  onSwapPart,
  onTierChange,
  onSave,
  saved,
}: {
  build: Build;
  revealed: Set<ComponentCategory>;
  onSwapPart: (category: ComponentCategory, part: PartOption) => void;
  onTierChange?: (t: RequirementTier) => void;
  onSave: () => void;
  saved: boolean;
}) {
  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="sticky top-0 z-10 border-b border-border/60 bg-card px-4 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">Your build</span>
          <button
            onClick={onSave}
            className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-primary"
          >
            {saved ? <BookmarkCheck size={13} className="text-primary" /> : <Bookmark size={13} />}
            {saved ? "Saved" : "Save build"}
          </button>
        </div>
        <div className="mx-auto max-w-2xl">
          <motion.div key={build.title} initial={{ opacity: 0.5 }} animate={{ opacity: 1 }} className="mt-1 font-heading text-2xl font-semibold tracking-tight">
            {build.title}
          </motion.div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-5">
        <PerformanceSummary performance={build.performance} />
        {onTierChange && <TierSelector tier={build.requirements.tier} onChange={onTierChange} />}
        <CompatibilityChecklist checks={build.compatibility} />

        <div>
          <div className="mb-2.5 text-[11px] uppercase tracking-wide text-muted-foreground">Components</div>
          <div className="space-y-2">
            {CATEGORY_ORDER.map((cat, i) => {
              const slot = build.components[cat];
              if (!slot) return null;
              const isRevealed = revealed.has(cat);
              return (
                <motion.div
                  key={cat}
                  initial={{ opacity: 0, y: 10 }}
                  animate={isRevealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                  transition={{ duration: 0.35, delay: i * 0.03, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  <ComponentCard
                    category={cat}
                    slot={slot}
                    weight={cat === "cpu" || cat === "gpu" ? "primary" : "secondary"}
                    onSwap={(part) => onSwapPart(cat, part)}
                  />
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { RequirementTier, TIER_LABEL, TIER_ORDER } from "@/lib/types";
import { cn } from "@/lib/utils";

export function TierSelector({ tier, onChange }: { tier: RequirementTier; onChange: (t: RequirementTier) => void }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Quality level</div>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {TIER_ORDER.map((t) => (
          <button
            key={t}
            onClick={() => onChange(t)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs transition-colors",
              tier === t
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            {TIER_LABEL[t]}
          </button>
        ))}
      </div>
    </div>
  );
}

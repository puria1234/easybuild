"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Cpu, Gpu, CircuitBoard, MemoryStick, HardDrive, PlugZap, Box, Fan, ExternalLink, type LucideIcon } from "lucide-react";
import { AlternativeOption, BuildComponentSlot, CATEGORY_LABEL, ComponentCategory, PartOption } from "@/lib/types";
import { getAlternatives } from "@/lib/buildcores";
import { cn } from "@/lib/utils";

const CATEGORY_ICON: Record<ComponentCategory, LucideIcon> = {
  cpu: Cpu,
  gpu: Gpu,
  motherboard: CircuitBoard,
  memory: MemoryStick,
  storage: HardDrive,
  psu: PlugZap,
  case: Box,
  cooler: Fan,
};

function TierDots({ tier }: { tier: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={cn("h-1.5 w-1.5 rounded-full", i < tier ? "bg-primary" : "bg-muted")} />
      ))}
    </div>
  );
}

function AlternativeButton({ alt, onSelect }: { alt: AlternativeOption; onSelect: () => void }) {
  const label = alt.relation === "upgrade" ? "Upgrade" : "Alternative";

  return (
    <button
      onClick={onSelect}
      className="flex min-w-[9.5rem] flex-1 flex-col items-start gap-1 rounded-lg border border-border px-3 py-2.5 text-left transition-colors hover:border-primary/50 hover:bg-surface-raised"
    >
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-sm font-medium leading-snug">{alt.part.name}</span>
      <TierDots tier={alt.part.tier} />
    </button>
  );
}

export function ComponentCard({
  category,
  slot,
  weight = "secondary",
  onSwap,
}: {
  category: ComponentCategory;
  slot: BuildComponentSlot;
  weight?: "primary" | "secondary";
  onSwap: (part: PartOption) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const alternatives = getAlternatives(category, slot.part);
  const Icon = CATEGORY_ICON[category];

  return (
    <div
      className={cn(
        "rounded-xl border transition-colors",
        expanded ? "border-primary/50 bg-surface-raised" : "border-border bg-card",
      )}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 px-3.5 py-3 text-left"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon size={20} strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{CATEGORY_LABEL[category]}</div>
          <div className={cn("mt-0.5 truncate font-medium", weight === "primary" ? "text-[15px]" : "text-sm")}>{slot.part.name}</div>
        </div>
        <TierDots tier={slot.part.tier} />
        <ChevronDown size={15} className={cn("shrink-0 text-muted-foreground transition-transform", expanded && "rotate-180")} />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="px-3.5 pb-3.5">
              <div className="rounded-lg bg-muted/60 p-3">
                <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Why I chose this</div>
                <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">{slot.reason}</p>
              </div>

              {slot.part.url && (
                <a
                  href={slot.part.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  View product
                  <ExternalLink size={13} />
                </a>
              )}

              {alternatives.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {alternatives.map((alt) => (
                    <AlternativeButton key={alt.part.id} alt={alt} onSelect={() => onSwap(alt.part)} />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Check, XCircle } from "lucide-react";
import { CompatibilityCheck } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICON = {
  ok: Check,
  warning: AlertTriangle,
  error: XCircle,
};

const COLOR = {
  ok: "text-success bg-success/15",
  warning: "text-warning bg-warning/15",
  error: "text-destructive bg-destructive/15",
};

export function CompatibilityChecklist({ checks }: { checks: CompatibilityCheck[] }) {
  const issues = checks.filter((c) => c.status !== "ok");

  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Build compatibility</div>
      <ul className="mt-2.5 space-y-1.5">
        {checks.map((check, i) => {
          const Icon = ICON[check.status];
          return (
            <motion.li
              key={check.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className="flex items-center gap-2.5 text-sm"
            >
              <span className={cn("flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full", COLOR[check.status])}>
                <Icon size={11} />
              </span>
              <span className="text-foreground/90">{check.label}</span>
            </motion.li>
          );
        })}
      </ul>

      {issues.length > 0 && (
        <div className="mt-3 space-y-2">
          {issues.map((issue) => (
            <div key={issue.id} className="rounded-lg border border-warning/30 bg-warning/10 p-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-warning">
                <AlertTriangle size={12} />
                Potential issue
              </div>
              <p className="mt-1 text-sm text-foreground/90">{issue.message}</p>
              {issue.suggestion && <p className="mt-1 text-xs text-muted-foreground">Suggested fix: {issue.suggestion}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

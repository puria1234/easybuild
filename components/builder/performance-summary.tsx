import { PerformanceRating } from "@/lib/types";

export function PerformanceSummary({ performance }: { performance: PerformanceRating[] }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Performance</div>
      <div className="mt-2.5 space-y-2">
        {performance.map((p) => (
          <div key={p.label} className="flex items-center justify-between text-sm">
            <span className="text-foreground/90">{p.label}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">{p.rating}</span>
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }, (_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 w-1.5 rounded-full ${i < p.score ? "bg-primary" : "bg-muted"}`}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

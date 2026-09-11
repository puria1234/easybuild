import { Check, X } from "lucide-react";

const IS = [
  "An AI that assembles a complete, compatible build from one sentence",
  "Real reasoning behind every part it picks, not just a spec sheet",
  "Free to explore, no account needed until you want to save a build",
];

const ISNT = [
  "A retailer: it doesn't sell, ship, or hold stock of anything",
  "A price-tracking tool; it ranks parts by real specs, not by cost",
  "A replacement for reading reviews on a build you're serious about",
];

export function IsIsnt() {
  return (
    <section className="border-t border-border/60 py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="max-w-md">
          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">What EasyBuild is</h2>
        </div>

        <div className="mt-12 grid gap-10 sm:grid-cols-2 sm:gap-16">
          <ul className="space-y-4">
            {IS.map((line) => (
              <li key={line} className="flex items-start gap-3 text-sm text-foreground/90">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                  <Check size={12} />
                </span>
                {line}
              </li>
            ))}
          </ul>

          <div>
            <h3 className="mb-4 font-heading text-lg font-medium text-muted-foreground">What it isn&apos;t</h3>
            <ul className="space-y-4">
              {ISNT.map((line) => (
                <li key={line} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <X size={12} />
                  </span>
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

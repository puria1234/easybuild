const FAQS = [
  {
    q: "Is this actually AI, or just a form with extra steps?",
    a: "When a model is configured, an LLM reads your request and any follow-up like \"make it quieter.\" Picking the actual parts, checking compatibility, and pricing stays fully deterministic code, so the AI never invents a part that doesn't exist or gets a socket wrong.",
  },
  {
    q: "Where do the prices come from?",
    a: "Real, current listings pulled from BuildCores' public catalog. They're a snapshot from when this was built, not a live feed, so treat them as a strong estimate rather than a guaranteed checkout price.",
  },
  {
    q: "Can I actually buy the parts here?",
    a: "Not yet. EasyBuild is a planner: it tells you exactly what to buy and why. You take the list to whichever retailer you trust.",
  },
  {
    q: "How thorough is the compatibility check?",
    a: "It checks the fit points that actually break builds: CPU socket, RAM support, GPU and cooler clearance, PSU headroom, and case form factor, every time a part changes, not just at the end.",
  },
  {
    q: "Do you sell or share my data?",
    a: "No. An account only exists to save your builds to your own history. Nobody else can see them.",
  },
];

export function FAQ() {
  return (
    <section className="border-t border-border/60 py-24 sm:py-28">
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        <div className="max-w-md">
          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Common questions</h2>
          <p className="mt-3 text-muted-foreground">Questions we hear all the time.</p>
        </div>

        <div className="mt-10 divide-y divide-border/60 border-t border-border/60">
          {FAQS.map((item) => (
            <details key={item.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-foreground marker:content-none">
                {item.q}
                <span className="shrink-0 text-lg text-muted-foreground transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

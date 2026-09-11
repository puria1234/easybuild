const STEPS = [
  {
    n: "01",
    title: "Tell it what you're building",
    body: "Games, software, resolution, quality level, noise tolerance, form factor: describe it the way you'd tell a friend, not a spec sheet.",
  },
  {
    n: "02",
    title: "It builds your configuration",
    body: "Parts are selected one at a time: CPU, GPU, motherboard, memory, storage, PSU, case, and cooling, each with the reasoning behind it.",
  },
  {
    n: "03",
    title: "It checks everything fits",
    body: "Socket, clearance, power headroom, and cooling are verified automatically, before you ever see a part that doesn't belong.",
  },
  {
    n: "04",
    title: "You inspect and refine it",
    body: "Swap a part for an alternative or change the quality level, and the AI adjusts the whole configuration to match.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-border/60 py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="max-w-md">
          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">How it works</h2>
          <p className="mt-3 text-muted-foreground">Four steps from a sentence to a finished, verified build.</p>
        </div>

        <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <div key={step.n} className="border-t border-border pt-5">
              <div className="font-data text-sm text-primary">{step.n}</div>
              <h3 className="mt-3 font-heading text-lg font-medium">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

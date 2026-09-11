import { AmbientVideo } from "@/components/media/ambient-video";

export function AssemblyCinematic() {
  return (
    <section className="border-t border-border/60 py-24 sm:py-28">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 sm:px-8 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-card lg:order-2">
          <AmbientVideo src="/media/build-assembly.mp4" className="h-full w-full" />
        </div>
        <div className="lg:order-1">
          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Built one decision at a time
          </h2>
          <p className="mt-4 max-w-md text-muted-foreground">
            The AI doesn&apos;t hand you a parts list. It reasons through the build the way an expert would: CPU
            first, then GPU, then everything that has to fit around them, checking every connection as it goes.
          </p>
          <p className="mt-4 max-w-md text-muted-foreground">
            You see each choice as it&apos;s made, with the reasoning behind it, so the final build never feels
            like a black box.
          </p>
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ClosingCTA() {
  return (
    <section className="border-t border-border/60 py-24 text-center sm:py-28">
      <div className="mx-auto max-w-xl px-5 sm:px-8">
        <h2 className="text-balance font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          Less guessing. More building.
        </h2>
        <p className="mt-4 text-muted-foreground">
          Tell EasyBuild what you want to do, and get a real, compatible build back in seconds.
        </p>
        <Link href="/build" className={cn(buttonVariants({ size: "lg" }), "mt-8 rounded-full px-8")}>
          Start Building
        </Link>
      </div>
    </section>
  );
}

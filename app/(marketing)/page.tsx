import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { AssemblyCinematic } from "@/components/landing/assembly-cinematic";
import { ExplorePreview } from "@/components/landing/explore-preview";
import { IsIsnt } from "@/components/landing/is-isnt";
import { ClosingCTA } from "@/components/landing/closing-cta";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <Hero />
      <HowItWorks />
      <AssemblyCinematic />
      <ExplorePreview />
      <IsIsnt />
      <ClosingCTA />
    </div>
  );
}

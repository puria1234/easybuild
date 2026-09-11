"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Muted, looping background video that only starts loading once it's near
 * the viewport, and never autoplays for viewers who prefer reduced motion
 * (it simply isn't rendered, leaving whatever sits behind it).
 */
export function AmbientVideo({ src, className }: { src: string; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [reducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={cn("overflow-hidden", className)}>
      {shouldLoad && !reducedMotion && (
        <video autoPlay muted loop playsInline preload="none" className="h-full w-full object-cover" src={src} />
      )}
    </div>
  );
}

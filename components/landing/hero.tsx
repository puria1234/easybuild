"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion, type Variants } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "Build me a $1,500 gaming PC",
  "I want the best PC for Blender",
  "Upgrade my current PC",
  "Build a silent workstation",
  "Make me a compact ITX build",
];

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } },
};

export function Hero() {
  const router = useRouter();
  const [value, setValue] = useState("");

  function submit(prompt: string) {
    const q = prompt.trim();
    if (!q) return;
    router.push(`/build?q=${encodeURIComponent(q)}`);
  }

  return (
    <section className="relative overflow-hidden pt-36 pb-24 sm:pt-44 sm:pb-32">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-20 bg-background">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="h-full w-full object-cover opacity-45"
          src="/media/hero-pc-studio.mp4"
        />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(to bottom, color-mix(in oklab, var(--background) 55%, transparent) 0%, var(--background) 78%), radial-gradient(ellipse 70% 55% at 50% 15%, transparent 0%, color-mix(in oklab, var(--background) 40%, transparent) 60%, var(--background) 100%)",
        }}
      />

      <motion.div
        variants={container}
        initial="hidden"
        animate="visible"
        className="mx-auto flex max-w-3xl flex-col items-center px-5 text-center sm:px-8"
      >
        <motion.h1
          variants={item}
          className="text-balance font-heading text-[2.6rem] font-semibold leading-[1.05] tracking-tight sm:text-6xl"
        >
          Build your PC with AI<span className="text-primary">.</span>
        </motion.h1>

        <motion.p variants={item} className="mt-5 max-w-lg text-balance text-base text-muted-foreground sm:text-lg">
          Tell us what you want to do. We&apos;ll find the parts, check compatibility, and build it with you.
        </motion.p>

        <motion.div variants={item} className="mt-10 w-full">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit(value);
            }}
            className={cn(
              "group relative flex items-end gap-2 rounded-2xl border border-border bg-card p-3 pl-5 shadow-[0_0_0_1px_rgba(0,0,0,0)] transition-colors",
              "focus-within:border-primary/60",
            )}
          >
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit(value);
                }
              }}
              rows={1}
              placeholder="I need a $2,500 PC for 1440p gaming and Blender..."
              className="max-h-40 min-h-[28px] flex-1 resize-none bg-transparent py-2 text-left text-[15px] text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
            />
            <button
              type="submit"
              aria-label="Start building"
              disabled={!value.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-transform enabled:hover:scale-105 disabled:opacity-40"
            >
              <ArrowUp size={18} />
            </button>
          </form>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => submit(s)}
                className="rounded-full border border-border px-3.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

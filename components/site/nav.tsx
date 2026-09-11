"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/build", label: "Build with AI" },
  { href: "/explore", label: "Explore Builds" },
  { href: "/#how-it-works", label: "How it Works" },
];

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-heading text-lg font-semibold tracking-tight", className)}>
      EasyBuild<span className="text-primary">.</span>
    </span>
  );
}

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { user, loading } = useAuth();

  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <Link href="/" className="shrink-0" onClick={() => setOpen(false)}>
          <Wordmark />
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm text-muted-foreground transition-colors hover:text-foreground",
                pathname === link.href && "text-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-4 md:flex">
          {!loading && !user && (
            <Link href="/sign-in" className="text-sm text-muted-foreground hover:text-foreground">
              Sign in
            </Link>
          )}
          <Link href="/build" className={cn(buttonVariants({ size: "sm" }), "rounded-full px-5")}>
            {user ? "Go to Dashboard" : "Start Building"}
          </Link>
        </div>

        <button
          type="button"
          className="text-foreground md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden border-t border-border/60 bg-background md:hidden"
          >
            <div className="flex flex-col gap-1 px-5 py-4">
              {LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-2 py-2.5 text-sm text-muted-foreground hover:bg-surface-raised hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
              {!loading && !user && (
                <Link
                  href="/sign-in"
                  onClick={() => setOpen(false)}
                  className="rounded-md px-2 py-2.5 text-sm text-muted-foreground hover:bg-surface-raised hover:text-foreground"
                >
                  Sign in
                </Link>
              )}
              <Link
                href="/build"
                onClick={() => setOpen(false)}
                className={cn(buttonVariants({ size: "sm" }), "mt-2 rounded-full")}
              >
                {user ? "Go to Dashboard" : "Start Building"}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

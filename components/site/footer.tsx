"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "./nav";

export function Footer() {
  const pathname = usePathname();
  if (pathname === "/build") return null;

  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex flex-col gap-2">
          <Wordmark />
          <p className="max-w-sm text-sm text-muted-foreground">
            An AI agent that plans and builds the perfect PC. Tell it what you want to do.
          </p>
        </div>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <Link href="/build" className="hover:text-foreground">
            Build with AI
          </Link>
          <Link href="/explore" className="hover:text-foreground">
            Explore Builds
          </Link>
        </div>
      </div>
    </footer>
  );
}

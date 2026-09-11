import Link from "next/link";
import { Wordmark } from "@/components/site/nav";
import { UserMenu } from "@/components/auth/user-menu";

/** Minimal header for the signed-in app (the AI builder, My Builds): no marketing nav, just the wordmark and account menu. */
export function AppHeader() {
  return (
    <header className="shrink-0 border-b border-border/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <Link href="/">
          <Wordmark />
        </Link>
        <UserMenu />
      </div>
    </header>
  );
}

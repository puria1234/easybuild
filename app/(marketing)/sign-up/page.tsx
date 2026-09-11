"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center px-5 py-20 text-center">
        <h1 className="font-heading text-2xl font-semibold">Sign up isn&apos;t configured yet</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Add <code className="font-data">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code className="font-data">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> to your environment to enable accounts.
        </p>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { data, error } = await createClient().auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (!data.session) {
      setSent(true);
    } else {
      router.push("/build");
      router.refresh();
    }
  }

  if (sent) {
    return (
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center px-5 py-20 text-center">
        <h1 className="font-heading text-2xl font-semibold">Check your email</h1>
        <p className="mt-2 text-sm text-muted-foreground">We sent a confirmation link to {email}. Follow it to finish creating your account.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-5 py-20">
      <h1 className="font-heading text-2xl font-semibold">Create an account</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">Save builds and pick up where you left off.</p>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm focus:border-primary/60 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          Password
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm focus:border-primary/60 focus:outline-none"
          />
        </label>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

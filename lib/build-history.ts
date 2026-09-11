import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Build } from "@/lib/types";

/**
 * "My Builds" persistence, backed by the `builds` table in Supabase Postgres
 * (see `lib/supabase/schema.sql`), scoped per-user via row-level security.
 * There is no anonymous/local fallback here on purpose: saved builds are
 * an account feature, so an unauthenticated caller gets `not_signed_in`
 * rather than a silently-local copy that would vanish across devices.
 */

interface BuildRow {
  id: string;
  user_id: string;
  title: string;
  requirements: Build["requirements"];
  components: Build["components"];
  performance: Build["performance"];
  compatibility: Build["compatibility"];
  created_at: string;
}

function rowToBuild(row: BuildRow): Build {
  return {
    id: row.id,
    title: row.title,
    createdAt: row.created_at,
    requirements: row.requirements,
    components: row.components,
    performance: row.performance,
    compatibility: row.compatibility,
  };
}

export type SaveResult = { ok: true } | { ok: false; error: "not_configured" | "not_signed_in" | "unknown" };

export async function loadBuildHistory(): Promise<Build[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("builds")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error || !data) return [];
  return (data as BuildRow[]).map(rowToBuild);
}

export async function getSavedBuild(id: string): Promise<Build | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase.from("builds").select("*").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (error || !data) return null;
  return rowToBuild(data as BuildRow);
}

export async function saveBuildToHistory(build: Build): Promise<SaveResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: "not_configured" };
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "not_signed_in" };

  const { error } = await supabase.from("builds").upsert({
    id: build.id,
    user_id: user.id,
    title: build.title,
    requirements: build.requirements,
    components: build.components,
    performance: build.performance,
    compatibility: build.compatibility,
    created_at: build.createdAt,
  });

  return error ? { ok: false, error: "unknown" } : { ok: true };
}

export async function removeBuildFromHistory(id: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = createClient();
  await supabase.from("builds").delete().eq("id", id);
}

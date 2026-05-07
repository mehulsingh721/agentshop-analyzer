import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export type AdminClient = SupabaseClient<Database>;

let cached: AdminClient | null = null;

/**
 * Server-only Supabase client using the secret (service-role) key.
 * Bypasses RLS — never import from a client component.
 *
 * Uses the new `sb_secret_...` key (Supabase late-2025 rotation).
 * Falls back to the legacy `SUPABASE_SERVICE_ROLE_KEY` JWT for older projects.
 */
export function createAdminClient(): AdminClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in environment"
    );
  }

  cached = createClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: { "x-application-name": "agentshop-analyzer" },
    },
  });

  return cached;
}

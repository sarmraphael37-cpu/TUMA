import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getServerEnv } from "@/lib/env";

/**
 * An anonymous Supabase client for public pages.
 *
 * It never carries a session, so every query runs as the `anon` role and the
 * row level security policies decide what a visitor may read. The storefront
 * therefore cannot see a merchant's dashboard data, their customers or their
 * orders — it only gets the rows the public policies allow.
 */
export function getPublicSupabaseClient() {
  const env = getServerEnv();

  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
}

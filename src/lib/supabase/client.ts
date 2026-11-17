"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getBrowserEnv } from "@/lib/env";

let browserClient: SupabaseClient | null = null;

/**
 * Singleton Supabase client for Client Components.
 *
 * Created lazily so the page can render without Supabase credentials; the
 * validation error only surfaces when a Supabase call is actually made.
 */
export function getSupabaseBrowserClient(): SupabaseClient {
  if (browserClient) {
    return browserClient;
  }

  const env = getBrowserEnv();

  browserClient = createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  return browserClient;
}

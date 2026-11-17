import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getServerEnv } from "@/lib/env";

/**
 * Creates a Supabase client scoped to the current request.
 *
 * Uses the Next.js cookie store so sessions survive server renders and Server
 * Actions. Must only be called from Server Components, Route Handlers or
 * Server Actions.
 *
 * Callers that render at request time must `await connection()` *before*
 * reaching this helper, so Next knows the whole subtree is dynamic.
 */
export async function getSupabaseServerClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();
  const env = getServerEnv();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Setting cookies from a Server Component is a no-op. It is safe to
            // ignore: mutations go through Route Handlers and Server Actions.
          }
        },
      },
    },
  );
}

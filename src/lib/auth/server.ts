import "server-only";

import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import type { Business } from "@/lib/db/types";
import {
  isMissingSchemaError,
  reportMissingSchema,
} from "@/lib/db/schema-state";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Validates the access token with Supabase Auth on every request. `getUser`
 * (rather than `getSession`) guarantees the token was issued by Supabase and
 * has not been tampered with.
 *
 * Note: this is deliberately *not* wrapped in React's `cache()`. With Cache
 * Components the prerender pass can stall inside this function, and a cached
 * promise would then be reused by the request-time render and hang forever.
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user;
  } catch {
    return null;
  }
}

export async function requireUser(nextPath = "/dashboard"): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  return user;
}

/** Returns the signed-in merchant's business, if one has been created. */
export async function getOwnedBusiness(): Promise<Business | null> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("businesses")
      .select(
        "id, owner_id, name, slug, category, description, phone, location, currency, created_at, updated_at",
      )
      .limit(1)
      .maybeSingle();

    if (error) {
      if (isMissingSchemaError(error)) {
        reportMissingSchema("businesses");
      } else {
        console.error("Failed to load business", error);
      }

      return null;
    }

    return (data as Business | null) ?? null;
  } catch {
    return null;
  }
}

export async function requireBusiness(
  nextPath = "/dashboard",
): Promise<{ user: User; business: Business }> {
  const user = await requireUser(nextPath);
  const business = await getOwnedBusiness();

  if (!business) {
    redirect("/onboarding");
  }

  return { user, business };
}




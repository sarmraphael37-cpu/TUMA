import "server-only";

import { isMissingColumnError } from "@/lib/db/catalogue";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * The storefront settings of a merchant.
 *
 * `supported` is false while the storefront migration has not been applied to
 * the workspace database: the dashboard then explains what to do instead of
 * failing.
 */
export type StorefrontSettings = {
  isPublic: boolean;
  logoUrl: string | null;
  coverImageUrl: string | null;
  whatsapp: string | null;
  supported: boolean;
};

const EMPTY: StorefrontSettings = {
  isPublic: false,
  logoUrl: null,
  coverImageUrl: null,
  whatsapp: null,
  supported: false,
};

/** Reads the storefront settings of a business. */
export async function getStorefrontSettings(
  businessId: string,
): Promise<StorefrontSettings> {
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("businesses")
    .select("is_public, logo_url, cover_image_url, whatsapp")
    .eq("id", businessId)
    .maybeSingle();

  if (error) {
    if (isMissingColumnError(error.message)) {
      return EMPTY;
    }

    console.error("Failed to load the storefront settings", error);
    return { ...EMPTY, supported: true };
  }

  const row = (data ?? {}) as {
    is_public?: boolean | null;
    logo_url?: string | null;
    cover_image_url?: string | null;
    whatsapp?: string | null;
  };

  return {
    isPublic: Boolean(row.is_public),
    logoUrl: row.logo_url ?? null,
    coverImageUrl: row.cover_image_url ?? null,
    whatsapp: row.whatsapp ?? null,
    supported: true,
  };
}

/** Writes the storefront settings of a business. */
export async function updateStorefrontSettings(
  businessId: string,
  ownerId: string,
  settings: Omit<StorefrontSettings, "supported">,
) {
  const supabase = await getSupabaseServerClient();

  const { error } = await supabase
    .from("businesses")
    .update({
      is_public: settings.isPublic,
      logo_url: settings.logoUrl,
      cover_image_url: settings.coverImageUrl,
      whatsapp: settings.whatsapp,
    })
    .eq("id", businessId)
    .eq("owner_id", ownerId);

  return error;
}

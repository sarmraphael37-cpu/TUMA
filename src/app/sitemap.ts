import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";
import { getPublicSupabaseClient } from "@/lib/supabase/public";

/**
 * The sitemap lists the marketing page and every published storefront.
 *
 * The shops are read through the anonymous client, so only the businesses
 * that published their shop (and only their public columns) end up here.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    {
      url: siteConfig.url,
      lastModified: new Date("2026-11-12"),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  try {
    const supabase = getPublicSupabaseClient();
    const { data } = await supabase
      .from("businesses")
      .select("slug, updated_at")
      .eq("is_public", true)
      .limit(500);

    for (const business of data ?? []) {
      entries.push({
        url: `${siteConfig.url}/shop/${business.slug}`,
        lastModified: business.updated_at
          ? new Date(business.updated_at)
          : new Date(),
        changeFrequency: "daily",
        priority: 0.8,
      });
    }
  } catch {
    // The sitemap must never break the build when the database is unreachable.
  }

  return entries;
}

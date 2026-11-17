import "server-only";

import { headers } from "next/headers";

import { siteConfig } from "@/config/site";

/**
 * Resolves the public origin of the current request. Using request headers
 * keeps email confirmation links correct on previews, alternate ports and
 * production without a second env var to maintain.
 */
export async function getRequestOrigin(): Promise<string> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");

  if (!host) {
    return process.env.NEXT_PUBLIC_SITE_URL ?? siteConfig.url;
  }

  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1")
      ? "http"
      : "https");

  return `${protocol}://${host}`;
}

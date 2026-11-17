import { z } from "zod";

/**
 * Environment variable validation.
 *
 * Browser values must be prefixed with NEXT_PUBLIC_ to be inlined into the
 * client bundle. Server-only values are never exposed to the browser.
 *
 * Validation is lazy: the landing page must keep rendering even when Supabase
 * credentials have not been configured yet. Call the getters from the Supabase
 * client factories so misconfiguration surfaces with an actionable message
 * instead of crashing the page on load.
 */

const browserEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "Supabase anon key is required"),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
});

const serverEnvSchema = browserEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type BrowserEnv = z.infer<typeof browserEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

function formatIssues(error: z.ZodError) {
  return error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
}

function readBrowserSource() {
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  };
}

/** Validated browser environment. Throws with an actionable message. */
export function getBrowserEnv(): BrowserEnv {
  const result = browserEnvSchema.safeParse(readBrowserSource());

  if (!result.success) {
    throw new Error(
      `Invalid browser environment variables:\n${formatIssues(result.error)}\n\n` +
        `Copy .env.example to .env.local and fill in the required values.`,
    );
  }

  return result.data;
}

/** Validated server environment. Only import from server-only modules. */
export function getServerEnv(): ServerEnv {
  const result = serverEnvSchema.safeParse({
    ...readBrowserSource(),
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NODE_ENV: process.env.NODE_ENV,
  });

  if (!result.success) {
    throw new Error(
      `Invalid server environment variables:\n${formatIssues(result.error)}\n\n` +
        `Copy .env.example to .env.local and fill in the required values.`,
    );
  }

  return result.data;
}

/** True when Supabase has been configured with well-formed credentials. */
export const isSupabaseConfigured = browserEnvSchema.safeParse(
  readBrowserSource(),
).success;

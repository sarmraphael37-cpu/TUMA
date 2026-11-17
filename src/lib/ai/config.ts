import "server-only";

import { z } from "zod";

import type { AiPublicStatus } from "@/lib/ai/types";

/**
 * Server-only AI configuration.
 *
 * The API key never leaves the server: nothing here is imported by a Client
 * Component, and `getAiPublicStatus` deliberately returns only the flag and
 * model name. Any OpenAI-compatible chat-completions endpoint works (OpenAI,
 * OpenRouter, Groq, a self-hosted gateway, ...).
 */

const aiEnvSchema = z.object({
  TUMA_AI_API_KEY: z.string().trim().min(1).optional(),
  TUMA_AI_BASE_URL: z
    .string()
    .trim()
    .url("TUMA_AI_BASE_URL must be a valid URL")
    .default("https://api.openai.com/v1"),
  TUMA_AI_MODEL: z.string().trim().min(1).default("gpt-4o-mini"),
  TUMA_AI_MAX_OUTPUT_TOKENS: z.coerce
    .number()
    .int()
    .min(128)
    .max(8_192)
    .default(1_200),
  TUMA_AI_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .min(5_000)
    .max(120_000)
    .default(45_000),
  TUMA_AI_RATE_LIMIT_PER_HOUR: z.coerce
    .number()
    .int()
    .min(1)
    .max(500)
    .default(20),
});

export type AiConfig = {
  configured: boolean;
  apiKey: string | null;
  baseUrl: string;
  model: string;
  maxOutputTokens: number;
  timeoutMs: number;
  rateLimitPerHour: number;
  /** Host only, useful for a truthful settings hint without the key. */
  providerHost: string;
};

function formatIssues(error: z.ZodError) {
  return error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
}

function readSource() {
  return {
    TUMA_AI_API_KEY: process.env.TUMA_AI_API_KEY,
    TUMA_AI_BASE_URL: process.env.TUMA_AI_BASE_URL,
    TUMA_AI_MODEL: process.env.TUMA_AI_MODEL,
    TUMA_AI_MAX_OUTPUT_TOKENS: process.env.TUMA_AI_MAX_OUTPUT_TOKENS,
    TUMA_AI_TIMEOUT_MS: process.env.TUMA_AI_TIMEOUT_MS,
    TUMA_AI_RATE_LIMIT_PER_HOUR: process.env.TUMA_AI_RATE_LIMIT_PER_HOUR,
  };
}

/**
 * Reads and validates the AI environment. The key stays optional so the
 * workspace keeps rendering (with a clear "not configured" state) before the
 * merchant connects a provider.
 */
export function getAiConfig(): AiConfig {
  const parsed = aiEnvSchema.safeParse(readSource());

  if (!parsed.success) {
    throw new Error(
      `Invalid AI environment variables:\n${formatIssues(parsed.error)}\n\n` +
        "Check the TUMA_AI_* values in .env.local and restart the server.",
    );
  }

  const data = parsed.data;
  const providerHost = (() => {
    try {
      return new URL(data.TUMA_AI_BASE_URL).host;
    } catch {
      return null;
    }
  })();

  return {
    configured: Boolean(data.TUMA_AI_API_KEY),
    apiKey: data.TUMA_AI_API_KEY ?? null,
    baseUrl: data.TUMA_AI_BASE_URL.replace(/\/+$/, ""),
    model: data.TUMA_AI_MODEL,
    maxOutputTokens: data.TUMA_AI_MAX_OUTPUT_TOKENS,
    timeoutMs: data.TUMA_AI_TIMEOUT_MS,
    rateLimitPerHour: data.TUMA_AI_RATE_LIMIT_PER_HOUR,
    providerHost: providerHost ?? "unknown",
  };
}

/** Safe status for the server-rendered page. Never includes the key. */
export function getAiPublicStatus(): AiPublicStatus {
  try {
    const config = getAiConfig();

    return {
      configured: config.configured,
      model: config.configured ? config.model : null,
      providerHost: config.configured ? config.providerHost : null,
      rateLimitPerHour: config.configured ? config.rateLimitPerHour : null,
      error: null,
    };
  } catch (error) {
    return {
      configured: false,
      model: null,
      providerHost: null,
      rateLimitPerHour: null,
      error:
        error instanceof Error
          ? error.message
          : "The AI configuration could not be read.",
    };
  }
}

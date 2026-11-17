import "server-only";

import { getAiConfig } from "@/lib/ai/config";

/**
 * A small OpenAI-compatible chat-completions client.
 *
 * Provider credentials and upstream error bodies stay on the server. Callers
 * receive either a parsed JSON object or an `AiProviderError` with a safe code
 * that the route can map to an honest HTTP response.
 */

export type AiProviderErrorCode =
  | "not_configured"
  | "timeout"
  | "upstream"
  | "invalid_response";

export class AiProviderError extends Error {
  readonly code: AiProviderErrorCode;

  constructor(code: AiProviderErrorCode, message: string) {
    super(message);
    this.name = "AiProviderError";
    this.code = code;
  }
}

type ProviderResponse = {
  choices?: Array<{
    message?: {
      content?: unknown;
    };
    text?: unknown;
  }>;
  usage?: {
    total_tokens?: unknown;
  };
};

function endpointFor(baseUrl: string) {
  return /\/chat\/completions$/i.test(baseUrl)
    ? baseUrl
    : `${baseUrl}/chat/completions`;
}

function extractText(payload: ProviderResponse): string | null {
  const content = payload.choices?.[0]?.message?.content;

  if (typeof content === "string" && content.trim()) {
    return content;
  }

  if (Array.isArray(content)) {
    const parts = content
      .map((part) => {
        if (typeof part === "string") {
          return part;
        }
        if (part && typeof part === "object" && "text" in part) {
          const text = (part as { text?: unknown }).text;
          return typeof text === "string" ? text : "";
        }
        return "";
      })
      .filter(Boolean);

    if (parts.length) {
      return parts.join("\n");
    }
  }

  const legacy = payload.choices?.[0]?.text;

  return typeof legacy === "string" && legacy.trim() ? legacy : null;
}

/** Handles fenced JSON and the occasional sentence around the object. */
function extractJson(raw: string): unknown {
  const trimmed = raw.trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(withoutFence);
  } catch {
    const start = withoutFence.indexOf("{");
    const end = withoutFence.lastIndexOf("}");

    if (start === -1 || end <= start) {
      throw new AiProviderError(
        "invalid_response",
        "The AI provider did not return a JSON object.",
      );
    }

    try {
      return JSON.parse(withoutFence.slice(start, end + 1));
    } catch {
      throw new AiProviderError(
        "invalid_response",
        "The AI provider returned malformed JSON.",
      );
    }
  }
}

function asTokenCount(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : 0;
}

async function postCompletion(input: {
  apiKey: string;
  baseUrl: string;
  model: string;
  system: string;
  user: string;
  temperature: number;
  maxOutputTokens: number;
  timeoutMs: number;
  useJsonMode: boolean;
}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), input.timeoutMs);

  try {
    const response = await fetch(endpointFor(input.baseUrl), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${input.apiKey}`,
      },
      body: JSON.stringify({
        model: input.model,
        messages: [
          { role: "system", content: input.system },
          { role: "user", content: input.user },
        ],
        temperature: input.temperature,
        max_tokens: input.maxOutputTokens,
        ...(input.useJsonMode
          ? { response_format: { type: "json_object" } }
          : {}),
      }),
      signal: controller.signal,
      cache: "no-store",
    });

    return response;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new AiProviderError(
        "timeout",
        "The AI provider took too long to answer. Please try again.",
      );
    }

    throw new AiProviderError(
      "upstream",
      "TUMA could not reach the AI provider. Check the connection and try again.",
    );
  } finally {
    clearTimeout(timer);
  }
}

export async function generateAiJson(input: {
  system: string;
  user: string;
  temperature?: number;
}): Promise<{ data: unknown; model: string; tokensUsed: number }> {
  const config = getAiConfig();

  if (!config.configured || !config.apiKey) {
    throw new AiProviderError(
      "not_configured",
      "TUMA AI is not configured. Add TUMA_AI_API_KEY to the server environment.",
    );
  }

  const base = {
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
    model: config.model,
    system: input.system,
    user: input.user,
    temperature: input.temperature ?? 0.65,
    maxOutputTokens: config.maxOutputTokens,
    timeoutMs: config.timeoutMs,
  };

  let response = await postCompletion({ ...base, useJsonMode: true });

  // Some compatible gateways reject `response_format`. Retry once without it;
  // the prompt already asks for a single JSON object.
  if (!response.ok && (response.status === 400 || response.status === 422)) {
    response = await postCompletion({ ...base, useJsonMode: false });
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error(
      `[TUMA AI] Provider responded ${response.status}: ${detail.slice(0, 500)}`,
    );

    if (response.status === 401 || response.status === 403) {
      throw new AiProviderError(
        "upstream",
        "The AI provider rejected the API key. Check TUMA_AI_API_KEY on the server.",
      );
    }

    if (response.status === 429) {
      throw new AiProviderError(
        "upstream",
        "The AI provider is rate-limiting requests. Try again in a moment.",
      );
    }

    throw new AiProviderError(
      "upstream",
      "The AI provider could not complete the request. Please try again.",
    );
  }

  let payload: ProviderResponse;

  try {
    payload = (await response.json()) as ProviderResponse;
  } catch {
    throw new AiProviderError(
      "invalid_response",
      "The AI provider returned an unreadable response.",
    );
  }

  const text = extractText(payload);

  if (!text) {
    throw new AiProviderError(
      "invalid_response",
      "The AI provider returned an empty response.",
    );
  }

  return {
    data: extractJson(text),
    model: config.model,
    tokensUsed: asTokenCount(payload.usage?.total_tokens),
  };
}

import {
  assistantResultSchema,
  insightResultSchema,
  marketingResultSchema,
  productCopyResultSchema,
} from "@/lib/ai/schemas";
import {
  AI_KINDS,
  AI_LANGUAGES,
  type AiHistoryItem,
  type AiKind,
  type AiLanguage,
  type AiResult,
  type AiStoredPrompt,
} from "@/lib/ai/types";
import type { AiGenerationStatus } from "@/types/database";

/** Type guards and parsers shared by the API, the server page and the client. */

export function isAiLanguage(value: unknown): value is AiLanguage {
  return (
    typeof value === "string" &&
    (AI_LANGUAGES as readonly string[]).includes(value)
  );
}

export function isAiKind(value: unknown): value is AiKind {
  return (
    typeof value === "string" && (AI_KINDS as readonly string[]).includes(value)
  );
}

export function coerceAiKind(value: string): AiKind | "other" {
  return isAiKind(value) ? value : "other";
}

export function parseStoredPrompt(prompt: string): AiStoredPrompt | null {
  try {
    const parsed = JSON.parse(prompt);

    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    const candidate = parsed as Record<string, unknown>;

    if (!isAiKind(candidate.kind) || !isAiLanguage(candidate.language)) {
      return null;
    }

    return {
      kind: candidate.kind,
      language: candidate.language,
      input:
        candidate.input && typeof candidate.input === "object"
          ? (candidate.input as Record<string, unknown>)
          : {},
      capturedAt:
        typeof candidate.capturedAt === "string"
          ? candidate.capturedAt
          : new Date(0).toISOString(),
      truncated: candidate.truncated === true,
      excerpt:
        typeof candidate.excerpt === "string" ? candidate.excerpt : undefined,
    };
  } catch {
    return null;
  }
}

/** Validates an already-parsed provider result against the kind's schema. */
export function validateAiResult(
  kind: AiKind,
  parsed: unknown,
): AiResult | null {
  // Some OpenAI-compatible providers wrap the object in `result`.
  if (
    parsed &&
    typeof parsed === "object" &&
    "result" in parsed &&
    (parsed as { result?: unknown }).result !== undefined
  ) {
    parsed = (parsed as { result: unknown }).result;
  }

  switch (kind) {
    case "product_description": {
      const result = productCopyResultSchema.safeParse(parsed);
      return result.success ? result.data : null;
    }
    case "marketing": {
      const result = marketingResultSchema.safeParse(parsed);
      return result.success ? result.data : null;
    }
    case "insight": {
      const result = insightResultSchema.safeParse(parsed);
      return result.success ? result.data : null;
    }
    case "assistant": {
      const result = assistantResultSchema.safeParse(parsed);
      return result.success ? result.data : null;
    }
  }
}

/** Parses the JSON stored in `ai_generations.response`. */
export function parseAiResult(
  kind: AiKind,
  response: string | null | undefined,
): AiResult | null {
  if (!response) {
    return null;
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(response);
  } catch {
    return null;
  }

  return validateAiResult(kind, parsed);
}

type GenerationRowLike = {
  id: string;
  kind: string;
  prompt: string;
  response: string | null;
  model: string | null;
  tokens_used: number;
  status: AiGenerationStatus;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

export function toAiHistoryItem(row: GenerationRowLike): AiHistoryItem {
  const request = parseStoredPrompt(row.prompt);
  const kind = coerceAiKind(row.kind);

  return {
    id: row.id,
    rawKind: row.kind,
    kind,
    language: request?.language ?? null,
    status: row.status,
    model: row.model,
    tokensUsed: Number(row.tokens_used ?? 0),
    errorMessage: row.error_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    request,
    result: kind === "other" ? null : parseAiResult(kind, row.response),
  };
}

/** Human-readable text used by the copy buttons and the history preview. */
export function formatAiResultAsText(result: AiResult, kind: AiKind): string {
  switch (kind) {
    case "product_description": {
      const copy = result as {
        title: string;
        description: string;
        sellingPoints: string[];
      };
      return [
        copy.title,
        "",
        copy.description,
        "",
        "Key selling points:",
        ...copy.sellingPoints.map((point) => `- ${point}`),
      ].join("\n");
    }
    case "marketing": {
      const copy = result as {
        headline: string;
        body: string;
        hashtags: string[];
        callToAction: string;
      };
      const hashtags = copy.hashtags
        .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`))
        .join(" ");
      return [copy.headline, "", copy.body, "", hashtags, "", copy.callToAction]
        .filter((line, index, lines) => line !== "" || lines[index - 1] !== "")
        .join("\n")
        .trim();
    }
    case "insight": {
      const copy = result as {
        summary: string;
        observations: { title: string; detail: string }[];
        opportunities: { title: string; detail: string; action: string }[];
      };
      return [
        copy.summary,
        "",
        "Observations:",
        ...copy.observations.map(
          (observation) => `- ${observation.title}: ${observation.detail}`,
        ),
        ...(copy.opportunities.length
          ? [
              "",
              "Opportunities:",
              ...copy.opportunities.map(
                (opportunity) =>
                  `- ${opportunity.title}: ${opportunity.detail} (${opportunity.action})`,
              ),
            ]
          : []),
      ].join("\n");
    }
    case "assistant": {
      return (result as { reply: string }).reply;
    }
  }
}

/** First useful line of a result, used when a history card is collapsed. */
export function getResultPreview(result: AiResult, kind: AiKind): string {
  switch (kind) {
    case "product_description":
      return (result as { title: string }).title;
    case "marketing":
      return (result as { headline: string }).headline;
    case "insight":
      return (result as { summary: string }).summary;
    case "assistant":
      return (result as { reply: string }).reply;
  }
}

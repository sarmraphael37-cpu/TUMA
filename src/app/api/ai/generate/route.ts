import { getAiConfig, getAiPublicStatus } from "@/lib/ai/config";
import { getEffectiveAiHourlyLimit } from "@/lib/admin/settings";
import {
  countGenerationsSince,
  createAiGeneration,
  updateAiGeneration,
} from "@/lib/ai/history";
import { getInsightsSnapshot } from "@/lib/ai/insights";
import { buildAiPrompt } from "@/lib/ai/prompts";
import {
  AiProviderError,
  generateAiJson,
} from "@/lib/ai/provider";
import { consumeLocalRateLimit } from "@/lib/ai/rate-limit";
import { validateAiResult } from "@/lib/ai/result";
import {
  AI_MAX_REQUEST_CHARS,
  aiGenerateRequestSchema,
} from "@/lib/ai/schemas";
import type { AiApiErrorPayload } from "@/lib/ai/types";
import { getOwnedBusiness } from "@/lib/auth/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * The only route that talks to an AI provider.
 *
 * Order of operations: authenticate, validate the body with Zod, check the AI
 * configuration, enforce the hourly limit, build a prompt from server-side data,
 * store a pending history row, call the provider, validate its JSON, then mark
 * the row completed. No key and no raw provider error ever reaches the browser.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const HOUR_MS = 60 * 60 * 1000;

function fail(
  status: number,
  code: string,
  message: string,
  extra?: Partial<AiApiErrorPayload>,
) {
  return Response.json(
    { code, message, ...extra } satisfies AiApiErrorPayload,
    { status },
  );
}

function fieldErrorsFrom(issues: { path: PropertyKey[]; message: string }[]) {
  const fieldErrors: Record<string, string[]> = {};

  for (const issue of issues) {
    const key = issue.path.length ? issue.path.map(String).join(".") : "form";
    fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
  }

  return fieldErrors;
}

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return fail(
      401,
      "unauthorized",
      "Sign in again to use TUMA AI.",
    );
  }

  const business = await getOwnedBusiness();

  if (!business) {
    return fail(
      409,
      "no_business",
      "Create your business profile before using TUMA AI.",
    );
  }

  // Validate the request contract before the configuration gate, so clients
  // get an accurate 400/413/422 even when no provider is connected yet.
  const contentLength = Number(request.headers.get("content-length") ?? 0);

  if (Number.isFinite(contentLength) && contentLength > AI_MAX_REQUEST_CHARS) {
    return fail(413, "payload_too_large", "This request is too large.");
  }

  const rawBody = await request.text();

  if (rawBody.length > AI_MAX_REQUEST_CHARS) {
    return fail(413, "payload_too_large", "This request is too large.");
  }

  let body: unknown;

  try {
    body = JSON.parse(rawBody);
  } catch {
    return fail(400, "invalid_json", "The request body is not valid JSON.");
  }

  const parsed = aiGenerateRequestSchema.safeParse(body);

  if (!parsed.success) {
    return fail(
      422,
      "invalid_request",
      "Check the highlighted fields and try again.",
      { fieldErrors: fieldErrorsFrom(parsed.error.issues) },
    );
  }

  const publicStatus = getAiPublicStatus();

  if (publicStatus.error) {
    console.error("[TUMA AI] Invalid configuration", publicStatus.error);
    return fail(
      500,
      "config_invalid",
      "TUMA AI is not configured correctly. Check the TUMA_AI_* environment variables on the server.",
    );
  }

  if (!publicStatus.configured) {
    return fail(
      503,
      "not_configured",
      "TUMA AI is not connected yet. Add TUMA_AI_API_KEY to the server environment and restart.",
    );
  }

  const config = getAiConfig();
  const rateLimitPerHour = await getEffectiveAiHourlyLimit(
    config.rateLimitPerHour,
  );
  const now = Date.now();
  const localLimit = consumeLocalRateLimit(user.id, rateLimitPerHour, now);

  if (!localLimit.allowed) {
    return Response.json(
      {
        code: "rate_limited",
        message: `You have reached the limit of ${rateLimitPerHour} AI requests per hour. Try again in about ${Math.ceil(localLimit.retryAfterSeconds / 60)} minute${Math.ceil(localLimit.retryAfterSeconds / 60) === 1 ? "" : "s"}.`,
      } satisfies AiApiErrorPayload,
      {
        status: 429,
        headers: { "retry-after": String(localLimit.retryAfterSeconds) },
      },
    );
  }

  const recent = await countGenerationsSince(
    user.id,
    new Date(now - HOUR_MS).toISOString(),
  );

  if (recent !== null && recent >= rateLimitPerHour) {
    return fail(
      429,
      "rate_limited",
      `You have reached the limit of ${rateLimitPerHour} AI requests per hour. Try again later.`,
    );
  }

  const payload = parsed.data;
  const snapshot =
    payload.kind === "insight" || payload.kind === "assistant"
      ? await getInsightsSnapshot(business)
      : null;

  const prompt = buildAiPrompt(payload, {
    business: {
      name: business.name,
      category: business.category,
      currency: business.currency,
    },
    snapshot,
  });

  const created = await createAiGeneration({
    businessId: business.id,
    userId: user.id,
    kind: payload.kind,
    prompt: prompt.promptForDatabase,
    model: config.model,
  });

  if (!created.item) {
    return fail(
      500,
      "history_unavailable",
      created.error ??
        "TUMA could not save this request to your AI history.",
    );
  }

  try {
    const output = await generateAiJson({
      system: prompt.system,
      user: prompt.user,
      temperature:
        payload.kind === "insight" || payload.kind === "assistant"
          ? 0.35
          : 0.7,
    });

    const result = validateAiResult(payload.kind, output.data);

    if (!result) {
      const message =
        "The AI provider returned content that did not match the expected format. Nothing was saved as a result; please try again.";
      await updateAiGeneration({
        id: created.item.id,
        businessId: business.id,
        userId: user.id,
        status: "failed",
        errorMessage: message,
      });

      return fail(502, "invalid_response", message);
    }

    const updated = await updateAiGeneration({
      id: created.item.id,
      businessId: business.id,
      userId: user.id,
      response: JSON.stringify(result),
      status: "completed",
      model: output.model,
      tokensUsed: output.tokensUsed,
      errorMessage: null,
    });

    if (!updated.item) {
      return fail(
        500,
        "history_unavailable",
        "The AI answered, but TUMA could not save the result to your history. Please try again.",
      );
    }

    return Response.json({ generation: updated.item });
  } catch (error) {
    const message =
      error instanceof AiProviderError
        ? error.message
        : "TUMA could not complete the AI request. Please try again.";

    await updateAiGeneration({
      id: created.item.id,
      businessId: business.id,
      userId: user.id,
      status: "failed",
      errorMessage: message,
    });

    if (error instanceof AiProviderError) {
      const status =
        error.code === "timeout"
          ? 504
          : error.code === "not_configured"
            ? 503
            : 502;

      return fail(status, error.code, message);
    }

    console.error("[TUMA AI] Unexpected generation failure", error);
    return fail(500, "generation_failed", message);
  }
}

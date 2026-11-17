import { deleteAiGeneration, getAiGeneration, updateAiGeneration } from "@/lib/ai/history";
import { coerceAiKind, validateAiResult } from "@/lib/ai/result";
import {
  AI_MAX_REQUEST_CHARS,
  aiGenerationEditSchema,
} from "@/lib/ai/schemas";
import type { AiApiErrorPayload } from "@/lib/ai/types";
import { getOwnedBusiness } from "@/lib/auth/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Edit or delete one saved generation.
 *
 * The browser supplies only the new structured content. The business and the
 * user always come from the session, and the row is loaded first so the new
 * content is validated against that generation's own kind.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fail(status: number, code: string, message: string) {
  return Response.json({ code, message } satisfies AiApiErrorPayload, {
    status,
  });
}

/** A UUID guard so a malformed id never reaches a database query. */
function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}

async function context() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, business: null } as const;
  }

  const business = await getOwnedBusiness();

  return { user, business } as const;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, business } = await context();

  if (!user) {
    return fail(401, "unauthorized", "Sign in again to edit this content.");
  }

  if (!business) {
    return fail(409, "no_business", "Your business profile could not be found.");
  }

  const { id } = await params;

  if (!isUuid(id)) {
    return fail(404, "not_found", "That saved generation could not be found.");
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);

  if (Number.isFinite(contentLength) && contentLength > AI_MAX_REQUEST_CHARS) {
    return fail(413, "payload_too_large", "This edit is too large.");
  }

  const rawBody = await request.text();

  if (rawBody.length > AI_MAX_REQUEST_CHARS) {
    return fail(413, "payload_too_large", "This edit is too large.");
  }

  let body: unknown;

  try {
    body = JSON.parse(rawBody);
  } catch {
    return fail(400, "invalid_json", "The request body is not valid JSON.");
  }

  const parsed = aiGenerationEditSchema.safeParse(body);

  if (!parsed.success) {
    return fail(422, "invalid_request", "The edit could not be read.");
  }

  const generation = await getAiGeneration({
    id,
    businessId: business.id,
    userId: user.id,
  });

  if (!generation) {
    return fail(404, "not_found", "That saved generation could not be found.");
  }

  const kind = coerceAiKind(generation.kind);

  if (kind === "other") {
    return fail(
      422,
      "unsupported_kind",
      "This saved item is not one of the editable TUMA AI formats.",
    );
  }

  const result = validateAiResult(kind, parsed.data.result);

  if (!result) {
    return fail(
      422,
      "invalid_content",
      "The edited content is not complete. Check every required field and try again.",
    );
  }

  const updated = await updateAiGeneration({
    id,
    businessId: business.id,
    userId: user.id,
    response: JSON.stringify(result),
    status: "completed",
    errorMessage: null,
  });

  if (!updated.item) {
    return fail(
      500,
      "history_unavailable",
      updated.error ?? "TUMA could not save this edit.",
    );
  }

  return Response.json({ generation: updated.item });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, business } = await context();

  if (!user) {
    return fail(401, "unauthorized", "Sign in again to delete this content.");
  }

  if (!business) {
    return fail(409, "no_business", "Your business profile could not be found.");
  }

  const { id } = await params;

  if (!isUuid(id)) {
    return fail(404, "not_found", "That saved generation could not be found.");
  }

  const deleted = await deleteAiGeneration({
    id,
    businessId: business.id,
    userId: user.id,
  });

  if (!deleted.deleted) {
    return fail(
      404,
      "not_found",
      deleted.error ?? "That saved generation could not be found.",
    );
  }

  return Response.json({ deleted: true });
}

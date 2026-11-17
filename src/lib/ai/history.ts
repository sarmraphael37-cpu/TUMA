import "server-only";

import { toAiHistoryItem } from "@/lib/ai/result";
import type { AiHistoryItem } from "@/lib/ai/types";
import { getOwnedBusiness } from "@/lib/auth/server";
import {
  isMissingSchemaError,
  reportMissingSchema,
} from "@/lib/db/schema-state";
import type { AiGeneration } from "@/lib/db/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { AiGenerationStatus } from "@/types/database";

/**
 * `ai_generations` persistence.
 *
 * Every query uses the merchant's session client, so RLS applies, and every
 * mutation is also scoped by `business_id` and `user_id`. Another merchant can
 * never read, edit or delete a generation.
 */

export const AI_HISTORY_LIMIT = 24;

const GENERATION_COLUMNS = [
  "id",
  "business_id",
  "user_id",
  "kind",
  "prompt",
  "response",
  "model",
  "tokens_used",
  "status",
  "error_message",
  "created_at",
  "updated_at",
].join(", ");

function historyError(error: {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
}) {
  if (isMissingSchemaError(error)) {
    reportMissingSchema("ai_generations");
    return "AI history is not available because the workspace database schema is missing. Apply the latest TUMA migration.";
  }

  console.error("Failed to load AI history", error);
  return "TUMA could not load your AI history right now.";
}

export async function listAiGenerations(options?: {
  limit?: number;
}): Promise<{ items: AiHistoryItem[]; error: string | null }> {
  const business = await getOwnedBusiness();

  if (!business) {
    return { items: [], error: null };
  }

  const supabase = await getSupabaseServerClient();
  const limit = Math.min(Math.max(options?.limit ?? AI_HISTORY_LIMIT, 1), 100);

  const { data, error } = await supabase
    .from("ai_generations")
    .select(GENERATION_COLUMNS)
    .eq("business_id", business.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return { items: [], error: historyError(error) };
  }

  return {
    items: ((data ?? []) as unknown as AiGeneration[]).map(toAiHistoryItem),
    error: null,
  };
}

export async function createAiGeneration(input: {
  businessId: string;
  userId: string;
  kind: string;
  prompt: string;
  model: string | null;
}): Promise<{ item: AiHistoryItem | null; error: string | null }> {
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("ai_generations")
    .insert({
      business_id: input.businessId,
      user_id: input.userId,
      kind: input.kind,
      prompt: input.prompt,
      response: null,
      model: input.model,
      tokens_used: 0,
      status: "pending" satisfies AiGenerationStatus,
      error_message: null,
    })
    .select(GENERATION_COLUMNS)
    .single();

  if (error) {
    return { item: null, error: historyError(error) };
  }

  return {
    item: toAiHistoryItem(data as unknown as AiGeneration),
    error: null,
  };
}

export async function updateAiGeneration(input: {
  id: string;
  businessId: string;
  userId: string;
  response?: string | null;
  status?: AiGenerationStatus;
  model?: string | null;
  tokensUsed?: number;
  errorMessage?: string | null;
}): Promise<{ item: AiHistoryItem | null; error: string | null }> {
  const supabase = await getSupabaseServerClient();
  const payload: Record<string, unknown> = {};

  if ("response" in input) payload.response = input.response;
  if (input.status) payload.status = input.status;
  if ("model" in input) payload.model = input.model;
  if (typeof input.tokensUsed === "number") {
    payload.tokens_used = Math.max(0, Math.round(input.tokensUsed));
  }
  if ("errorMessage" in input) payload.error_message = input.errorMessage;

  const { data, error } = await supabase
    .from("ai_generations")
    .update(payload)
    .eq("id", input.id)
    .eq("business_id", input.businessId)
    .eq("user_id", input.userId)
    .select(GENERATION_COLUMNS)
    .maybeSingle();

  if (error) {
    return { item: null, error: historyError(error) };
  }

  return {
    item: data ? toAiHistoryItem(data as unknown as AiGeneration) : null,
    error: null,
  };
}

export async function getAiGeneration(input: {
  id: string;
  businessId: string;
  userId: string;
}): Promise<AiGeneration | null> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("ai_generations")
    .select(GENERATION_COLUMNS)
    .eq("id", input.id)
    .eq("business_id", input.businessId)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load AI generation", error);
    return null;
  }

  return (data as unknown as AiGeneration | null) ?? null;
}

export async function deleteAiGeneration(input: {
  id: string;
  businessId: string;
  userId: string;
}): Promise<{ deleted: boolean; error: string | null }> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("ai_generations")
    .delete()
    .eq("id", input.id)
    .eq("business_id", input.businessId)
    .eq("user_id", input.userId)
    .select("id")
    .maybeSingle();

  if (error) {
    return { deleted: false, error: historyError(error) };
  }

  return { deleted: Boolean(data), error: null };
}

/**
 * Number of generations started in a window. Used together with the in-memory
 * burst limiter so a restart cannot reset the merchant's hourly allowance.
 */
export async function countGenerationsSince(
  userId: string,
  sinceIso: string,
): Promise<number | null> {
  try {
    const supabase = await getSupabaseServerClient();
    const { count, error } = await supabase
      .from("ai_generations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", sinceIso);

    if (error) {
      return null;
    }

    return count ?? 0;
  } catch {
    return null;
  }
}

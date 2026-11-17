import type {
  AiApiErrorPayload,
  AiGenerateRequest,
  AiHistoryItem,
  AiResult,
} from "@/lib/ai/types";

/** Browser-side client for the AI routes. No credentials are involved. */

export class AiClientError extends Error {
  readonly code: string;
  readonly fieldErrors?: Record<string, string[] | undefined>;

  constructor(
    message: string,
    code = "unknown",
    fieldErrors?: Record<string, string[] | undefined>,
  ) {
    super(message);
    this.name = "AiClientError";
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

async function readPayload(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function errorFrom(response: Response, payload: unknown): AiClientError {
  const candidate =
    payload && typeof payload === "object"
      ? (payload as AiApiErrorPayload)
      : null;

  return new AiClientError(
    candidate?.message ||
      (response.status === 401
        ? "Your session expired. Sign in again to use TUMA AI."
        : "The AI request could not be completed. Please try again."),
    candidate?.code ?? `http_${response.status}`,
    candidate?.fieldErrors,
  );
}

export async function requestAiGeneration(
  body: AiGenerateRequest,
): Promise<AiHistoryItem> {
  let response: Response;

  try {
    response = await fetch("/api/ai/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AiClientError(
      "TUMA could not reach the server. Check your connection and try again.",
      "network",
    );
  }

  const payload = await readPayload(response);

  if (!response.ok) {
    throw errorFrom(response, payload);
  }

  const generation =
    payload && typeof payload === "object"
      ? (payload as { generation?: AiHistoryItem }).generation
      : undefined;

  if (!generation) {
    throw new AiClientError(
      "The server returned an unexpected response. Please try again.",
      "invalid_response",
    );
  }

  return generation;
}

export async function updateAiGenerationResult(
  id: string,
  result: AiResult,
): Promise<AiHistoryItem> {
  let response: Response;

  try {
    response = await fetch(`/api/ai/generations/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ result }),
    });
  } catch {
    throw new AiClientError(
      "TUMA could not reach the server. Check your connection and try again.",
      "network",
    );
  }

  const payload = await readPayload(response);

  if (!response.ok) {
    throw errorFrom(response, payload);
  }

  const generation =
    payload && typeof payload === "object"
      ? (payload as { generation?: AiHistoryItem }).generation
      : undefined;

  if (!generation) {
    throw new AiClientError(
      "The edit was saved but the server returned no content.",
      "invalid_response",
    );
  }

  return generation;
}

export async function deleteAiGenerationRequest(id: string): Promise<void> {
  let response: Response;

  try {
    response = await fetch(`/api/ai/generations/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  } catch {
    throw new AiClientError(
      "TUMA could not reach the server. Check your connection and try again.",
      "network",
    );
  }

  if (!response.ok) {
    const payload = await readPayload(response);
    throw errorFrom(response, payload);
  }
}

export function aiErrorMessage(error: unknown): string {
  if (error instanceof AiClientError) {
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

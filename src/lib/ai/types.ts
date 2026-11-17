import type { AiGenerationStatus } from "@/types/database";

/**
 * Shared AI types.
 *
 * This module is intentionally free of server-only imports: the workspace
 * client uses the same result and history shapes that the API returns. Secret
 * values live in `@/lib/ai/config`, which is never imported by a Client
 * Component.
 */

export const AI_LANGUAGES = ["en", "fr"] as const;
export type AiLanguage = (typeof AI_LANGUAGES)[number];

export const AI_LANGUAGE_LABELS: Record<AiLanguage, string> = {
  en: "English",
  fr: "Français",
};

export const AI_TONES = ["professional", "friendly", "bold", "playful"] as const;
export type AiTone = (typeof AI_TONES)[number];

export const AI_TONE_LABELS: Record<AiTone, string> = {
  professional: "Professional",
  friendly: "Friendly",
  bold: "Bold",
  playful: "Playful",
};

export const AI_CHANNELS = [
  "whatsapp",
  "facebook",
  "instagram",
  "launch",
  "campaign",
] as const;
export type AiChannel = (typeof AI_CHANNELS)[number];

export const AI_CHANNEL_LABELS: Record<AiChannel, string> = {
  whatsapp: "WhatsApp promo",
  facebook: "Facebook caption",
  instagram: "Instagram caption",
  launch: "Product launch",
  campaign: "Promotional campaign",
};

export const AI_KINDS = [
  "product_description",
  "marketing",
  "insight",
  "assistant",
] as const;
export type AiKind = (typeof AI_KINDS)[number];

export const AI_KIND_LABELS: Record<AiKind, string> = {
  product_description: "Product copy",
  marketing: "Marketing",
  insight: "Business insights",
  assistant: "Assistant",
};

/** JSON envelope stored in `ai_generations.prompt`. */
export type AiStoredPrompt = {
  kind: AiKind;
  language: AiLanguage;
  input: Record<string, unknown>;
  capturedAt: string;
  truncated?: boolean;
  excerpt?: string;
};

export type AiProductCopyResult = {
  title: string;
  description: string;
  sellingPoints: string[];
};

export type AiMarketingResult = {
  headline: string;
  body: string;
  hashtags: string[];
  callToAction: string;
};

export type AiObservationSeverity = "info" | "warning" | "opportunity";

export type AiInsightObservation = {
  title: string;
  detail: string;
  severity: AiObservationSeverity;
};

export type AiInsightOpportunity = {
  title: string;
  detail: string;
  action: string;
};

export type AiInsightResult = {
  summary: string;
  observations: AiInsightObservation[];
  opportunities: AiInsightOpportunity[];
};

export type AiAssistantResult = {
  reply: string;
};

export type AiResult =
  | AiProductCopyResult
  | AiMarketingResult
  | AiInsightResult
  | AiAssistantResult;

export type AiHistoryItem = {
  id: string;
  /** The stored kind, which may be a legacy value. */
  rawKind: string;
  kind: AiKind | "other";
  language: AiLanguage | null;
  status: AiGenerationStatus;
  model: string | null;
  tokensUsed: number;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  request: AiStoredPrompt | null;
  result: AiResult | null;
};

export type AiApiErrorPayload = {
  code: string;
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

/** Safe, non-secret status used by the workspace UI. */
export type AiPublicStatus = {
  configured: boolean;
  model: string | null;
  providerHost: string | null;
  rateLimitPerHour: number | null;
  error: string | null;
};

export type AiCatalogueOption = {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
};

/** Payloads accepted by `POST /api/ai/generate`. */
export type AiGenerateRequest =
  | {
      kind: "product_description";
      input: {
        productName: string;
        category: string;
        features: string;
        targetCustomers: string;
        language: AiLanguage;
        tone: AiTone;
      };
    }
  | {
      kind: "marketing";
      input: {
        channel: AiChannel;
        topic: string;
        productName: string;
        keyBenefits: string;
        offer: string;
        audience: string;
        callToAction: string;
        language: AiLanguage;
        tone: AiTone;
      };
    }
  | {
      kind: "insight";
      input: {
        focus: string;
        language: AiLanguage;
      };
    }
  | {
      kind: "assistant";
      input: {
        message: string;
        history: { role: "user" | "assistant"; content: string }[];
        language: AiLanguage;
      };
    };

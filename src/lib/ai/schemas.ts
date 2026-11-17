import { z } from "zod";

import {
  AI_CHANNELS,
  AI_LANGUAGES,
  AI_TONES,
  type AiAssistantResult,
  type AiInsightResult,
  type AiMarketingResult,
  type AiProductCopyResult,
} from "@/lib/ai/types";

/**
 * Every AI request is validated on the server before a provider is called.
 * Length caps keep prompts inside the `ai_generations.prompt` constraint and
 * stop a runaway form from turning into a very large paid request.
 */

const language = z.enum(AI_LANGUAGES).default("en");
const tone = z.enum(AI_TONES).default("professional");

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().default("");

export const productDescriptionInputSchema = z.object({
  productName: z
    .string()
    .trim()
    .min(2, "Enter the product name")
    .max(160, "Keep the product name under 160 characters"),
  category: optionalText(80),
  features: z
    .string()
    .trim()
    .min(5, "Describe at least one feature")
    .max(1_200, "Keep the features under 1,200 characters"),
  targetCustomers: optionalText(400),
  language,
  tone,
});

export const marketingInputSchema = z.object({
  channel: z.enum(AI_CHANNELS).default("whatsapp"),
  topic: z
    .string()
    .trim()
    .min(2, "Tell us what the message is about")
    .max(200, "Keep the topic under 200 characters"),
  productName: optionalText(160),
  keyBenefits: optionalText(800),
  offer: optionalText(300),
  audience: optionalText(300),
  callToAction: optionalText(160),
  language,
  tone,
});

export const insightInputSchema = z.object({
  focus: optionalText(300),
  language,
});

export const assistantInputSchema = z.object({
  message: z
    .string()
    .trim()
    .min(2, "Write a question or a request")
    .max(1_500, "Keep your message under 1,500 characters"),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(2_000),
      }),
    )
    .max(8, "This conversation is too long. Start a new one.")
    .default([]),
  language,
});

export const aiGenerateRequestSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("product_description"),
    input: productDescriptionInputSchema,
  }),
  z.object({
    kind: z.literal("marketing"),
    input: marketingInputSchema,
  }),
  z.object({
    kind: z.literal("insight"),
    input: insightInputSchema,
  }),
  z.object({
    kind: z.literal("assistant"),
    input: assistantInputSchema,
  }),
]);

export type AiGeneratePayload = z.infer<typeof aiGenerateRequestSchema>;

/* -------------------------------------------------------------------------- */
/*  Provider output                                                            */
/* -------------------------------------------------------------------------- */

export const productCopyResultSchema = z.object({
  title: z.string().trim().min(1).max(180),
  description: z.string().trim().min(1).max(3_000),
  sellingPoints: z
    .array(z.string().trim().min(1).max(240))
    .min(2)
    .max(6),
});

export const marketingResultSchema = z.object({
  headline: z.string().trim().min(1).max(220),
  body: z.string().trim().min(1).max(3_500),
  hashtags: z
    .array(z.string().trim().min(1).max(60))
    .max(15)
    .optional()
    .default([]),
  callToAction: z.string().trim().min(1).max(220),
});

export const insightResultSchema = z.object({
  summary: z.string().trim().min(1).max(1_600),
  observations: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(160),
        detail: z.string().trim().min(1).max(800),
        severity: z
          .enum(["info", "warning", "opportunity"])
          .optional()
          .default("info"),
      }),
    )
    .min(1)
    .max(8),
  opportunities: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(160),
        detail: z.string().trim().min(1).max(800),
        action: z.string().trim().min(1).max(300),
      }),
    )
    .max(6)
    .optional()
    .default([]),
});

export const assistantResultSchema = z.object({
  reply: z.string().trim().min(1).max(6_000),
});

export type ParsedProductCopy = AiProductCopyResult;
export type ParsedMarketing = AiMarketingResult;
export type ParsedInsight = AiInsightResult;
export type ParsedAssistant = AiAssistantResult;

export const aiGenerationEditSchema = z.object({
  result: z.unknown(),
});

export type AiGenerationEditPayload = z.infer<typeof aiGenerationEditSchema>;

/** The maximum body accepted by the AI routes, in characters. */
export const AI_MAX_REQUEST_CHARS = 24_000;

/** Stored prompts must respect the database check constraint. */
export const AI_MAX_STORED_PROMPT_CHARS = 7_900;

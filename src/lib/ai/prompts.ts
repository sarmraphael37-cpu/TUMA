import "server-only";

import type { AiInsightSnapshot } from "@/lib/ai/insights";
import {
  AI_MAX_STORED_PROMPT_CHARS,
  type AiGeneratePayload,
} from "@/lib/ai/schemas";
import {
  AI_CHANNEL_LABELS,
  AI_LANGUAGE_LABELS,
  AI_TONE_LABELS,
  type AiLanguage,
  type AiStoredPrompt,
} from "@/lib/ai/types";

/**
 * Prompt construction.
 *
 * Provider output is always a JSON object with a fixed shape, so the UI can
 * render structured content and the merchant can edit individual fields. The
 * snapshot passed to the model is aggregate data only (products, stock and
 * order totals); it contains no customer identity.
 */

export type AiPromptContext = {
  business: {
    name: string;
    category: string;
    currency: string;
  };
  snapshot: AiInsightSnapshot | null;
};

type BuiltPrompt = {
  system: string;
  user: string;
  /** JSON envelope stored in `ai_generations.prompt`. */
  promptForDatabase: string;
};

const LANGUAGE_NAMES: Record<AiLanguage, string> = {
  en: "English",
  fr: "French",
};

const COMMON_RULES = `You are TUMA AI, the assistant inside TUMA, a business workspace for small merchants in Africa.

NON-NEGOTIABLE RULES
1. Write only in the requested language. If the requested language is French, every merchant-facing word must be French, including headings and calls to action.
2. Never invent business numbers, products, orders, customers, events or results. Use only the business context and snapshot supplied below.
3. If a fact is not in the supplied data, say that it is not available instead of guessing. Never present a made-up statistic as real.
4. You can draft and explain, but you cannot perform actions. Never claim that a message was sent, an order was changed, a payment was verified, a customer was contacted or stock was updated.
5. Do not include customer names, phone numbers, emails or addresses in your output, and never ask for them.
6. Return ONLY one valid JSON object that matches the requested shape. No markdown fences, no commentary before or after the JSON.`;

const PRODUCT_COPY_SHAPE = `{
  "title": "a professional product title, at most 180 characters",
  "description": "an attractive, specific product description, 1 to 3 short paragraphs",
  "sellingPoints": ["3 to 5 short key selling points"]
}`;

const MARKETING_SHAPE = `{
  "headline": "a short attention-grabbing headline",
  "body": "the complete message or caption, ready to paste",
  "hashtags": ["up to 8 relevant hashtags, without the # symbol"],
  "callToAction": "one clear call to action"
}`;

const INSIGHT_SHAPE = `{
  "summary": "a short plain-language summary of the business situation",
  "observations": [
    {
      "title": "short label",
      "detail": "what the data actually shows, with the exact figures",
      "severity": "info | warning | opportunity"
    }
  ],
  "opportunities": [
    {
      "title": "short label",
      "detail": "why this is an opportunity, using only supplied data",
      "action": "one concrete next step for the merchant"
    }
  ]
}`;

const ASSISTANT_SHAPE = `{
  "reply": "a helpful answer in plain text, using short paragraphs or bullet lines"
}`;

function languageInstruction(language: AiLanguage) {
  return `Requested language: ${LANGUAGE_NAMES[language]} (${AI_LANGUAGE_LABELS[language]}).`;
}

function businessContext(context: AiPromptContext) {
  return [
    `Business name: ${context.business.name}`,
    `Business category: ${context.business.category}`,
    `Currency: ${context.business.currency}`,
  ].join("\n");
}

function snapshotBlock(snapshot: AiInsightSnapshot | null) {
  if (!snapshot) {
    return "";
  }

  return [
    "",
    `AGGREGATE BUSINESS SNAPSHOT (last ${snapshot.windowDays} days, generated ${snapshot.generatedAt})`,
    "This is real workspace data. It is the ONLY source of business statistics you may use.",
    JSON.stringify(snapshot, null, 2),
  ].join("\n");
}

function productCopyPrompt(
  payload: Extract<AiGeneratePayload, { kind: "product_description" }>,
  context: AiPromptContext,
) {
  const input = payload.input;

  return {
    system: [
      COMMON_RULES,
      "",
      `TASK: Write product copy for a merchant. ${languageInstruction(input.language)} Tone: ${AI_TONE_LABELS[input.tone]}.`,
      "Make the description concrete and appealing. Do not invent certifications, materials, warranties or guarantees that the merchant did not supply.",
      "",
      "Return exactly this JSON shape:",
      PRODUCT_COPY_SHAPE,
    ].join("\n"),
    user: [
      businessContext(context),
      "",
      "PRODUCT DETAILS",
      `Product name: ${input.productName}`,
      `Category: ${input.category || "Not provided"}`,
      `Features: ${input.features}`,
      `Target customers: ${input.targetCustomers || "Not provided"}`,
      "",
      "Write the title, description and key selling points. Keep every claim grounded in the details above.",
    ].join("\n"),
  };
}

function marketingPrompt(
  payload: Extract<AiGeneratePayload, { kind: "marketing" }>,
  context: AiPromptContext,
) {
  const input = payload.input;
  const channel = AI_CHANNEL_LABELS[input.channel];

  return {
    system: [
      COMMON_RULES,
      "",
      `TASK: Write marketing copy for the channel "${channel}". ${languageInstruction(input.language)} Tone: ${AI_TONE_LABELS[input.tone]}.`,
      "Make it sound natural for the channel. WhatsApp messages should be short and conversational with a clear next step. Facebook and Instagram captions can be warmer and use a few relevant hashtags. A launch announcement should create anticipation. A promotional campaign should explain the offer clearly and honestly.",
      "Do not invent discounts, delivery promises, prices, dates or stock levels that were not supplied. Never claim a message was sent.",
      "",
      "Return exactly this JSON shape:",
      MARKETING_SHAPE,
    ].join("\n"),
    user: [
      businessContext(context),
      "",
      "CAMPAIGN DETAILS",
      `Channel: ${channel}`,
      `Topic: ${input.topic}`,
      `Product: ${input.productName || "Not provided"}`,
      `Key benefits: ${input.keyBenefits || "Not provided"}`,
      `Offer: ${input.offer || "Not provided"}`,
      `Audience: ${input.audience || "Not provided"}`,
      `Preferred call to action: ${input.callToAction || "Choose a suitable one"}`,
      "",
      "Write the copy. Hashtags may be an empty array for WhatsApp.",
    ].join("\n"),
  };
}

function insightPrompt(
  payload: Extract<AiGeneratePayload, { kind: "insight" }>,
  context: AiPromptContext,
) {
  const input = payload.input;

  return {
    system: [
      COMMON_RULES,
      "",
      `TASK: Explain what the merchant should notice in their business data. ${languageInstruction(input.language)}.`,
      "Use the snapshot as your only source. Mention exact figures when you make a claim. If a section is marked unavailable, say so instead of treating it as zero. Do not compare with periods that are not supplied.",
      "Prefer a small number of useful observations over a long generic report. Observations may be positive, warning or opportunity. Opportunities must be realistic actions for a small merchant.",
      "",
      "Return exactly this JSON shape:",
      INSIGHT_SHAPE,
    ].join("\n"),
    user: [
      businessContext(context),
      snapshotBlock(context.snapshot),
      "",
      `FOCUS REQUEST: ${input.focus || "Give me the most important observations from this period."}`,
      "",
      "Analyse only what the snapshot shows. Never add a statistic that is not present in it.",
    ].join("\n"),
  };
}

function assistantPrompt(
  payload: Extract<AiGeneratePayload, { kind: "assistant" }>,
  context: AiPromptContext,
) {
  const input = payload.input;
  const recent = input.history.slice(-6);

  return {
    system: [
      COMMON_RULES,
      "",
      `TASK: Answer the merchant's question as a practical business assistant. ${languageInstruction(input.language)}.`,
      "Be concise but useful. Use the snapshot for any business claim. If the merchant asks for something the snapshot does not contain, say what is missing. If they ask you to write copy, put the full draft inside the reply.",
      "You may suggest what the merchant could do next, but never say that you did it.",
      "",
      "Return exactly this JSON shape:",
      ASSISTANT_SHAPE,
    ].join("\n"),
    user: [
      businessContext(context),
      snapshotBlock(context.snapshot),
      "",
      "CONVERSATION SO FAR",
      recent.length
        ? recent
            .map(
              (message) =>
                `${message.role === "user" ? "Merchant" : "TUMA AI"}: ${message.content}`,
            )
            .join("\n")
        : "(This is the first message.)",
      "",
      `MERCHANT MESSAGE: ${input.message}`,
    ].join("\n"),
  };
}

function buildStoredPrompt(
  payload: AiGeneratePayload,
  language: AiLanguage,
): AiStoredPrompt {
  const capturedAt = new Date().toISOString();
  let input: Record<string, unknown>;

  switch (payload.kind) {
    case "product_description":
      input = { ...payload.input };
      break;
    case "marketing":
      input = { ...payload.input };
      break;
    case "insight":
      input = { focus: payload.input.focus };
      break;
    case "assistant":
      input = {
        message: payload.input.message,
        history: payload.input.history.slice(-4).map((message) => ({
          role: message.role,
          content: message.content.slice(0, 600),
        })),
      };
      break;
  }

  return { kind: payload.kind, language, input, capturedAt };
}

function serialiseStoredPrompt(prompt: AiStoredPrompt): string {
  const raw = JSON.stringify(prompt);

  if (raw.length <= AI_MAX_STORED_PROMPT_CHARS) {
    return raw;
  }

  let excerpt = raw.slice(0, AI_MAX_STORED_PROMPT_CHARS - 500);
  let text = JSON.stringify({
    kind: prompt.kind,
    language: prompt.language,
    input: {},
    capturedAt: prompt.capturedAt,
    truncated: true,
    excerpt,
  });

  while (text.length > AI_MAX_STORED_PROMPT_CHARS && excerpt.length > 200) {
    excerpt = excerpt.slice(0, Math.floor(excerpt.length * 0.8));
    text = JSON.stringify({
      kind: prompt.kind,
      language: prompt.language,
      input: {},
      capturedAt: prompt.capturedAt,
      truncated: true,
      excerpt,
    });
  }

  return text;
}

export function buildAiPrompt(
  payload: AiGeneratePayload,
  context: AiPromptContext,
): BuiltPrompt {
  const built =
    payload.kind === "product_description"
      ? productCopyPrompt(payload, context)
      : payload.kind === "marketing"
        ? marketingPrompt(payload, context)
        : payload.kind === "insight"
          ? insightPrompt(payload, context)
          : assistantPrompt(payload, context);

  const stored = buildStoredPrompt(payload, payload.input.language);

  return {
    system: built.system,
    user: built.user,
    promptForDatabase: serialiseStoredPrompt(stored),
  };
}

/**
 * The API stores this exact string in `ai_generations.prompt`. Kept separate
 * from the provider prompt so history never contains anything the merchant
 * did not type (and always stays inside the database length constraint).
 */
export function serialiseStoredPromptForDatabase(
  prompt: AiStoredPrompt,
): string {
  return serialiseStoredPrompt(prompt);
}

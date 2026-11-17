"use client";

import { useState } from "react";
import { CircleAlert, Loader2, Megaphone, Sparkles } from "lucide-react";
import { toast } from "sonner";

import {
  AiField,
  AiLanguageToggle,
  AiSelect,
  AiSuggestionChip,
  AiToneSelect,
  AiToolHeading,
} from "@/components/dashboard/ai/ai-fields";
import { AiGenerationCard } from "@/components/dashboard/ai/generation-card";
import type { AiToolCallbacks } from "@/components/dashboard/ai/tool-props";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AiClientError,
  aiErrorMessage,
  requestAiGeneration,
} from "@/lib/ai/client";
import { aiFieldError, type AiFieldErrors } from "@/lib/ai/field-errors";
import {
  AI_CHANNELS,
  AI_CHANNEL_LABELS,
  type AiChannel,
  type AiHistoryItem,
  type AiLanguage,
  type AiTone,
} from "@/lib/ai/types";

const TOPIC_PRESETS = [
  "Weekend flash sale",
  "New arrival announcement",
  "Restock alert",
  "Holiday gift guide",
  "Loyalty thank-you message",
];

export function AiMarketingTool({
  configured,
  onCreated,
  onUpdated,
  onDeleted,
}: AiToolCallbacks) {
  const [channel, setChannel] = useState<AiChannel>("whatsapp");
  const [topic, setTopic] = useState("");
  const [productName, setProductName] = useState("");
  const [keyBenefits, setKeyBenefits] = useState("");
  const [offer, setOffer] = useState("");
  const [audience, setAudience] = useState("");
  const [callToAction, setCallToAction] = useState("");
  const [language, setLanguage] = useState<AiLanguage>("en");
  const [tone, setTone] = useState<AiTone>("friendly");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<AiFieldErrors>({});
  const [result, setResult] = useState<AiHistoryItem | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!configured || busy) {
      return;
    }

    setBusy(true);
    setError(null);
    setFieldErrors({});

    try {
      const generation = await requestAiGeneration({
        kind: "marketing",
        input: {
          channel,
          topic: topic.trim(),
          productName: productName.trim(),
          keyBenefits: keyBenefits.trim(),
          offer: offer.trim(),
          audience: audience.trim(),
          callToAction: callToAction.trim(),
          language,
          tone,
        },
      });

      setResult(generation);
      onCreated(generation);
      toast.success("Marketing copy is ready.");
    } catch (submitError) {
      if (submitError instanceof AiClientError) {
        setFieldErrors(submitError.fieldErrors ?? {});
      }
      setError(aiErrorMessage(submitError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4"
      >
        <AiToolHeading
          icon={<Megaphone className="size-4" aria-hidden />}
          title="Marketing assistant"
          description="Draft WhatsApp promos, social captions, launch announcements and campaign messages."
          action={
            <AiLanguageToggle
              value={language}
              onChange={setLanguage}
              disabled={busy}
            />
          }
        />

        <div className="mt-4 grid gap-3">
          <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
            <AiField label="Channel" htmlFor="ai-marketing-channel">
              <AiSelect
                id="ai-marketing-channel"
                value={channel}
                onChange={(value) => setChannel(value as AiChannel)}
                disabled={busy}
              >
                {AI_CHANNELS.map((option) => (
                  <option key={option} value={option}>
                    {AI_CHANNEL_LABELS[option]}
                  </option>
                ))}
              </AiSelect>
            </AiField>

            <AiField label="Tone" htmlFor="ai-marketing-tone">
              <AiToneSelect
                id="ai-marketing-tone"
                value={tone}
                onChange={setTone}
                disabled={busy}
              />
            </AiField>
          </div>

          <AiField
            label="What is the message about?"
            htmlFor="ai-marketing-topic"
            error={aiFieldError(fieldErrors, "topic")}
          >
            <Input
              id="ai-marketing-topic"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="Weekend promotion on our best-selling tote bags"
              maxLength={200}
              disabled={busy}
            />
          </AiField>

          <div className="flex flex-wrap gap-1.5">
            {TOPIC_PRESETS.map((preset) => (
              <AiSuggestionChip
                key={preset}
                onClick={() => setTopic(preset)}
                disabled={busy}
              >
                {preset}
              </AiSuggestionChip>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <AiField
              label="Product"
              htmlFor="ai-marketing-product"
              hint="Optional."
              error={aiFieldError(fieldErrors, "productName")}
            >
              <Input
                id="ai-marketing-product"
                value={productName}
                onChange={(event) => setProductName(event.target.value)}
                placeholder="Ankara print tote bag"
                maxLength={160}
                disabled={busy}
              />
            </AiField>

            <AiField
              label="Offer or price"
              htmlFor="ai-marketing-offer"
              hint="Only what is true. Leave empty if there is no offer."
              error={aiFieldError(fieldErrors, "offer")}
            >
              <Input
                id="ai-marketing-offer"
                value={offer}
                onChange={(event) => setOffer(event.target.value)}
                placeholder="10% off until Sunday"
                maxLength={300}
                disabled={busy}
              />
            </AiField>
          </div>

          <AiField
            label="Key benefits"
            htmlFor="ai-marketing-benefits"
            hint="What should the customer remember?"
            error={aiFieldError(fieldErrors, "keyBenefits")}
          >
            <Textarea
              id="ai-marketing-benefits"
              value={keyBenefits}
              onChange={(event) => setKeyBenefits(event.target.value)}
              placeholder="Handmade, durable, supports local artisans, free delivery in town"
              rows={3}
              maxLength={800}
              disabled={busy}
            />
          </AiField>

          <div className="grid gap-3 sm:grid-cols-2">
            <AiField
              label="Audience"
              htmlFor="ai-marketing-audience"
              hint="Optional."
              error={aiFieldError(fieldErrors, "audience")}
            >
              <Input
                id="ai-marketing-audience"
                value={audience}
                onChange={(event) => setAudience(event.target.value)}
                placeholder="Existing customers and their friends"
                maxLength={300}
                disabled={busy}
              />
            </AiField>

            <AiField
              label="Preferred call to action"
              htmlFor="ai-marketing-cta"
              hint="Optional. The assistant can choose one."
              error={aiFieldError(fieldErrors, "callToAction")}
            >
              <Input
                id="ai-marketing-cta"
                value={callToAction}
                onChange={(event) => setCallToAction(event.target.value)}
                placeholder="Reply on WhatsApp to order"
                maxLength={160}
                disabled={busy}
              />
            </AiField>
          </div>
        </div>

        {error ? (
          <p
            role="alert"
            className="mt-3 flex items-start gap-2 rounded-lg border border-rose-400/20 bg-rose-400/[0.06] px-3 py-2 text-[11px] leading-relaxed text-rose-200"
          >
            <CircleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            {error}
          </p>
        ) : null}

        {!configured ? (
          <p className="mt-3 text-[10.5px] text-amber-glow">
            Add TUMA_AI_API_KEY on the server to enable generation.
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button type="submit" disabled={!configured || busy}>
            {busy ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <Sparkles className="size-3.5" aria-hidden />
            )}
            {busy ? "Writing…" : "Generate marketing copy"}
          </Button>
          <p className="text-[10px] text-muted-foreground">
            Nothing is sent to customers. Copy the result into your own app.
          </p>
        </div>
      </form>

      {result ? (
        <div className="space-y-2">
          <h3 className="px-1 font-heading text-[12.5px] font-medium">
            Latest result
          </h3>
          <AiGenerationCard
            item={result}
            onUpdated={(updated) => {
              setResult(updated);
              onUpdated(updated);
            }}
            onDeleted={(id) => {
              setResult(null);
              onDeleted(id);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

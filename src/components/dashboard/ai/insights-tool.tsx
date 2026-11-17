"use client";

import { useState } from "react";
import {
  CircleAlert,
  LineChart,
  Loader2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import {
  AiField,
  AiLanguageToggle,
  AiSuggestionChip,
  AiToolHeading,
} from "@/components/dashboard/ai/ai-fields";
import { AiGenerationCard } from "@/components/dashboard/ai/generation-card";
import { AiSnapshotPanel } from "@/components/dashboard/ai/snapshot-panel";
import type { AiToolCallbacks } from "@/components/dashboard/ai/tool-props";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AiClientError,
  aiErrorMessage,
  requestAiGeneration,
} from "@/lib/ai/client";
import { aiFieldError, type AiFieldErrors } from "@/lib/ai/field-errors";
import type { AiInsightSnapshot } from "@/lib/ai/insights";
import type { AiHistoryItem, AiLanguage } from "@/lib/ai/types";

type Props = AiToolCallbacks & {
  snapshot: AiInsightSnapshot;
};

const FOCUS_PRESETS = [
  "What should I restock first?",
  "Why did revenue change?",
  "Which products deserve more promotion?",
  "Where are my biggest opportunities?",
];

export function AiInsightsTool({
  configured,
  snapshot,
  onCreated,
  onUpdated,
  onDeleted,
}: Props) {
  const [focus, setFocus] = useState("");
  const [language, setLanguage] = useState<AiLanguage>("en");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<AiFieldErrors>({});
  const [results, setResults] = useState<AiHistoryItem[]>([]);

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
        kind: "insight",
        input: { focus: focus.trim(), language },
      });

      setResults((current) => [generation, ...current].slice(0, 4));
      onCreated(generation);
      toast.success("Business insights are ready.");
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
    <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
      <div className="min-w-0 space-y-4">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4"
        >
          <AiToolHeading
            icon={<LineChart className="size-4" aria-hidden />}
            title="Business insights"
            description="Ask for a plain-language read of the real numbers in your workspace. TUMA calculates the figures first."
            action={
              <AiLanguageToggle
                value={language}
                onChange={setLanguage}
                disabled={busy}
              />
            }
          />

          <div className="mt-4 grid gap-3">
            <AiField
              label="What do you want to understand?"
              htmlFor="ai-insight-focus"
              hint="Optional. Leave empty for the most important observations."
              error={aiFieldError(fieldErrors, "focus")}
            >
              <Textarea
                id="ai-insight-focus"
                value={focus}
                onChange={(event) => setFocus(event.target.value)}
                placeholder="Should I restock anything before the weekend?"
                rows={3}
                maxLength={300}
                disabled={busy}
              />
            </AiField>

            <div className="flex flex-wrap gap-1.5">
              {FOCUS_PRESETS.map((preset) => (
                <AiSuggestionChip
                  key={preset}
                  onClick={() => setFocus(preset)}
                  disabled={busy}
                >
                  {preset}
                </AiSuggestionChip>
              ))}
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
              {busy ? "Analysing…" : "Analyse my business"}
            </Button>
            <p className="text-[10px] text-muted-foreground">
              Based on the last {snapshot.windowDays} days.
            </p>
          </div>
        </form>

        {results.length > 0 ? (
          <div className="space-y-2">
            <h3 className="px-1 font-heading text-[12.5px] font-medium">
              Insights from this session
            </h3>
            {results.map((item) => (
              <AiGenerationCard
                key={item.id}
                item={item}
                collapsible
                onUpdated={(updated) => {
                  setResults((current) =>
                    current.map((entry) =>
                      entry.id === updated.id ? updated : entry,
                    ),
                  );
                  onUpdated(updated);
                }}
                onDeleted={(id) => {
                  setResults((current) =>
                    current.filter((entry) => entry.id !== id),
                  );
                  onDeleted(id);
                }}
              />
            ))}
          </div>
        ) : null}
      </div>

      <AiSnapshotPanel snapshot={snapshot} />
    </div>
  );
}

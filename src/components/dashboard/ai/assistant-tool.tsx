"use client";

import { useRef, useState } from "react";
import {
  Bot,
  CircleAlert,
  Loader2,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";

import {
  AiLanguageToggle,
  AiSuggestionChip,
  AiToolHeading,
} from "@/components/dashboard/ai/ai-fields";
import type { AiToolCallbacks } from "@/components/dashboard/ai/tool-props";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  aiErrorMessage,
  requestAiGeneration,
} from "@/lib/ai/client";
import type { AiLanguage } from "@/lib/ai/types";

type Props = AiToolCallbacks;

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const SUGGESTIONS = [
  "Which products should I restock first?",
  "Write a short WhatsApp promo for my best seller.",
  "Explain what changed in my revenue this month.",
  "Give me three ideas to increase repeat orders.",
];

const MAX_HISTORY_MESSAGES = 8;
const MAX_HISTORY_CONTENT = 2_000;

function messageId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function AiAssistantTool({
  configured,
  onCreated,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState<AiLanguage>("en");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  async function sendMessage(message: string) {
    const trimmed = message.trim();

    if (!configured || busy || trimmed.length < 2) {
      return;
    }

    const prior = messages;
    const history = prior
      .slice(-MAX_HISTORY_MESSAGES)
      .map((entry) => ({
        role: entry.role,
        content: entry.content.slice(0, MAX_HISTORY_CONTENT),
      }));

    const userMessage: ChatMessage = {
      id: messageId(),
      role: "user",
      content: trimmed,
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setBusy(true);
    setError(null);

    try {
      const generation = await requestAiGeneration({
        kind: "assistant",
        input: { message: trimmed, history, language },
      });

      const reply =
        generation.result && "reply" in generation.result
          ? generation.result.reply
          : "TUMA AI returned an empty reply. Please try again.";

      setMessages((current) => [
        ...current,
        { id: generation.id, role: "assistant", content: reply },
      ]);
      onCreated(generation);
    } catch (submitError) {
      setError(aiErrorMessage(submitError));
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02]">
      <div className="border-b border-white/[0.06] px-4 py-3">
        <AiToolHeading
          icon={<Bot className="size-4" aria-hidden />}
          title="TUMA AI assistant"
          description="Ask about your business or ask for a draft. It uses your real aggregate numbers and never contacts customers."
          action={
            <div className="flex items-center gap-2">
              <AiLanguageToggle
                value={language}
                onChange={setLanguage}
                disabled={busy}
              />
              {messages.length > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => {
                    setMessages([]);
                    setError(null);
                  }}
                  disabled={busy}
                  aria-label="Clear conversation"
                  title="Clear conversation"
                >
                  <Trash2 className="size-3.5" aria-hidden />
                </Button>
              ) : null}
            </div>
          }
        />
      </div>

      <div className="max-h-[min(28rem,60vh)] min-h-[14rem] space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center py-6 text-center">
            <span className="grid size-10 place-items-center rounded-xl border border-electric-400/20 bg-electric-500/10 text-electric-300">
              <Sparkles className="size-4.5" aria-hidden />
            </span>
            <p className="mt-3 text-[12.5px] font-medium">
              What would you like to work on?
            </p>
            <p className="mt-1 max-w-sm text-[11px] leading-relaxed text-muted-foreground">
              The assistant can explain your numbers, suggest next steps and
              draft product or marketing copy. It cannot send messages or change
              orders.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-1.5">
              {SUGGESTIONS.map((suggestion) => (
                <AiSuggestionChip
                  key={suggestion}
                  onClick={() => {
                    setInput(suggestion);
                    inputRef.current?.focus();
                  }}
                  disabled={busy || !configured}
                >
                  {suggestion}
                </AiSuggestionChip>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) =>
            message.role === "user" ? (
              <div key={message.id} className="flex justify-end">
                <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-electric-500/15 px-3 py-2 text-[11.5px] leading-relaxed whitespace-pre-wrap text-foreground/90 ring-1 ring-electric-400/20">
                  {message.content}
                </p>
              </div>
            ) : (
              <div key={message.id} className="flex items-start gap-2">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-electric-300">
                  <Bot className="size-3.5" aria-hidden />
                </span>
                <p className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white/[0.035] px-3 py-2 text-[11.5px] leading-relaxed whitespace-pre-wrap text-foreground/85 ring-1 ring-white/[0.06]">
                  {message.content}
                </p>
              </div>
            ),
          )
        )}

        {busy ? (
          <div className="flex items-start gap-2">
            <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-electric-300">
              <Bot className="size-3.5" aria-hidden />
            </span>
            <p className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-white/[0.035] px-3 py-2 text-[11px] text-muted-foreground ring-1 ring-white/[0.06]">
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
              Thinking…
            </p>
          </div>
        ) : null}
      </div>

      <div className="border-t border-white/[0.06] px-4 py-3">
        {error ? (
          <p
            role="alert"
            className="mb-2 flex items-start gap-2 rounded-lg border border-rose-400/20 bg-rose-400/[0.06] px-3 py-2 text-[11px] leading-relaxed text-rose-200"
          >
            <CircleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            {error}
          </p>
        ) : null}

        {!configured ? (
          <p className="mb-2 text-[10.5px] text-amber-glow">
            Add TUMA_AI_API_KEY on the server to enable the assistant.
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void sendMessage(input);
              }
            }}
            placeholder={
              configured
                ? "Ask about your business or request a draft…"
                : "AI is not connected yet"
            }
            rows={2}
            maxLength={1_500}
            disabled={busy || !configured}
            className="min-h-[2.5rem] resize-none"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!configured || busy || input.trim().length < 2}
            aria-label="Send message"
            title="Send"
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Send className="size-4" aria-hidden />
            )}
          </Button>
        </form>
        <p className="mt-1.5 text-[9.5px] text-muted-foreground">
          Enter sends · Shift + Enter adds a new line. Conversation replies are
          saved in your history.
        </p>
      </div>
    </div>
  );
}

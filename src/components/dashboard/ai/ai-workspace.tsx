"use client";

import { useState } from "react";
import {
  Bot,
  History,
  KeyRound,
  LineChart,
  Megaphone,
  Package,
  PlugZap,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { AiAssistantTool } from "@/components/dashboard/ai/assistant-tool";
import { AiHistoryPanel } from "@/components/dashboard/ai/history-panel";
import { AiInsightsTool } from "@/components/dashboard/ai/insights-tool";
import { AiMarketingTool } from "@/components/dashboard/ai/marketing-tool";
import { AiProductCopyTool } from "@/components/dashboard/ai/product-copy-tool";
import { StatusBadge } from "@/components/dashboard/status-badge";
import type { AiInsightSnapshot } from "@/lib/ai/insights";
import type {
  AiCatalogueOption,
  AiHistoryItem,
  AiPublicStatus,
} from "@/lib/ai/types";
import { cn } from "cn";

type Tab = "product" | "marketing" | "insights" | "assistant" | "history";

const TABS: {
  value: Tab;
  label: string;
  icon: typeof Package;
}[] = [
  { value: "product", label: "Product copy", icon: Package },
  { value: "marketing", label: "Marketing", icon: Megaphone },
  { value: "insights", label: "Insights", icon: LineChart },
  { value: "assistant", label: "Assistant", icon: Bot },
  { value: "history", label: "History", icon: History },
];

export function AiWorkspace({
  status,
  snapshot,
  products,
  initialHistory,
  historyError,
}: {
  status: AiPublicStatus;
  snapshot: AiInsightSnapshot;
  products: AiCatalogueOption[];
  initialHistory: AiHistoryItem[];
  historyError: string | null;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("product");
  const [items, setItems] = useState<AiHistoryItem[]>(initialHistory);

  function handleCreated(item: AiHistoryItem) {
    setItems((current) => [
      item,
      ...current.filter((entry) => entry.id !== item.id),
    ]);
  }

  function handleUpdated(item: AiHistoryItem) {
    setItems((current) =>
      current.map((entry) => (entry.id === item.id ? item : entry)),
    );
  }

  function handleDeleted(id: string) {
    setItems((current) => current.filter((entry) => entry.id !== id));
  }

  const callbacks = {
    configured: status.configured,
    onCreated: handleCreated,
    onUpdated: handleUpdated,
    onDeleted: handleDeleted,
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 font-heading text-[1.65rem] leading-tight font-semibold tracking-[-0.035em] sm:text-[1.9rem]">
            TUMA AI
            <Sparkles
              className="size-5 text-electric-300 sm:size-6"
              aria-hidden
            />
          </h1>
          <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-muted-foreground">
            Write product and marketing copy in English or French, and get
            insights from your real workspace data. Drafts only — TUMA AI never
            sends messages, changes orders or verifies payments.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {status.configured ? (
            <StatusBadge tone="success">
              <PlugZap className="size-2.5" aria-hidden />
              Connected
            </StatusBadge>
          ) : (
            <StatusBadge tone="warning">
              <KeyRound className="size-2.5" aria-hidden />
              Not connected
            </StatusBadge>
          )}
          <StatusBadge tone="neutral">
            {items.length} saved
          </StatusBadge>
        </div>
      </div>

      {status.error ? (
        <div
          role="alert"
          className="rounded-2xl border border-rose-400/25 bg-rose-400/[0.06] px-4 py-3.5"
        >
          <p className="flex items-center gap-2 text-[12px] font-medium text-rose-200">
            <KeyRound className="size-4 shrink-0" aria-hidden />
            The AI configuration needs attention
          </p>
          <p className="mt-1.5 text-[11px] leading-relaxed text-rose-200/85">
            {status.error}
          </p>
          <p className="mt-2 text-[10.5px] leading-relaxed text-muted-foreground">
            Correct the TUMA_AI_* values in <code>.env.local</code> and restart
            the server. Secret keys are read on the server only and are never
            sent to the browser.
          </p>
        </div>
      ) : !status.configured ? (
        <div className="rounded-2xl border border-amber-glow/20 bg-amber-glow/[0.05] px-4 py-3.5">
          <p className="flex items-center gap-2 text-[12px] font-medium text-amber-glow">
            <KeyRound className="size-4 shrink-0" aria-hidden />
            TUMA AI is not connected yet
          </p>
          <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
            Everything else in your workspace works normally. To enable AI,
            add these server-only values to <code>.env.local</code> and restart
            the server:
          </p>
          <ul className="mt-2 space-y-1 text-[10.5px] leading-relaxed text-muted-foreground">
            <li>
              <code className="text-foreground/90">TUMA_AI_API_KEY</code> — your
              provider key (required).
            </li>
            <li>
              <code className="text-foreground/90">TUMA_AI_MODEL</code> —
              defaults to <code>gpt-4o-mini</code>.
            </li>
            <li>
              <code className="text-foreground/90">TUMA_AI_BASE_URL</code> —
              defaults to <code>https://api.openai.com/v1</code> for any
              OpenAI-compatible provider.
            </li>
          </ul>
          <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground/80">
            Nothing is charged or sent until you connect a provider. You can
            explore the forms and your live business snapshot below.
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-mint-glow/15 bg-mint-glow/[0.04] px-3.5 py-2.5 text-[10.5px] leading-relaxed text-mint-glow">
          <PlugZap className="size-3.5 shrink-0" aria-hidden />
          <span>
            Connected to {status.providerHost} using {status.model}
            {status.rateLimitPerHour
              ? ` · up to ${status.rateLimitPerHour} requests per hour`
              : ""}
            .
          </span>
        </div>
      )}

      <div className="overflow-x-auto">
        <div
          role="tablist"
          aria-label="TUMA AI tools"
          className="inline-flex min-w-full items-center gap-1 rounded-xl border border-white/[0.07] bg-white/[0.02] p-1 sm:min-w-0"
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.value;

            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-[11.5px] font-medium transition-colors",
                  active
                    ? "bg-electric-500/15 text-electric-200 ring-1 ring-electric-400/20"
                    : "text-muted-foreground hover:bg-white/[0.03] hover:text-foreground",
                )}
              >
                <Icon className="size-3.5" aria-hidden />
                {tab.label}
                {tab.value === "history" && items.length > 0 ? (
                  <span className="rounded-full bg-white/[0.08] px-1.5 text-[9px] tabular-nums">
                    {items.length}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div role="tabpanel">
        {activeTab === "product" ? (
          <AiProductCopyTool {...callbacks} products={products} />
        ) : null}
        {activeTab === "marketing" ? <AiMarketingTool {...callbacks} /> : null}
        {activeTab === "insights" ? (
          <AiInsightsTool {...callbacks} snapshot={snapshot} />
        ) : null}
        {activeTab === "assistant" ? (
          <AiAssistantTool {...callbacks} />
        ) : null}
        {activeTab === "history" ? (
          <AiHistoryPanel
            items={items}
            error={historyError}
            onUpdated={handleUpdated}
            onDeleted={handleDeleted}
          />
        ) : null}
      </div>

      <div className="flex flex-wrap items-start gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5">
        <ShieldCheck
          className="mt-0.5 size-3.5 shrink-0 text-mint-glow"
          aria-hidden
        />
        <p className="min-w-0 flex-1 text-[10px] leading-relaxed text-muted-foreground">
          AI requests are handled on the server. Insights and the assistant
          receive only aggregate product, stock and order totals — never
          customer names, phones, emails or addresses. Every result is saved in
          your history so you can review, edit or delete it.
        </p>
      </div>
    </div>
  );
}

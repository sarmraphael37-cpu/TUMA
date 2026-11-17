"use client";

import { useMemo, useState } from "react";
import { History, Sparkles } from "lucide-react";

import { AiGenerationCard } from "@/components/dashboard/ai/generation-card";
import { EmptyState } from "@/components/dashboard/states/empty-state";
import { cn } from "cn";
import {
  AI_KIND_LABELS,
  type AiHistoryItem,
  type AiKind,
} from "@/lib/ai/types";

type Filter = AiKind | "all";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "product_description", label: "Product copy" },
  { value: "marketing", label: "Marketing" },
  { value: "insight", label: "Insights" },
  { value: "assistant", label: "Assistant" },
];

export function AiHistoryPanel({
  items,
  error,
  onUpdated,
  onDeleted,
  compact = false,
}: {
  items: AiHistoryItem[];
  error: string | null;
  onUpdated: (item: AiHistoryItem) => void;
  onDeleted: (id: string) => void;
  compact?: boolean;
}) {
  const [filter, setFilter] = useState<Filter>("all");

  const counts = useMemo(() => {
    const result: Record<Filter, number> = {
      all: items.length,
      product_description: 0,
      marketing: 0,
      insight: 0,
      assistant: 0,
    };

    for (const item of items) {
      if (item.kind !== "other") {
        result[item.kind] += 1;
      }
    }

    return result;
  }, [items]);

  const visible = useMemo(
    () =>
      filter === "all"
        ? items
        : items.filter((item) => item.kind === filter),
    [items, filter],
  );

  return (
    <div className="space-y-3">
      {!compact ? (
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFilter(option.value)}
              aria-pressed={filter === option.value}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[10.5px] font-medium transition-colors",
                filter === option.value
                  ? "border-electric-400/30 bg-electric-500/12 text-electric-200"
                  : "border-white/[0.08] text-muted-foreground hover:border-white/[0.15] hover:text-foreground",
              )}
            >
              {option.label}
              <span className="ml-1 text-[9px] opacity-70">
                {counts[option.value]}
              </span>
            </button>
          ))}
        </div>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-amber-glow/20 bg-amber-glow/[0.05] px-3.5 py-3 text-[11px] leading-relaxed text-amber-glow">
          {error}
        </p>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02]">
          <EmptyState
            icon={<History className="size-5" aria-hidden />}
            title={
              items.length === 0
                ? "No AI generations yet"
                : "Nothing in this filter"
            }
            description={
              items.length === 0
                ? "Generate product copy, marketing messages or business insights and they will appear here for you to reuse and edit."
                : "Choose another filter to see your other saved content."
            }
          />
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((item) => (
            <AiGenerationCard
              key={item.id}
              item={item}
              collapsible
              onUpdated={onUpdated}
              onDeleted={onDeleted}
            />
          ))}
        </div>
      )}

      {!compact && items.length > 0 ? (
        <p className="flex items-center gap-1.5 px-1 text-[10px] text-muted-foreground">
          <Sparkles className="size-3" aria-hidden />
          The latest {items.length} generations are kept. Editing a result
          updates your saved history.
        </p>
      ) : null}
    </div>
  );
}

export function aiHistoryLabel(item: AiHistoryItem) {
  return item.kind === "other" ? "AI generation" : AI_KIND_LABELS[item.kind];
}

"use client";

import { useState } from "react";
import {
  Bot,
  ChevronDown,
  ChevronUp,
  Copy,
  Loader2,
  Megaphone,
  Package,
  Pencil,
  Save,
  Sparkles,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { AiField } from "@/components/dashboard/ai/ai-fields";
import { AiResultView } from "@/components/dashboard/ai/result-view";
import { StatusBadge, type StatusTone } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  aiErrorMessage,
  deleteAiGenerationRequest,
  updateAiGenerationResult,
} from "@/lib/ai/client";
import {
  formatAiResultAsText,
  getResultPreview,
} from "@/lib/ai/result";
import {
  AI_CHANNEL_LABELS,
  AI_KIND_LABELS,
  type AiChannel,
  type AiHistoryItem,
  type AiKind,
  type AiResult,
} from "@/lib/ai/types";
import { formatDateTime, formatNumber } from "@/lib/format";
import { cn } from "cn";

const kindIcons: Record<AiKind | "other", typeof Package> = {
  product_description: Package,
  marketing: Megaphone,
  insight: TrendingUp,
  assistant: Bot,
  other: Sparkles,
};

const statusTones: Record<AiHistoryItem["status"], StatusTone> = {
  pending: "warning",
  completed: "success",
  failed: "danger",
};

type Draft = {
  title: string;
  description: string;
  sellingPoints: string;
  headline: string;
  body: string;
  hashtags: string;
  callToAction: string;
  summary: string;
  observations: string;
  opportunities: string;
  reply: string;
};

const EMPTY_DRAFT: Draft = {
  title: "",
  description: "",
  sellingPoints: "",
  headline: "",
  body: "",
  hashtags: "",
  callToAction: "",
  summary: "",
  observations: "",
  opportunities: "",
  reply: "",
};

function toDraft(item: AiHistoryItem): Draft {
  if (!item.result) {
    return { ...EMPTY_DRAFT };
  }

  if (item.kind === "product_description") {
    const result = item.result as {
      title: string;
      description: string;
      sellingPoints: string[];
    };

    return {
      ...EMPTY_DRAFT,
      title: result.title,
      description: result.description,
      sellingPoints: result.sellingPoints.join("\n"),
    };
  }

  if (item.kind === "marketing") {
    const result = item.result as {
      headline: string;
      body: string;
      hashtags: string[];
      callToAction: string;
    };

    return {
      ...EMPTY_DRAFT,
      headline: result.headline,
      body: result.body,
      hashtags: result.hashtags.join(", "),
      callToAction: result.callToAction,
    };
  }

  if (item.kind === "insight") {
    const result = item.result as {
      summary: string;
      observations: { title: string; detail: string; severity: string }[];
      opportunities: { title: string; detail: string; action: string }[];
    };

    return {
      ...EMPTY_DRAFT,
      summary: result.summary,
      observations: result.observations
        .map(
          (observation) =>
            `${observation.title} | ${observation.detail} | ${observation.severity}`,
        )
        .join("\n"),
      opportunities: result.opportunities
        .map(
          (opportunity) =>
            `${opportunity.title} | ${opportunity.detail} | ${opportunity.action}`,
        )
        .join("\n"),
    };
  }

  return {
    ...EMPTY_DRAFT,
    reply: (item.result as { reply: string }).reply,
  };
}

function draftToResult(
  kind: AiKind,
  draft: Draft,
): { result: AiResult | null; error: string | null } {
  if (kind === "product_description") {
    const sellingPoints = draft.sellingPoints
      .split("\n")
      .map((point) => point.trim())
      .filter(Boolean);

    if (!draft.title.trim() || !draft.description.trim()) {
      return { result: null, error: "The title and description cannot be empty." };
    }

    if (sellingPoints.length < 2) {
      return {
        result: null,
        error: "Add at least two key selling points, one per line.",
      };
    }

    return {
      result: {
        title: draft.title.trim(),
        description: draft.description.trim(),
        sellingPoints,
      },
      error: null,
    };
  }

  if (kind === "marketing") {
    if (
      !draft.headline.trim() ||
      !draft.body.trim() ||
      !draft.callToAction.trim()
    ) {
      return {
        result: null,
        error: "The headline, message and call to action cannot be empty.",
      };
    }

    const hashtags = draft.hashtags
      .split(/[\s,]+/)
      .map((tag) => tag.trim())
      .filter(Boolean);

    return {
      result: {
        headline: draft.headline.trim(),
        body: draft.body.trim(),
        hashtags,
        callToAction: draft.callToAction.trim(),
      },
      error: null,
    };
  }

  if (kind === "insight") {
    if (!draft.summary.trim()) {
      return { result: null, error: "The summary cannot be empty." };
    }

    const observations = draft.observations
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [title, detail, severity] = line
          .split("|")
          .map((part) => part.trim());
        return { title, detail, severity };
      });

    if (
      observations.length === 0 ||
      observations.some((observation) => !observation.title || !observation.detail)
    ) {
      return {
        result: null,
        error:
          "Each observation needs a title and a detail. Use Title | Detail | info/warning/opportunity.",
      };
    }

    const opportunities = draft.opportunities
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [title, detail, action] = line
          .split("|")
          .map((part) => part.trim());
        return { title, detail, action };
      });

    if (
      opportunities.some(
        (opportunity) =>
          !opportunity.title || !opportunity.detail || !opportunity.action,
      )
    ) {
      return {
        result: null,
        error:
          "Each opportunity needs a title, a detail and an action. Use Title | Detail | Action.",
      };
    }

    return {
      result: {
        summary: draft.summary.trim(),
        observations: observations.map((observation) => ({
          title: observation.title,
          detail: observation.detail,
          severity:
            observation.severity === "warning" ||
            observation.severity === "opportunity"
              ? observation.severity
              : "info",
        })),
        opportunities: opportunities.map((opportunity) => ({
          title: opportunity.title,
          detail: opportunity.detail,
          action: opportunity.action,
        })),
      },
      error: null,
    };
  }

  if (!draft.reply.trim()) {
    return { result: null, error: "The reply cannot be empty." };
  }

  return { result: { reply: draft.reply.trim() }, error: null };
}

function channelLabel(item: AiHistoryItem) {
  const channel = item.request?.input.channel;

  if (
    typeof channel === "string" &&
    channel in AI_CHANNEL_LABELS
  ) {
    return AI_CHANNEL_LABELS[channel as AiChannel];
  }

  return null;
}

export function AiGenerationCard({
  item,
  onUpdated,
  onDeleted,
  collapsible = false,
  className,
}: {
  item: AiHistoryItem;
  onUpdated?: (item: AiHistoryItem) => void;
  onDeleted?: (id: string) => void;
  collapsible?: boolean;
  className?: string;
}) {
  const [current, setCurrent] = useState(item);
  const [open, setOpen] = useState(!collapsible);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Draft>(() => toDraft(item));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const Icon = kindIcons[current.kind];
  const label =
    current.kind === "other"
      ? "AI generation"
      : AI_KIND_LABELS[current.kind];
  const channel = channelLabel(current);
  const hasResult = Boolean(current.result);

  function startEditing() {
    setDraft(toDraft(current));
    setError(null);
    setEditing(true);
    setOpen(true);
  }

  async function handleCopy() {
    if (!current.result || current.kind === "other") {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        formatAiResultAsText(current.result, current.kind),
      );
      toast.success("Copied to the clipboard.");
    } catch {
      toast.error("Your browser blocked the clipboard. Select the text instead.");
    }
  }

  async function handleSave() {
    if (current.kind === "other") {
      return;
    }

    const built = draftToResult(current.kind, draft);

    if (!built.result) {
      setError(built.error ?? "Check the content and try again.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const updated = await updateAiGenerationResult(current.id, built.result);
      setCurrent(updated);
      onUpdated?.(updated);
      setEditing(false);
      toast.success("Your edit was saved.");
    } catch (saveError) {
      setError(aiErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      await deleteAiGenerationRequest(current.id);
      toast.success("Generation deleted.");
      onDeleted?.(current.id);
    } catch (deleteError) {
      setError(aiErrorMessage(deleteError));
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <article
      className={cn(
        "rounded-xl border border-white/[0.07] bg-white/[0.02]",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2.5 px-3.5 py-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-electric-500/12 text-electric-300 ring-1 ring-electric-400/20">
            <Icon className="size-3.5" aria-hidden />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="text-[12px] font-medium">{label}</p>
              <StatusBadge tone={statusTones[current.status]}>
                {current.status}
              </StatusBadge>
              {current.language ? (
                <StatusBadge tone="neutral">
                  {current.language.toUpperCase()}
                </StatusBadge>
              ) : null}
              {channel ? (
                <StatusBadge tone="info">{channel}</StatusBadge>
              ) : null}
            </div>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              {formatDateTime(current.createdAt)}
              {current.model ? ` · ${current.model}` : ""}
              {current.tokensUsed > 0
                ? ` · ${formatNumber(current.tokensUsed)} tokens`
                : ""}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {hasResult && current.kind !== "other" ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleCopy}
              aria-label="Copy generation"
              title="Copy"
            >
              <Copy className="size-3.5" aria-hidden />
            </Button>
          ) : null}

          {hasResult && current.kind !== "other" && !editing ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={startEditing}
              aria-label="Edit generation"
              title="Edit"
            >
              <Pencil className="size-3.5" aria-hidden />
            </Button>
          ) : null}

          {onDeleted && !editing ? (
            <Button
              type="button"
              variant={confirmDelete ? "destructive" : "ghost"}
              size="icon-sm"
              onClick={handleDelete}
              disabled={deleting}
              aria-label={confirmDelete ? "Confirm delete" : "Delete generation"}
              title={confirmDelete ? "Click again to confirm" : "Delete"}
            >
              {deleting ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
              ) : (
                <Trash2 className="size-3.5" aria-hidden />
              )}
            </Button>
          ) : null}

          {collapsible ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setOpen((value) => !value)}
              aria-label={open ? "Collapse generation" : "Open generation"}
              aria-expanded={open}
            >
              {open ? (
                <ChevronUp className="size-3.5" aria-hidden />
              ) : (
                <ChevronDown className="size-3.5" aria-hidden />
              )}
            </Button>
          ) : null}
        </div>
      </div>

      {!open && collapsible ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="block w-full border-t border-white/[0.05] px-3.5 py-2.5 text-left text-[11px] leading-relaxed text-muted-foreground transition-colors hover:text-foreground"
        >
          {current.result && current.kind !== "other"
            ? getResultPreview(current.result, current.kind)
            : current.errorMessage ?? "No content saved."}
        </button>
      ) : null}

      {open ? (
        <div className="border-t border-white/[0.06] px-3.5 py-3">
          {current.status === "failed" ? (
            <div
              role="alert"
              className="rounded-lg border border-rose-400/20 bg-rose-400/[0.06] px-3 py-2.5 text-[11px] leading-relaxed text-rose-200"
            >
              {current.errorMessage ??
                "This generation failed. Try the request again."}
            </div>
          ) : current.status === "pending" ? (
            <p className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
              This request is still being processed.
            </p>
          ) : !current.result ? (
            <p className="text-[11px] text-muted-foreground">
              This saved item has no readable content.
            </p>
          ) : editing && current.kind !== "other" ? (
            <div className="space-y-3">
              {current.kind === "product_description" ? (
                <>
                  <AiField label="Product title" htmlFor={`title-${current.id}`}>
                    <Input
                      id={`title-${current.id}`}
                      value={draft.title}
                      onChange={(event) =>
                        setDraft((value) => ({
                          ...value,
                          title: event.target.value,
                        }))
                      }
                      maxLength={180}
                    />
                  </AiField>
                  <AiField
                    label="Description"
                    htmlFor={`description-${current.id}`}
                  >
                    <Textarea
                      id={`description-${current.id}`}
                      value={draft.description}
                      onChange={(event) =>
                        setDraft((value) => ({
                          ...value,
                          description: event.target.value,
                        }))
                      }
                      rows={6}
                      maxLength={3000}
                    />
                  </AiField>
                  <AiField
                    label="Key selling points"
                    htmlFor={`points-${current.id}`}
                    hint="One point per line."
                  >
                    <Textarea
                      id={`points-${current.id}`}
                      value={draft.sellingPoints}
                      onChange={(event) =>
                        setDraft((value) => ({
                          ...value,
                          sellingPoints: event.target.value,
                        }))
                      }
                      rows={4}
                    />
                  </AiField>
                </>
              ) : null}

              {current.kind === "marketing" ? (
                <>
                  <AiField label="Headline" htmlFor={`headline-${current.id}`}>
                    <Input
                      id={`headline-${current.id}`}
                      value={draft.headline}
                      onChange={(event) =>
                        setDraft((value) => ({
                          ...value,
                          headline: event.target.value,
                        }))
                      }
                      maxLength={220}
                    />
                  </AiField>
                  <AiField label="Message" htmlFor={`body-${current.id}`}>
                    <Textarea
                      id={`body-${current.id}`}
                      value={draft.body}
                      onChange={(event) =>
                        setDraft((value) => ({
                          ...value,
                          body: event.target.value,
                        }))
                      }
                      rows={7}
                      maxLength={3500}
                    />
                  </AiField>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <AiField
                      label="Hashtags"
                      htmlFor={`hashtags-${current.id}`}
                      hint="Separate with commas or spaces."
                    >
                      <Input
                        id={`hashtags-${current.id}`}
                        value={draft.hashtags}
                        onChange={(event) =>
                          setDraft((value) => ({
                            ...value,
                            hashtags: event.target.value,
                          }))
                        }
                      />
                    </AiField>
                    <AiField
                      label="Call to action"
                      htmlFor={`cta-${current.id}`}
                    >
                      <Input
                        id={`cta-${current.id}`}
                        value={draft.callToAction}
                        onChange={(event) =>
                          setDraft((value) => ({
                            ...value,
                            callToAction: event.target.value,
                          }))
                        }
                        maxLength={220}
                      />
                    </AiField>
                  </div>
                </>
              ) : null}

              {current.kind === "insight" ? (
                <>
                  <AiField label="Summary" htmlFor={`summary-${current.id}`}>
                    <Textarea
                      id={`summary-${current.id}`}
                      value={draft.summary}
                      onChange={(event) =>
                        setDraft((value) => ({
                          ...value,
                          summary: event.target.value,
                        }))
                      }
                      rows={4}
                      maxLength={1600}
                    />
                  </AiField>
                  <AiField
                    label="Observations"
                    htmlFor={`observations-${current.id}`}
                    hint="One per line: Title | Detail | info, warning or opportunity."
                  >
                    <Textarea
                      id={`observations-${current.id}`}
                      value={draft.observations}
                      onChange={(event) =>
                        setDraft((value) => ({
                          ...value,
                          observations: event.target.value,
                        }))
                      }
                      rows={5}
                    />
                  </AiField>
                  <AiField
                    label="Opportunities"
                    htmlFor={`opportunities-${current.id}`}
                    hint="One per line: Title | Detail | Action. Leave empty if there are none."
                  >
                    <Textarea
                      id={`opportunities-${current.id}`}
                      value={draft.opportunities}
                      onChange={(event) =>
                        setDraft((value) => ({
                          ...value,
                          opportunities: event.target.value,
                        }))
                      }
                      rows={4}
                    />
                  </AiField>
                </>
              ) : null}

              {current.kind === "assistant" ? (
                <AiField label="Reply" htmlFor={`reply-${current.id}`}>
                  <Textarea
                    id={`reply-${current.id}`}
                    value={draft.reply}
                    onChange={(event) =>
                      setDraft((value) => ({
                        ...value,
                        reply: event.target.value,
                      }))
                    }
                    rows={8}
                    maxLength={6000}
                  />
                </AiField>
              ) : null}

              {error ? (
                <p className="rounded-lg border border-rose-400/20 bg-rose-400/[0.06] px-3 py-2 text-[11px] text-rose-200">
                  {error}
                </p>
              ) : null}

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  ) : (
                    <Save className="size-3.5" aria-hidden />
                  )}
                  Save edit
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditing(false);
                    setError(null);
                  }}
                  disabled={saving}
                >
                  <X className="size-3.5" aria-hidden />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <AiResultView
                kind={current.kind === "other" ? "assistant" : current.kind}
                result={current.result}
              />
              {error ? (
                <p
                  role="alert"
                  className="rounded-lg border border-rose-400/20 bg-rose-400/[0.06] px-3 py-2 text-[11px] text-rose-200"
                >
                  {error}
                </p>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </article>
  );
}

"use client";

import {
  CircleCheck,
  Info,
  Lightbulb,
  Sparkles,
  TriangleAlert,
} from "lucide-react";

import { cn } from "cn";
import type {
  AiInsightObservation,
  AiKind,
  AiResult,
} from "@/lib/ai/types";

const severityStyles: Record<
  AiInsightObservation["severity"],
  { icon: typeof Info; className: string; label: string }
> = {
  info: {
    icon: Info,
    className: "border-cyan-glow/15 bg-cyan-glow/[0.04] text-cyan-glow",
    label: "Observation",
  },
  warning: {
    icon: TriangleAlert,
    className:
      "border-amber-glow/20 bg-amber-glow/[0.05] text-amber-glow",
    label: "Watch",
  },
  opportunity: {
    icon: Lightbulb,
    className:
      "border-mint-glow/20 bg-mint-glow/[0.05] text-mint-glow",
    label: "Opportunity",
  },
};

export function AiResultView({
  kind,
  result,
}: {
  kind: AiKind;
  result: AiResult;
}) {
  if (kind === "product_description") {
    const copy = result as {
      title: string;
      description: string;
      sellingPoints: string[];
    };

    return (
      <div className="space-y-3">
        <div>
          <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
            Product title
          </p>
          <h4 className="mt-1 font-heading text-[15px] leading-snug font-semibold">
            {copy.title}
          </h4>
        </div>
        <div>
          <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
            Description
          </p>
          <p className="mt-1 text-[12px] leading-relaxed whitespace-pre-wrap text-foreground/85">
            {copy.description}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
            Key selling points
          </p>
          <ul className="mt-1.5 space-y-1.5">
            {copy.sellingPoints.map((point) => (
              <li
                key={point}
                className="flex items-start gap-1.5 text-[11.5px] leading-relaxed text-foreground/85"
              >
                <CircleCheck
                  className="mt-0.5 size-3.5 shrink-0 text-mint-glow"
                  aria-hidden
                />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  if (kind === "marketing") {
    const copy = result as {
      headline: string;
      body: string;
      hashtags: string[];
      callToAction: string;
    };

    return (
      <div className="space-y-3">
        <div>
          <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
            Headline
          </p>
          <h4 className="mt-1 font-heading text-[14.5px] leading-snug font-semibold">
            {copy.headline}
          </h4>
        </div>
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2.5">
          <p className="text-[12px] leading-relaxed whitespace-pre-wrap text-foreground/90">
            {copy.body}
          </p>
        </div>
        {copy.hashtags.length ? (
          <div className="flex flex-wrap gap-1.5">
            {copy.hashtags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-electric-400/20 bg-electric-500/[0.08] px-2 py-0.5 text-[10px] text-electric-200"
              >
                {tag.startsWith("#") ? tag : `#${tag}`}
              </span>
            ))}
          </div>
        ) : null}
        <div className="flex items-start gap-2 rounded-xl border border-mint-glow/15 bg-mint-glow/[0.04] px-3 py-2">
          <Sparkles
            className="mt-0.5 size-3.5 shrink-0 text-mint-glow"
            aria-hidden
          />
          <p className="text-[11.5px] leading-relaxed text-mint-glow">
            {copy.callToAction}
          </p>
        </div>
      </div>
    );
  }

  if (kind === "insight") {
    const copy = result as {
      summary: string;
      observations: AiInsightObservation[];
      opportunities: {
        title: string;
        detail: string;
        action: string;
      }[];
    };

    return (
      <div className="space-y-3">
        <p className="text-[12px] leading-relaxed text-foreground/90">
          {copy.summary}
        </p>

        <div className="space-y-2">
          {copy.observations.map((observation) => {
            const style = severityStyles[observation.severity] ?? severityStyles.info;
            const Icon = style.icon;

            return (
              <div
                key={`${observation.title}-${observation.detail}`}
                className={cn(
                  "rounded-xl border px-3 py-2.5",
                  style.className,
                )}
              >
                <div className="flex items-center gap-1.5">
                  <Icon className="size-3.5 shrink-0" aria-hidden />
                  <p className="text-[11.5px] font-medium">
                    {observation.title}
                  </p>
                  <span className="ml-auto text-[9px] tracking-wide uppercase opacity-70">
                    {style.label}
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-foreground/75">
                  {observation.detail}
                </p>
              </div>
            );
          })}
        </div>

        {copy.opportunities.length ? (
          <div>
            <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
              Opportunities
            </p>
            <ul className="mt-1.5 space-y-2">
              {copy.opportunities.map((opportunity) => (
                <li
                  key={`${opportunity.title}-${opportunity.action}`}
                  className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2.5"
                >
                  <p className="text-[11.5px] font-medium">
                    {opportunity.title}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                    {opportunity.detail}
                  </p>
                  <p className="mt-1.5 flex items-start gap-1.5 text-[11px] leading-relaxed text-mint-glow">
                    <Lightbulb
                      className="mt-0.5 size-3 shrink-0"
                      aria-hidden
                    />
                    {opportunity.action}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    );
  }

  if (kind === "assistant") {
    const copy = result as { reply: string };

    return (
      <p className="text-[12px] leading-relaxed whitespace-pre-wrap text-foreground/90">
        {copy.reply}
      </p>
    );
  }

  return null;
}

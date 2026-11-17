import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

import { cn } from "cn";

export type MetricTone = "brand" | "info" | "success" | "warning" | "danger";

const toneClasses: Record<MetricTone, string> = {
  brand: "bg-electric-500/12 text-electric-300 ring-electric-400/20",
  info: "bg-cyan-glow/12 text-cyan-glow ring-cyan-glow/20",
  success: "bg-mint-glow/12 text-mint-glow ring-mint-glow/20",
  warning: "bg-amber-glow/12 text-amber-glow ring-amber-glow/20",
  danger: "bg-rose-400/12 text-rose-300 ring-rose-400/20",
};

export function MetricCard({
  label,
  value,
  icon: Icon,
  delta,
  deltaLabel,
  hint,
  tone = "brand",
  className,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  delta?: string | null;
  deltaLabel?: string;
  hint?: string;
  tone?: MetricTone;
  className?: string;
}) {
  const direction = delta
    ? delta.startsWith("-")
      ? "down"
      : delta.startsWith("+")
        ? "up"
        : "flat"
    : "flat";

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3.5 transition-colors hover:border-white/[0.11] sm:p-4",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10.5px] leading-tight font-medium text-muted-foreground">
          {label}
        </p>
        <span
          className={cn(
            "grid size-7 shrink-0 place-items-center rounded-lg ring-1",
            toneClasses[tone],
          )}
        >
          <Icon className="size-3.5" aria-hidden />
        </span>
      </div>

      <p className="mt-2.5 font-heading text-[1.35rem] leading-none font-semibold tracking-[-0.03em] sm:text-[1.6rem]">
        {value}
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
        {delta ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
              direction === "up"
                ? "bg-mint-glow/12 text-mint-glow"
                : direction === "down"
                  ? "bg-rose-400/12 text-rose-300"
                  : "bg-white/[0.06] text-muted-foreground",
            )}
          >
            {direction === "up" ? (
              <ArrowUpRight className="size-3" aria-hidden />
            ) : direction === "down" ? (
              <ArrowDownRight className="size-3" aria-hidden />
            ) : (
              <Minus className="size-3" aria-hidden />
            )}
            {delta}
          </span>
        ) : null}

        {deltaLabel ? (
          <span className="text-[10px] text-muted-foreground">{deltaLabel}</span>
        ) : null}

        {hint && !delta ? (
          <span className="truncate text-[10px] text-muted-foreground">
            {hint}
          </span>
        ) : null}
      </div>
    </div>
  );
}

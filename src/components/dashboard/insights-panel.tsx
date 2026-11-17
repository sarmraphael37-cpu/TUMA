import { ArrowUpRight, Sparkles, TrendingDown, TrendingUp } from "lucide-react";

import { StatusBadge } from "@/components/dashboard/status-badge";
import { cn } from "cn";

const weeklyProfit = [42, 58, 51, 67, 62, 79, 88, 74, 82, 95, 88, 104];

const insights = [
  {
    title: "Cooking oil margin slipped 4.2%",
    body: "Supplier costs rose on 2 November. Raising the retail price by 300 XAF restores your average margin without affecting volume.",
    tone: "warning" as const,
    icon: TrendingDown,
    action: "Apply price suggestion",
  },
  {
    title: "Rice will sell out before Friday",
    body: "At the current pace you will run out in 3 days. Order 60 bags today to cover demand through the end of the month.",
    tone: "danger" as const,
    icon: TrendingDown,
    action: "Create purchase order",
  },
  {
    title: "Boutique Kana is your fastest-growing customer",
    body: "Revenue is up 34% over 90 days. Offer a 5% loyalty discount on orders above 200,000 XAF to lock in repeat volume.",
    tone: "success" as const,
    icon: TrendingUp,
    action: "Draft loyalty offer",
  },
];

/** Static AI workspace preview used inside the product demo. */
export function InsightsPanel() {
  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[9px] text-muted-foreground">TUMA Intelligence</p>
          <h3 className="font-heading text-sm font-semibold tracking-tight sm:text-[15px]">
            Insights
          </h3>
        </div>
        <StatusBadge tone="brand">
          <Sparkles className="mr-1 size-2.5" aria-hidden />
          3 new recommendations
        </StatusBadge>
      </div>

      <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
        <div className="flex items-start gap-2">
          <span className="grid size-6 shrink-0 place-items-center rounded-md bg-gradient-to-br from-electric-500 to-cyan-glow text-navy-950">
            <Sparkles className="size-3" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-[8px] text-muted-foreground">You asked</p>
            <p className="text-[9px] font-medium">
              “Which product made the most profit this month?”
            </p>
            <p className="mt-1.5 text-[8px] leading-relaxed text-muted-foreground">
              <span className="font-medium text-cyan-glow">Ankara fabric</span>{" "}
              generated{" "}
              <span className="font-medium text-foreground">1.84M XAF</span> in
              profit — 31% of your total. Margin is 3.6 points above your
              product average, and demand is still climbing.
            </p>
          </div>
          <span className="ml-auto hidden shrink-0 items-center gap-0.5 text-[8px] text-mint-glow sm:inline-flex">
            <ArrowUpRight className="size-2.5" aria-hidden />
            18.2%
          </span>
        </div>
      </div>

      <div className="grid gap-2 lg:grid-cols-[1fr_1.15fr]">
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-medium">Profit trend</p>
            <span className="text-[8px] text-muted-foreground">12 weeks</span>
          </div>
          <div className="mt-2.5 flex h-20 items-end gap-1" aria-hidden>
            {weeklyProfit.map((value, index) => (
              <div
                key={index}
                className={cn(
                  "flex-1 rounded-sm",
                  index === weeklyProfit.length - 1
                    ? "bg-gradient-to-t from-electric-500 to-cyan-glow"
                    : "bg-electric-500/25",
                )}
                style={{ height: `${(value / 104) * 100}%` }}
              />
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between text-[8px]">
            <span className="text-muted-foreground">Sep</span>
            <span className="text-mint-glow">+24.1% this quarter</span>
            <span className="text-muted-foreground">Nov</span>
          </div>
        </div>

        <div className="space-y-1.5">
          {insights.slice(0, 2).map((insight) => {
            const Icon = insight.icon;

            return (
              <div
                key={insight.title}
                className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5"
              >
                <div className="flex items-center gap-1.5">
                  <Icon
                    className={cn(
                      "size-3",
                      insight.tone === "danger"
                        ? "text-rose-300"
                        : insight.tone === "warning"
                          ? "text-amber-glow"
                          : "text-mint-glow",
                    )}
                    aria-hidden
                  />
                  <p className="truncate text-[8px] font-medium">
                    {insight.title}
                  </p>
                </div>
                <p className="mt-1 line-clamp-2 text-[8px] leading-relaxed text-muted-foreground">
                  {insight.body}
                </p>
                <p className="mt-1.5 text-[8px] font-medium text-cyan-glow">
                  {insight.action}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  LockKeyhole,
  ShieldCheck,
  ShoppingBag,
  TriangleAlert,
  Trophy,
  Wallet,
} from "lucide-react";

import { StatusBadge } from "@/components/dashboard/status-badge";
import type { AiInsightSnapshot } from "@/lib/ai/insights";
import {
  formatCompactCurrency,
  formatCurrency,
  formatNumber,
  formatPercent,
} from "@/lib/format";
import { cn } from "cn";

function ChangePill({ value }: { value: number | null }) {
  if (value === null) {
    return (
      <span className="text-[9.5px] text-muted-foreground">No baseline</span>
    );
  }

  const up = value >= 0;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9.5px] font-medium",
        up
          ? "bg-mint-glow/12 text-mint-glow"
          : "bg-rose-400/12 text-rose-300",
      )}
    >
      {up ? (
        <ArrowUpRight className="size-2.5" aria-hidden />
      ) : (
        <ArrowDownRight className="size-2.5" aria-hidden />
      )}
      {formatPercent(value)}
    </span>
  );
}

function SnapshotMetric({
  label,
  value,
  hint,
  icon: Icon,
  tone = "brand",
}: {
  label: string;
  value: string;
  hint?: React.ReactNode;
  icon: typeof Wallet;
  tone?: "brand" | "info" | "success" | "warning" | "danger";
}) {
  const tones = {
    brand: "bg-electric-500/12 text-electric-300 ring-electric-400/20",
    info: "bg-cyan-glow/12 text-cyan-glow ring-cyan-glow/20",
    success: "bg-mint-glow/12 text-mint-glow ring-mint-glow/20",
    warning: "bg-amber-glow/12 text-amber-glow ring-amber-glow/20",
    danger: "bg-rose-400/12 text-rose-300 ring-rose-400/20",
  } as const;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5">
      <div className="flex items-start justify-between gap-1.5">
        <p className="text-[9.5px] leading-tight font-medium text-muted-foreground">
          {label}
        </p>
        <span
          className={cn(
            "grid size-6 shrink-0 place-items-center rounded-md ring-1",
            tones[tone],
          )}
        >
          <Icon className="size-3" aria-hidden />
        </span>
      </div>
      <p className="mt-1.5 font-heading text-[1.05rem] leading-none font-semibold tracking-[-0.03em]">
        {value}
      </p>
      {hint ? <div className="mt-1.5">{hint}</div> : null}
    </div>
  );
}

export function AiSnapshotPanel({
  snapshot,
}: {
  snapshot: AiInsightSnapshot;
}) {
  const currency = snapshot.currency || "XAF";
  const current = snapshot.orders.current;
  const topSeller = snapshot.bestSellers[0];
  const topLowStock = snapshot.products.lowStockItems[0];

  return (
    <aside className="space-y-3 xl:sticky xl:top-4">
      <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02]">
        <div className="border-b border-white/[0.06] bg-gradient-to-r from-cyan-glow/[0.06] to-transparent px-3.5 py-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="font-heading text-[12.5px] font-medium">
                Live business snapshot
              </h2>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                Last {snapshot.windowDays} days · your real workspace data
              </p>
            </div>
            <StatusBadge tone="success">Real data</StatusBadge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 p-3">
          <SnapshotMetric
            label="Paid revenue"
            value={formatCurrency(current.paidRevenue, currency)}
            hint={<ChangePill value={snapshot.orders.revenueChangePercent} />}
            icon={Wallet}
            tone="success"
          />
          <SnapshotMetric
            label="Orders placed"
            value={formatNumber(current.orders)}
            hint={
              <span className="text-[9.5px] text-muted-foreground">
                {formatNumber(current.paidOrders)} marked paid
              </span>
            }
            icon={ShoppingBag}
            tone="brand"
          />
          <SnapshotMetric
            label="Low stock"
            value={formatNumber(snapshot.products.lowStock)}
            hint={
              <span className="text-[9.5px] text-muted-foreground">
                of {formatNumber(snapshot.products.active)} active
              </span>
            }
            icon={TriangleAlert}
            tone={snapshot.products.lowStock > 0 ? "warning" : "success"}
          />
          <SnapshotMetric
            label="To verify"
            value={formatNumber(current.awaitingVerification)}
            hint={
              <span className="text-[9.5px] text-muted-foreground">
                {formatNumber(current.pending)} still in progress
              </span>
            }
            icon={ShieldCheck}
            tone={
              current.awaitingVerification > 0 ? "warning" : "info"
            }
          />
        </div>

        <div className="space-y-2 border-t border-white/[0.06] px-3.5 py-3">
          <div className="flex items-start gap-2">
            <Trophy className="mt-0.5 size-3.5 shrink-0 text-amber-glow" aria-hidden />
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground">Top product</p>
              <p className="truncate text-[11px] font-medium">
                {topSeller ? topSeller.name : "No orders in this period"}
              </p>
              {topSeller ? (
                <p className="text-[9.5px] text-muted-foreground">
                  {formatNumber(topSeller.units)} units ·{" "}
                  {formatCurrency(topSeller.revenue, currency)}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Boxes className="mt-0.5 size-3.5 shrink-0 text-electric-300" aria-hidden />
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground">
                Stock value at selling price
              </p>
              <p className="text-[11px] font-medium">
                {formatCompactCurrency(snapshot.products.catalogueValue, currency)}
              </p>
              {topLowStock ? (
                <p className="text-[9.5px] text-muted-foreground">
                  Lowest: {topLowStock.name} ({formatNumber(topLowStock.stock)} left)
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-3">
        <h2 className="font-heading text-[12px] font-medium">
          What the numbers say
        </h2>
        <p className="mt-0.5 text-[9.5px] text-muted-foreground">
          Calculated in TUMA. These facts are sent to the assistant instead of
          guessing.
        </p>

        {!snapshot.availability.products || !snapshot.availability.orders ? (
          <p className="mt-2 rounded-lg border border-amber-glow/20 bg-amber-glow/[0.05] px-2.5 py-2 text-[10px] leading-relaxed text-amber-glow">
            {!snapshot.availability.products
              ? "Product data could not be loaded. "
              : ""}
            {!snapshot.availability.orders
              ? "Order data could not be loaded."
              : ""}
          </p>
        ) : null}

        <ul className="mt-2 space-y-1.5">
          {snapshot.signals.length === 0 ? (
            <li className="text-[10.5px] text-muted-foreground">
              Not enough activity to calculate signals yet.
            </li>
          ) : (
            snapshot.signals.map((signal) => (
              <li
                key={signal}
                className="flex items-start gap-1.5 text-[10.5px] leading-relaxed text-muted-foreground"
              >
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-electric-300" />
                {signal}
              </li>
            ))
          )}
        </ul>

        <div className="mt-3 flex items-start gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2">
          <LockKeyhole
            className="mt-0.5 size-3 shrink-0 text-mint-glow"
            aria-hidden
          />
          <p className="text-[9.5px] leading-relaxed text-muted-foreground">
            Only aggregate products, stock and order totals are sent to the AI
            provider. Customer names, phones, emails and addresses are never
            included.
          </p>
        </div>
      </section>
    </aside>
  );
}

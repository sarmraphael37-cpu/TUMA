import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  Bot,
  Building2,
  CreditCard,
  ShoppingBag,
  Users,
  Wallet,
} from "lucide-react";

import { MetricCard } from "@/components/dashboard/cards/metric-card";
import { Card } from "@/components/dashboard/cards/card";
import { RevenueTrendChart } from "@/components/dashboard/charts/revenue-trend-chart";
import { OrderDistributionChart } from "@/components/dashboard/charts/order-distribution-chart";
import { EmptyState } from "@/components/dashboard/states/empty-state";
import { ErrorState } from "@/components/dashboard/states/error-state";
import { AdminFrame } from "@/components/admin/admin-frame";
import { DateRangeFilter } from "@/components/dashboard/filters/date-range-filter";
import { getPlatformOverview } from "@/lib/admin/queries";
import { formatCompactNumber, formatCurrency, formatNumber } from "@/lib/format";

export const metadata: Metadata = {
  title: "Overview",
  description: "Platform-wide health, revenue and growth.",
};

type SearchParams = Promise<{ range?: string; from?: string; to?: string }>;

export default async function AdminOverviewPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const { resolveDashboardRange } = await import("@/lib/db/dashboard");
  const range = resolveDashboardRange({
    range: params.range,
    from: params.from,
    to: params.to,
  });

  const data = await getPlatformOverview(range);
  const overview = data.overview;
  const currency = "XAF";

  const orderStatusSlices = Array.isArray(
    (data.distribution as { orderStatuses?: unknown }).orderStatuses,
  )
    ? ((data.distribution as { orderStatuses: Array<{ status: string; count: number }> })
        .orderStatuses)
    : [];

  const slices = orderStatusSlices.map((entry) => ({
    status: entry.status,
    label: entry.status.replace(/_/g, " "),
    value: Number(entry.count ?? 0),
    tone: "neutral" as const,
  }));

  const series = data.series.map((point) => ({
    label: String(point.bucket ?? ""),
    revenue: Number(point.revenue ?? 0),
    orders: Number(point.orders ?? 0),
    previousRevenue: 0,
  }));

  return (
    <AdminFrame>
      <div className="space-y-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div className="min-w-0">
            <h1 className="font-heading text-[1.6rem] leading-tight font-semibold tracking-[-0.035em] sm:text-[1.9rem]">
              Platform overview
            </h1>
            <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-muted-foreground">
              Live aggregates across every merchant, order and AI request on
              TUMA. {range.label.toLowerCase()}.
            </p>
          </div>
          <DateRangeFilter range={range.key} from={params.from} to={params.to} basePath="/admin" />
        </div>

        {data.error ? (
          <ErrorState title="We could not load the platform overview" description={data.error} />
        ) : null}

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-6">
          <MetricCard
            label="Merchants"
            value={formatNumber(Number(overview.merchants ?? 0))}
            icon={Building2}
            tone="brand"
            hint={`${formatNumber(Number(overview.activeMerchants ?? 0))} active`}
          />
          <MetricCard
            label="Users"
            value={formatNumber(Number(overview.users ?? 0))}
            icon={Users}
            tone="info"
            hint={`${formatNumber(Number(overview.newUsers ?? 0))} new`}
          />
          <MetricCard
            label="Orders"
            value={formatNumber(Number(overview.orders ?? 0))}
            icon={ShoppingBag}
            tone="brand"
            hint={`${formatNumber(Number(overview.pendingOrders ?? 0))} need action`}
          />
          <MetricCard
            label="Revenue collected"
            value={formatCurrency(Number(overview.revenue ?? 0), currency)}
            icon={Wallet}
            tone="success"
            hint={`${formatNumber(Number(overview.paidOrders ?? 0))} paid`}
          />
          <MetricCard
            label="Products"
            value={formatNumber(Number(overview.activeProducts ?? 0))}
            icon={Activity}
            tone="info"
            hint={`${formatNumber(Number(overview.products ?? 0))} total`}
          />
          <MetricCard
            label="AI generations"
            value={formatNumber(Number(overview.aiGenerations ?? 0))}
            icon={Bot}
            tone="brand"
            hint={`${formatCompactNumber(Number(overview.aiTokens ?? 0))} tokens`}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
          <Card title="Platform revenue" description={`Revenue collected ${range.label.toLowerCase()}`}>
            {data.series.length === 0 ? (
              <EmptyState
                icon={<Wallet className="size-5" aria-hidden />}
                title="No revenue yet"
                description="Revenue appears here once merchants record paid orders."
              />
            ) : (
              <RevenueTrendChart data={series} currency={currency} />
            )}
          </Card>

          <Card title="Order distribution" description="How orders are spread by status">
            {slices.length === 0 ? (
              <EmptyState
                icon={<ShoppingBag className="size-5" aria-hidden />}
                title="No orders yet"
                description="Orders placed across the platform appear here."
              />
            ) : (
              <OrderDistributionChart data={slices} />
            )}
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-4">
          <Card title="Subscriptions" bodyClassName="p-4">
            <p className="font-heading text-[1.25rem] font-semibold">
              {formatNumber(Number(overview.subscriptions ?? 0))}
            </p>
            <p className="mt-1 text-[10.5px] text-muted-foreground">
              {formatNumber(Number(overview.trialingSubscriptions ?? 0))} trialing ·{" "}
              {formatNumber(Number(overview.pastDueSubscriptions ?? 0))} past due
            </p>
          </Card>
          <Card title="Support tickets" bodyClassName="p-4">
            <p className="font-heading text-[1.25rem] font-semibold">
              {formatNumber(Number(overview.openTickets ?? 0))}
            </p>
            <p className="mt-1 text-[10.5px] text-muted-foreground">
              Open tickets · {formatNumber(Number(overview.totalTickets ?? 0))} total
            </p>
          </Card>
          <Card title="Suspended merchants" bodyClassName="p-4">
            <p className="font-heading text-[1.25rem] font-semibold">
              {formatNumber(Number(overview.suspendedMerchants ?? 0))}
            </p>
            <p className="mt-1 text-[10.5px] text-muted-foreground">
              {formatNumber(Number(overview.merchants ?? 0))} total merchants
            </p>
          </Card>
          <Card title="Quick links" bodyClassName="p-4">
            <div className="flex flex-wrap gap-2">
              <Link href="/admin/merchants" className="text-[11.5px] text-cyan-glow hover:underline">
                Merchants
              </Link>
              <Link href="/admin/support" className="text-[11.5px] text-cyan-glow hover:underline">
                Support
              </Link>
              <Link href="/admin/audit" className="text-[11.5px] text-cyan-glow hover:underline">
                Audit log
              </Link>
            </div>
          </Card>
        </div>

        <p className="flex items-center justify-center gap-1.5 pt-1 text-[10.5px] text-muted-foreground/80">
          <CreditCard className="size-3.5" aria-hidden />
          Figures come from live Supabase aggregates.
        </p>
      </div>
    </AdminFrame>
  );
}

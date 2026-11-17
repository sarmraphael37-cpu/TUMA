import type { Metadata } from "next";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  Building2,
  Users,
  Wallet,
  Bot,
  Clipboard,
  Settings,
  Shield,
  Folder,
  BarChart2,
  Music,
  FolderSearch,
  Lyric,
} from "lucide-react";

import { getPlatformOverview } from "@/lib/admin/queries";
import { formatCompactNumber, formatCurrency, formatNumber } from "@/lib/format";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/admin/auth";
import { hasCapability, capabilitiesFor } from "@/lib/admin/permissions";
import { MetricCard } from "@/components/dashboard/cards/metric-card";
import { Card } from "@/components/dashboard/cards/card";
import { RevenueTrendChart } from "@/components/dashboard/charts/revenue-trend-chart";
import { OrderDistributionChart } from "@/components/dashboard/charts/order-distribution-chart";
import { EmptyState } from "@/components/dashboard/states/empty-state";

type SearchParams = Promise<{ range?: string; from?: string; to?: string }>;

export const metadata: Metadata = {
  title: "Super Administration",
  description: "Platform-wide control center for TUMA — full administrative access.",
};

export default async function SuperAdminPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  // Resolve date range (same logic as merchant dashboard)
  const { resolveDashboardRange } = await import("@/lib/db/dashboard");
  const range = resolveDashboardRange({
    range: params.range,
    from: params.from,
    to: params.to,
  });

  const data = await getPlatformOverview(range);
  const overview = data.overview;
  const currency = "XAF";

  // Build order status slices
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

  // Quick stats
  const merchantCount = Number(overview.merchants ?? 0);
  const activeMerchantCount = Number(overview.activeMerchants ?? 0);
  const userCount = Number(overview.users ?? 0);
  const orderCount = Number(overview.orders ?? 0);
  const revenueCollected = Number(overview.revenue ?? 0);
  const paidOrders = Number(overview.paidOrders ?? 0);
  const activeProducts = Number(overview.activeProducts ?? 0);
  const aiGenerations = Number(overview.aiGenerations ?? 0);
  const tokensUsed = Number(overview.aiTokens ?? 0);
  const subscriptions = Number(overview.subscriptions ?? 0);
  const openTickets = Number(overview.openTickets ?? 0);
  const totalTickets = Number(overview.totalTickets ?? 0);
  const suspendedMerchants = Number(overview.suspendedMerchants ?? 0);

  // Capability check for quick stats display
  const supa = await getSupabaseServerClient();
  const { count: totalMerchants } = await supa
    .from("businesses")
    .select("*", { count: "exact", head: true });
  const { count: totalUsers } = await supa
    .from("users")
    .select("*", { count: "exact", head: true });
  const { count: activeBusinesses } = await supa
    .from("businesses")
    .select("*, is_active(status)", { count: "exact", head: true })
    .eq("is_active", true);

  return (
    <div className="min-h-screen bg-navy-950">
      <SuperAdminHeader /> {/* Will create next */}

      <main className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-heading text-[1.8rem] leading-tight font-semibold tracking-[-0.035em] mb-6">
            Super Administration
          </h1>

          <p className="text-[12px] text-muted-foreground mb-8">
            Platform-wide control center. Live aggregates across every merchant,
            order and AI request on TUMA. {range.label.toLowerCase()}.
          </p>

          {/* Analytics Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <MetricCard
              label="Total Merchants"
              value={formatNumber(totalMerchants)}
              icon={Building2}
              tone="brand"
              hint={`${formatNumber(activeMerchantCount)} active`}
            />
            <MetricCard
              label="Total Users"
              value={formatNumber(totalUsers)}
              icon={Users}
              tone="info"
              hint={`${formatNumber(userCount)} registered`}
            />
            <MetricCard
              label="Active Orders"
              value={formatNumber(orderCount)}
              icon={Clipboard}
              tone="brand"
              hint={`${formatNumber(paidOrders)} paid`}
            />
            <MetricCard
              label="Revenue Collected"
              value={formatCurrency(revenueCollected, currency)}
              icon={Wallet}
              tone="success"
              hint={`${formatNumber(paidOrders)} paid orders`}
            />
            <MetricCard
              label="Active Products"
              value={formatNumber(activeProducts)}
              icon={Activity}
              tone="info"
              hint={`${formatNumber(aiGenerations)} AI generations`}
            />
            <MetricCard
              label="AI Generations"
              value={formatNumber(aiGenerations)}
              icon={Bot}
              tone="brand"
              hint={`${formatCompactNumber(tokensUsed)} tokens`}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card title="Platform Revenue" description={`Revenue collected ${range.label.toLowerCase()}`}>
              {series.length === 0 ? (
                <EmptyState
                  icon={<Wallet className="size-5" aria-hidden />}
                  title="No revenue yet"
                  description="Revenue appears here once merchants record paid orders."
                >
              ) : (
                <RevenueTrendChart data={series} currency={currency} />
              )}
            </Card>

            <Card title="Order Distribution" description="How orders are spread by status">
              {slices.length === 0 ? (
                <EmptyState
                  icon={<Clipboard className="size-5" aria-hidden />}
                  title="No orders yet"
                  description="Orders placed across the platform appear here."
                >
              ) : (
                <OrderDistributionChart data={slices} />
              )}
            </Card>

            <Card title="Subscriptions" bodyClassName="p-4">
              <p className="font-heading text-[1.25rem] font-semibold">
                {formatNumber(subscriptions)}
              </p>
              <p className="mt-1 text-[10.5px] text-muted-foreground">
                {formatNumber(Number(overview.trialingSubscriptions ?? 0))} trialing ·
                {formatNumber(Number(overview.pastDueSubscriptions ?? 0))} past due
              </p>
            </Card>

            <Card title="Support Tickets" bodyClassName="p-4">
              <p className="font-heading text-[1.25rem] font-semibold">
                {formatNumber(openTickets)}
              </p>
              <p className="mt-1 text-[10.5px] text-muted-foreground">
                Open tickets ·
                {formatNumber(totalTickets)} total
              </p>
            </Card>

            <Card title="Suspended Merchants" bodyClassName="p-4">
              <p className="font-heading text-[1.25rem] font-semibold">
                {formatNumber(suspendedMerchants)}
              </p>
              <p className="mt-1 text-[10.5px] text-muted-foreground">
                {formatNumber(merchantCount)} total merchants
              </p>
            </Card>

            <Card title="Quick Actions" bodyClassName="p-4">
              <div className="space-y-3">
                <Link
                  href="/super-admin/merchants"
                  className="text-[11.5px] text-cyan-glow hover:underline block"
                >
                  Manage Merchants {formatNumber(totalMerchants)}
                </Link>
                <Link
                  href="/super-admin/users"
                  className="text-[11.5px] text-cyan-glow hover:underline block"
                >
                  Manage Users {formatNumber(totalUsers)}
                </Link>
                <Link
                  href="/super-admin/products"
                  className="text-[11.5px] text-cyan-glow hover:underline block"
                >
                  Monitor Products {formatNumber(activeProducts)}
                </Link>
                <Link
                  href="/super-admin/orders"
                  className="text-[11.5px] text-cyan-glow hover:underline block"
                >
                  View Orders {formatNumber(orderCount)}
                </Link>
                <Link
                  href="/super-admin/subscriptions"
                  className="text-[11.5px] text-cyan-glow hover:underline block"
                >
                  Subscription Management
                </Link>
                <Link
                  href="/super-admin/audit"
                  className="text-[11.5px] text-cyan-glow hover:underline block"
                >
                  Audit Log
                </Link>
              </div>
            </Card>
          </div>

          <p className="flex items-center justify-center gap-1.5 pt-2 text-[10.5px] text-muted-foreground/80 mt-8">
            <Shield className="size-3.5" aria-hidden />/
            Figures come from live Supabase aggregates.{' '}
            <Span role="alert">Super Admin only — full platform access.</Span>
          </p>
        </div>
      </main>
    </div>
  );
}

/* Header component - will be extracted later */
function SuperAdminHeader() {
  return (
    <header className="border-b border-white/[0.05] bg-navy-950/80 backdrop-blur-sm sticky top-0 z-20">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Shield className="size-4 opacity-100" aria-hidden />
          <span className="font-heading font-medium">TUMA Super Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Go to Storefront
          </Link>
          <a
            href="/admin/login?next=/super-admin"
            className="text-[10px] text-cyan-glow hover:underline"
          >
            Admin Login
          </a>
        </div>
      </div>
    </header>
  );
}
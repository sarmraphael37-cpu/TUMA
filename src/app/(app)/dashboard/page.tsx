import type { Metadata } from "next";
import {
  CircleCheck,
  Loader2,
  Package,
  ReceiptText,
  ShoppingBag,
  TriangleAlert,
  Wallet,
} from "lucide-react";

import { MetricCard } from "@/components/dashboard/cards/metric-card";
import { Card } from "@/components/dashboard/cards/card";
import { BestSellersChart } from "@/components/dashboard/charts/best-sellers-chart";
import { OrderDistributionChart } from "@/components/dashboard/charts/order-distribution-chart";
import { RevenueTrendChart } from "@/components/dashboard/charts/revenue-trend-chart";
import { SalesPerformanceChart } from "@/components/dashboard/charts/sales-performance-chart";
import { DateRangeFilter } from "@/components/dashboard/filters/date-range-filter";
import { GrowthSummary } from "@/components/dashboard/sections/growth-summary";
import { LowStock, LowStockEmpty } from "@/components/dashboard/sections/low-stock";
import { QuickActions } from "@/components/dashboard/sections/quick-actions";
import {
  RecentOrders,
  RecentOrdersEmpty,
} from "@/components/dashboard/sections/recent-orders";
import { SearchResults } from "@/components/dashboard/sections/search-results";
import {
  TopProducts,
  TopProductsEmpty,
} from "@/components/dashboard/sections/top-products";
import { AnnouncementsBanner } from "@/components/dashboard/announcements-banner";
import { DashboardFrame } from "@/components/dashboard/shell/dashboard-frame";
import { EmptyState } from "@/components/dashboard/states/empty-state";
import { ErrorState } from "@/components/dashboard/states/error-state";
import { requireUser, getOwnedBusiness } from "@/lib/auth/server";
import {
  getDashboardData,
  resolveDashboardRange,
  searchWorkspace,
} from "@/lib/db/dashboard";
import { formatCurrency, formatNumber } from "@/lib/format";

export const metadata: Metadata = {
  title: "Overview",
  description: "Revenue, orders, stock and growth for your business.",
};

type SearchParams = Promise<{
  range?: string;
  from?: string;
  to?: string;
  q?: string;
}>;

async function DashboardContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  // `searchParams` has to be awaited directly — Next tracks it that way.
  const params = await searchParams;

  const [user, business] = await Promise.all([
    requireUser("/dashboard"),
    getOwnedBusiness(),
  ]);

  const range = resolveDashboardRange({
    range: params.range,
    from: params.from,
    to: params.to,
  });

  const [data, searchResults] = await Promise.all([
    getDashboardData({ range }),
    params.q ? searchWorkspace(params.q) : Promise.resolve(null),
  ]);

  const currency = business?.currency ?? "XAF";
  const firstName =
    (typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : user.email?.split("@")[0])?.split(/\s+/)[0] ?? "merchant";

  const metrics = data.metrics;
  const hasOrders = metrics.orders > 0;

  return (
    <DashboardFrame>
      <div className="space-y-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div className="min-w-0">
            <h1 className="font-heading text-[1.6rem] leading-tight font-semibold tracking-[-0.035em] sm:text-[1.9rem]">
              Good to see you, {firstName}.
            </h1>
            <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-muted-foreground">
              Everything below comes from your live workspace —{" "}
              {range.label.toLowerCase()} in {business?.name ?? "your business"}.
            </p>
          </div>

          <DateRangeFilter
            range={range.key}
            from={params.from}
            to={params.to}
          />
        </div>

        {searchResults ? (
          <SearchResults results={searchResults} currency={currency} />
        ) : null}

        <AnnouncementsBanner />

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-6">
          <MetricCard
            label="Total revenue"
            value={formatCurrency(metrics.revenue, currency)}
            icon={Wallet}
            tone="success"
            delta={data.growth.revenueDelta}
            deltaLabel="vs previous period"
          />
          <MetricCard
            label="Total orders"
            value={formatNumber(metrics.orders)}
            icon={ShoppingBag}
            tone="brand"
            delta={data.growth.ordersDelta}
            deltaLabel="vs previous period"
          />
          <MetricCard
            label="Pending orders"
            value={formatNumber(metrics.pendingOrders)}
            icon={Loader2}
            tone="warning"
            hint="Pending, confirmed or processing"
          />
          <MetricCard
            label="Completed orders"
            value={formatNumber(metrics.completedOrders)}
            icon={CircleCheck}
            tone="info"
            hint="Completed in this period"
          />
          <MetricCard
            label="Total products"
            value={formatNumber(metrics.products)}
            icon={Package}
            tone="brand"
            hint={
              metrics.archivedProducts > 0
                ? `${formatNumber(metrics.archivedProducts)} archived`
                : "Active in your catalogue"
            }
          />
          <MetricCard
            label="Low-stock products"
            value={formatNumber(metrics.lowStock)}
            icon={TriangleAlert}
            tone={metrics.lowStock > 0 ? "danger" : "success"}
            hint={
              metrics.lowStock > 0 ? "Need restocking" : "All levels healthy"
            }
          />
        </div>

        {data.truncated ? (
          <p className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2 text-[10.5px] text-muted-foreground">
            Showing the most recent 2,000 orders. Narrow the date range for the
            exact figures.
          </p>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
          <Card
            title="Sales performance"
            description={`Revenue collected and orders recorded · ${range.label.toLowerCase()}`}
          >
            {data.errors.orders ? (
              <ErrorState compact description={data.errors.orders} />
            ) : (
              <SalesPerformanceChart data={data.series} currency={currency} />
            )}
          </Card>

          <Card
            title="Order distribution"
            description="How your orders are spread by status"
          >
            {data.errors.orders ? (
              <ErrorState compact description={data.errors.orders} />
            ) : data.distribution.length === 0 ? (
              <EmptyState
                icon={<ShoppingBag className="size-5" aria-hidden />}
                title="No orders to distribute"
                description="Record your first order and the split by status appears here."
              />
            ) : (
              <OrderDistributionChart data={data.distribution} />
            )}
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
          <Card
            title="Revenue trends"
            description="This period against the one before it"
          >
            {data.errors.orders ? (
              <ErrorState compact description={data.errors.orders} />
            ) : (
              <RevenueTrendChart data={data.series} currency={currency} />
            )}
          </Card>

          <Card
            title="Best-selling products"
            description="Ranked by revenue in this period"
          >
            {data.errors.orders ? (
              <ErrorState compact description={data.errors.orders} />
            ) : data.bestSellers.length === 0 ? (
              <TopProductsEmpty />
            ) : (
              <BestSellersChart
                data={data.bestSellers.slice(0, 6).map((seller) => ({
                  name: seller.name,
                  revenue: seller.revenue,
                  units: seller.units,
                }))}
                currency={currency}
              />
            )}
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
          <Card
            id="recent-orders"
            title="Recent orders"
            description="The latest activity across your counter"
          >
            {data.errors.orders ? (
              <ErrorState description={data.errors.orders} />
            ) : hasOrders ? (
              <RecentOrders orders={data.recentOrders} currency={currency} />
            ) : (
              <RecentOrdersEmpty hasProducts={metrics.products > 0} />
            )}
          </Card>

          <Card
            id="low-stock"
            title="Low-stock notifications"
            description="Products at or below their alert level"
          >
            {data.errors.products ? (
              <ErrorState description={data.errors.products} />
            ) : data.lowStock.length === 0 ? (
              <LowStockEmpty />
            ) : (
              <LowStock products={data.lowStock} />
            )}
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <Card title="Top sellers" description="Units and value in this period">
            {data.errors.orders ? (
              <ErrorState compact description={data.errors.orders} />
            ) : data.bestSellers.length === 0 ? (
              <TopProductsEmpty />
            ) : (
              <TopProducts sellers={data.bestSellers} currency={currency} />
            )}
          </Card>

          <Card
            id="growth"
            title="Business growth summary"
            description="How this period compares with the one before"
          >
            {data.errors.orders || data.errors.customers ? (
              <ErrorState
                compact
                description={
                  data.errors.orders ?? data.errors.customers ?? undefined
                }
              />
            ) : (
              <GrowthSummary
                growth={data.growth}
                currency={currency}
                rangeLabel={range.label}
              />
            )}
          </Card>

          <Card title="Quick actions" description="Keep your workspace up to date">
            <QuickActions
              lowStockCount={metrics.lowStock}
              pendingOrders={metrics.pendingOrders}
            />
          </Card>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card title="Revenue invoiced" bodyClassName="p-4">
            <p className="font-heading text-[1.25rem] font-semibold tracking-[-0.03em]">
              {formatCurrency(metrics.invoiced, currency)}
            </p>
            <p className="mt-1 text-[10.5px] text-muted-foreground">
              Total value of all orders in this period, including unpaid ones.
            </p>
          </Card>
          <Card title="Average order value" bodyClassName="p-4">
            <p className="font-heading text-[1.25rem] font-semibold tracking-[-0.03em]">
              {formatCurrency(metrics.averageOrderValue, currency)}
            </p>
            <p className="mt-1 text-[10.5px] text-muted-foreground">
              {data.growth.averageOrderValueDelta
                ? `${data.growth.averageOrderValueDelta} against the previous period`
                : "No previous period to compare yet."}
            </p>
          </Card>
          <Card title="New customers" bodyClassName="p-4">
            <p className="font-heading text-[1.25rem] font-semibold tracking-[-0.03em]">
              {formatNumber(metrics.customers)}
            </p>
            <p className="mt-1 text-[10.5px] text-muted-foreground">
              Customers added to your ledger in this period.
            </p>
          </Card>
        </div>

        <p className="flex items-center justify-center gap-1.5 pt-1 text-[10.5px] text-muted-foreground/80">
          <ReceiptText className="size-3.5" aria-hidden />
          Figures refresh automatically when you change your products or orders.
        </p>
      </div>
    </DashboardFrame>
  );
}

export default function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  /*
   * The overview reads live Supabase rows, so the route renders per request.
   * It is intentionally *not* wrapped in a Suspense boundary: a partially
   * streamed boundary could leave the reveal instruction unprocessed and the
   * page on its skeleton. The route-level `loading.tsx` still provides the
   * skeleton during client-side navigation.
   */
  return <DashboardContent searchParams={searchParams} />;
}



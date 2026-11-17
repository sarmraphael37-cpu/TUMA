import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  ReceiptText,
  ShieldCheck,
  Wallet,
} from "lucide-react";

import { Card } from "@/components/dashboard/cards/card";
import { OrderToolbar } from "@/components/dashboard/orders/order-toolbar";
import { DashboardFrame } from "@/components/dashboard/shell/dashboard-frame";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { EmptyState } from "@/components/dashboard/states/empty-state";
import { ErrorState } from "@/components/dashboard/states/error-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getOwnedBusiness } from "@/lib/auth/server";
import { getOrders, resolveOrderRange } from "@/lib/db/orders";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import {
  ORDER_STATUS_FILTERS,
  PAYMENT_STATUS_FILTERS,
  orderStatusLabel,
  orderStatusTone,
  paymentStatusLabel,
  paymentStatusTone,
  type OrderStatusValue,
  type PaymentStatusValue,
} from "@/lib/orders";

export const metadata: Metadata = {
  title: "Orders",
  description: "Review orders, confirm payments and keep customers informed.",
};

type SearchParams = Promise<{
  q?: string;
  status?: string;
  payment?: string;
  range?: string;
  from?: string;
  to?: string;
  page?: string;
  updated?: string;
}>;

function PageFallback() {
  return (
    <div className="h-16 animate-pulse rounded-2xl border border-white/[0.05] bg-white/[0.02]" />
  );
}

function isOrderStatus(value: string | undefined): value is OrderStatusValue {
  return ORDER_STATUS_FILTERS.some((option) => option.value === value);
}

function isPaymentStatus(
  value: string | undefined,
): value is PaymentStatusValue {
  return PAYMENT_STATUS_FILTERS.some((option) => option.value === value);
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  const status = isOrderStatus(params.status) ? params.status : "all";
  const payment = isPaymentStatus(params.payment) ? params.payment : "all";
  const range = resolveOrderRange({
    range: params.range,
    from: params.from,
    to: params.to,
  });
  const page = Math.max(Number(params.page ?? "1") || 1, 1);

  const [result, business] = await Promise.all([
    getOrders({ query: params.q, status, payment, range, page }),
    getOwnedBusiness(),
  ]);

  const currency = business?.currency ?? "XAF";
  const stats = result.stats;
  const searching = Boolean(params.q) || status !== "all" || payment !== "all";

  const notices: { tone: "success" | "error"; message: string }[] = [];

  if (params.updated) {
    notices.push({
      tone: "success",
      message: result.capabilities.audit
        ? "Order status updated and recorded in the order history."
        : "Order status updated. The audit trail is not enabled in this workspace database yet, so this change is not in the order history.",
    });
  }

  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (status !== "all") query.set("status", status);
  if (payment !== "all") query.set("payment", payment);
  if (params.range && params.range !== "30d") query.set("range", params.range);
  if (params.from) query.set("from", params.from);
  if (params.to) query.set("to", params.to);

  function pageLink(target: number) {
    const next = new URLSearchParams(query);
    next.set("page", String(target));
    return `/dashboard/orders?${next.toString()}`;
  }

  return (
    <DashboardFrame>
      <div className="space-y-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0">
            <h1 className="font-heading text-[1.65rem] leading-tight font-semibold tracking-[-0.035em] sm:text-[1.9rem]">
              Orders
            </h1>
            <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-muted-foreground">
              Every order placed through your storefront, with its payment
              status and the history of every change. Showing{" "}
              <span className="text-foreground/80">{range.label.toLowerCase()}</span>.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/dashboard"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.09] bg-white/[0.03] px-3 text-[11.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Overview
            </Link>
          </div>
        </div>

        {notices.map((notice) => (
          <div
            key={notice.message}
            role="status"
            className={
              notice.tone === "success"
                ? "rounded-xl border border-mint-glow/20 bg-mint-glow/[0.07] px-3.5 py-3 text-[12px] text-mint-glow"
                : "rounded-xl border border-rose-400/20 bg-rose-400/[0.07] px-3.5 py-3 text-[12px] text-rose-200"
            }
          >
            {notice.message}
          </div>
        ))}

        {!result.capabilities.verification ? (
          <div className="rounded-xl border border-cyan-glow/20 bg-cyan-glow/[0.05] px-3.5 py-3 text-[11.5px] leading-relaxed text-electric-200">
            Order history and payment verification are not enabled in this
            workspace database yet. Apply the latest TUMA migration to record
            every status change and verify payments. Until then, orders can
            still be reviewed and their status changed.
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <StatTile
            label="Orders"
            value={formatNumber(stats.total)}
            hint={`${formatNumber(stats.completed)} completed · ${formatNumber(
              stats.cancelled,
            )} cancelled`}
            icon={ReceiptText}
            tone="brand"
          />
          <StatTile
            label="Need action"
            value={formatNumber(stats.pending)}
            hint={`${formatNumber(stats.confirmed)} confirmed · ${formatNumber(
              stats.processing,
            )} processing`}
            icon={Clock3}
            tone={stats.pending > 0 ? "warning" : "success"}
          />
          <StatTile
            label="Payments to check"
            value={formatNumber(stats.awaitingVerification)}
            hint={`${formatNumber(stats.unpaid)} unpaid · ${formatNumber(
              stats.rejected,
            )} rejected`}
            icon={ShieldCheck}
            tone={stats.awaitingVerification > 0 ? "warning" : "info"}
          />
          <StatTile
            label="Paid revenue"
            value={formatCurrency(stats.paidRevenue, currency)}
            hint={`${formatNumber(stats.paid)} order${
              stats.paid === 1 ? "" : "s"
            } marked paid`}
            icon={Wallet}
            tone="success"
          />
        </div>

        <Suspense fallback={<PageFallback />}>
          <OrderToolbar
            total={result.total}
            range={range.key}
            from={range.key === "custom" ? params.from : undefined}
            to={range.key === "custom" ? params.to : undefined}
          />
        </Suspense>

        {result.errors.orders ? (
          <ErrorState
            title="We could not load your orders"
            description={result.errors.orders}
          />
        ) : result.orders.length === 0 ? (
          <Card>
            <EmptyState
              icon={
                searching ? (
                  <CircleAlert className="size-5" aria-hidden />
                ) : (
                  <ReceiptText className="size-5" aria-hidden />
                )
              }
              title={
                searching ? "No order matches these filters" : "No orders yet"
              }
              description={
                searching
                  ? "Try a different order number, status or date range. Resetting the filters shows everything in the selected period."
                  : "Orders placed through your public storefront appear here with their items, customer and payment status. Share your shop to get the first one."
              }
              action={
                searching ? (
                  <Link
                    href="/dashboard/orders"
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 text-[11.5px] font-medium transition-colors hover:bg-white/[0.07]"
                  >
                    Show all orders
                  </Link>
                ) : (
                  <Link
                    href="/dashboard/storefront"
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 text-[11.5px] font-medium transition-colors hover:bg-white/[0.07]"
                  >
                    Share your storefront
                  </Link>
                )
              }
            />
          </Card>
        ) : (
          <>
            <Card bodyClassName="p-0">
              <div className="overflow-x-auto">
                <Table className="text-[11.5px]">
                  <TableHeader>
                    <TableRow className="border-white/[0.06] hover:bg-transparent">
                      <TableHead className="h-9 pl-4 text-[10px] text-muted-foreground">
                        Order
                      </TableHead>
                      <TableHead className="h-9 text-[10px] text-muted-foreground">
                        Customer
                      </TableHead>
                      <TableHead className="hidden h-9 text-[10px] text-muted-foreground sm:table-cell">
                        Items
                      </TableHead>
                      <TableHead className="hidden h-9 text-[10px] text-muted-foreground md:table-cell">
                        Placed
                      </TableHead>
                      <TableHead className="h-9 text-right text-[10px] text-muted-foreground">
                        Total
                      </TableHead>
                      <TableHead className="h-9 text-[10px] text-muted-foreground">
                        Payment
                      </TableHead>
                      <TableHead className="h-9 text-[10px] text-muted-foreground">
                        Status
                      </TableHead>
                      <TableHead className="h-9 w-8 pr-4" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.orders.map((order) => (
                      <TableRow
                        key={order.id}
                        className="border-white/[0.05] hover:bg-white/[0.02]"
                      >
                        <TableCell className="py-2.5 pl-4">
                          <Link
                            href={`/dashboard/orders/${order.id}`}
                            className="font-mono text-[11px] text-foreground hover:text-cyan-glow"
                          >
                            {order.order_number}
                          </Link>
                        </TableCell>
                        <TableCell className="max-w-[180px] py-2.5">
                          <span className="block truncate text-foreground/85">
                            {order.customer?.name ?? "Walk-in customer"}
                          </span>
                          {order.customer?.phone ? (
                            <span className="block truncate text-[10px] text-muted-foreground">
                              {order.customer.phone}
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell className="hidden py-2.5 text-muted-foreground sm:table-cell">
                          {formatNumber(order.item_count)}
                        </TableCell>
                        <TableCell className="hidden py-2.5 whitespace-nowrap text-muted-foreground md:table-cell">
                          {formatDate(order.placed_at)}
                        </TableCell>
                        <TableCell className="py-2.5 text-right whitespace-nowrap text-foreground/85">
                          {formatCurrency(order.total, currency)}
                        </TableCell>
                        <TableCell className="py-2.5">
                          <StatusBadge tone={paymentStatusTone(order.payment_status)}>
                            {paymentStatusLabel(order.payment_status)}
                          </StatusBadge>
                        </TableCell>
                        <TableCell className="py-2.5">
                          <StatusBadge tone={orderStatusTone(order.status)}>
                            {orderStatusLabel(order.status)}
                          </StatusBadge>
                        </TableCell>
                        <TableCell className="py-2.5 pr-4 text-right">
                          <Link
                            href={`/dashboard/orders/${order.id}`}
                            aria-label={`Open order ${order.order_number}`}
                            className="inline-grid size-7 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground"
                          >
                            <ChevronRight className="size-4" aria-hidden />
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>

            {result.pageCount > 1 ? (
              <div className="flex items-center justify-between gap-3 pt-1">
                <p className="text-[11px] text-muted-foreground">
                  Page {result.page} of {result.pageCount} ·{" "}
                  {formatNumber(result.total)} order
                  {result.total === 1 ? "" : "s"}
                </p>
                <div className="flex items-center gap-1.5">
                  <Link
                    href={pageLink(Math.max(1, result.page - 1))}
                    aria-disabled={result.page <= 1}
                    className={
                      result.page <= 1
                        ? "pointer-events-none grid size-8 place-items-center rounded-lg border border-white/[0.07] text-muted-foreground/40"
                        : "grid size-8 place-items-center rounded-lg border border-white/[0.07] text-muted-foreground transition-colors hover:text-foreground"
                    }
                  >
                    <ChevronLeft className="size-4" aria-hidden />
                  </Link>
                  <Link
                    href={pageLink(Math.min(result.pageCount, result.page + 1))}
                    aria-disabled={result.page >= result.pageCount}
                    className={
                      result.page >= result.pageCount
                        ? "pointer-events-none grid size-8 place-items-center rounded-lg border border-white/[0.07] text-muted-foreground/40"
                        : "grid size-8 place-items-center rounded-lg border border-white/[0.07] text-muted-foreground transition-colors hover:text-foreground"
                    }
                  >
                    <ChevronRight className="size-4" aria-hidden />
                  </Link>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </DashboardFrame>
  );
}

function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  icon: typeof ReceiptText;
  tone: "brand" | "info" | "success" | "warning";
}) {
  const tones = {
    brand: "bg-electric-500/12 text-electric-300 ring-electric-400/20",
    info: "bg-cyan-glow/12 text-cyan-glow ring-cyan-glow/20",
    success: "bg-mint-glow/12 text-mint-glow ring-mint-glow/20",
    warning: "bg-amber-glow/12 text-amber-glow ring-amber-glow/20",
  } as const;

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3.5 sm:p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10.5px] leading-tight font-medium text-muted-foreground">
          {label}
        </p>
        <span
          className={`grid size-7 shrink-0 place-items-center rounded-lg ring-1 ${tones[tone]}`}
        >
          <Icon className="size-3.5" aria-hidden />
        </span>
      </div>
      <p className="mt-2.5 font-heading text-[1.05rem] leading-none font-semibold tracking-[-0.03em] sm:text-[1.2rem]">
        {value}
      </p>
      <p className="mt-1.5 truncate text-[10px] text-muted-foreground">{hint}</p>
    </div>
  );
}

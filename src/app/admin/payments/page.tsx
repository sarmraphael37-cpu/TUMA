import type { Metadata } from "next";
import { Wallet } from "lucide-react";

import { Card } from "@/components/dashboard/cards/card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { AdminFrame } from "@/components/admin/admin-frame";
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
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getPlatformOverview } from "@/lib/admin/queries";
import { resolveDashboardRange } from "@/lib/db/ranges";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/format";

export const metadata: Metadata = {
  title: "Payments",
  description: "Revenue and payment verification across the platform.",
};

type SearchParams = Promise<{ range?: string; from?: string; to?: string }>;

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const range = resolveDashboardRange({
    range: params.range,
    from: params.from,
    to: params.to,
  });

  const overview = await getPlatformOverview(range);

  let orders: Array<{
    id: string;
    order_number: string;
    payment_status: string;
    total: number;
    currency: string;
    placed_at: string;
    business: { name: string; slug: string } | null;
  }> = [];
  let error: string | null = null;

  try {
    const supabase = await getSupabaseServerClient();
    const { data, error: queryError } = await supabase
      .from("orders")
      .select("id, order_number, payment_status, total, currency, placed_at, business:businesses(name, slug)")
      .order("placed_at", { ascending: false })
      .limit(100);

    if (queryError) {
      error = queryError.message;
    } else {
      orders = ((data ?? []) as unknown[]).map((row) => {
        const r = row as Record<string, unknown>;
        const business = Array.isArray(r.business)
          ? (r.business[0] as { name: string; slug: string } | undefined) ?? null
          : (r.business as { name: string; slug: string } | null);
        return {
          id: String(r.id),
          order_number: String(r.order_number),
          payment_status: String(r.payment_status),
          total: Number(r.total ?? 0),
          currency: String(r.currency),
          placed_at: String(r.placed_at),
          business,
        };
      });
    }
  } catch (caught) {
    error = caught instanceof Error ? caught.message : "Unknown error";
  }

  const o = overview.overview;

  return (
    <AdminFrame>
      <div className="space-y-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <h1 className="font-heading text-[1.65rem] leading-tight font-semibold tracking-[-0.035em] sm:text-[1.9rem]">
              Payments
            </h1>
            <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-muted-foreground">
              Revenue is derived from orders marked paid. No payment gateway is
              connected, so figures reflect verified merchant payments only.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Card bodyClassName="p-4">
            <p className="text-[10.5px] text-muted-foreground">Revenue collected</p>
            <p className="mt-1.5 font-heading text-[1.2rem] font-semibold">
              {formatCurrency(Number(o.revenue ?? 0), "XAF")}
            </p>
          </Card>
          <Card bodyClassName="p-4">
            <p className="text-[10.5px] text-muted-foreground">Paid orders</p>
            <p className="mt-1.5 font-heading text-[1.2rem] font-semibold">
              {formatNumber(Number(o.paidOrders ?? 0))}
            </p>
          </Card>
          <Card bodyClassName="p-4">
            <p className="text-[10.5px] text-muted-foreground">Awaiting verification</p>
            <p className="mt-1.5 font-heading text-[1.2rem] font-semibold">
              {formatNumber(Number(o.awaitingVerification ?? 0))}
            </p>
          </Card>
          <Card bodyClassName="p-4">
            <p className="text-[10.5px] text-muted-foreground">Unpaid</p>
            <p className="mt-1.5 font-heading text-[1.2rem] font-semibold">
              {formatNumber(Number(o.unpaidOrders ?? 0))}
            </p>
          </Card>
        </div>

        {error ? (
          <ErrorState title="We could not load payments" description={error} />
        ) : orders.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Wallet className="size-5" aria-hidden />}
              title="No orders yet"
              description="Orders placed across the platform appear here with their payment state."
            />
          </Card>
        ) : (
          <Card bodyClassName="p-0">
            <div className="overflow-x-auto">
              <Table className="text-[11.5px]">
                <TableHeader>
                  <TableRow className="border-white/[0.06] hover:bg-transparent">
                    <TableHead className="h-9 pl-4 text-[10px] text-muted-foreground">Order</TableHead>
                    <TableHead className="h-9 text-[10px] text-muted-foreground">Merchant</TableHead>
                    <TableHead className="h-9 text-[10px] text-muted-foreground">Placed</TableHead>
                    <TableHead className="h-9 text-right text-[10px] text-muted-foreground">Total</TableHead>
                    <TableHead className="h-9 text-[10px] text-muted-foreground">Payment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id} className="border-white/[0.05] hover:bg-white/[0.02]">
                      <TableCell className="py-2.5 pl-4 font-mono text-[11px] text-foreground">
                        {order.order_number}
                      </TableCell>
                      <TableCell className="py-2.5 text-muted-foreground">
                        {order.business?.name ?? "—"}
                      </TableCell>
                      <TableCell className="py-2.5 whitespace-nowrap text-muted-foreground">
                        {formatDateTime(order.placed_at)}
                      </TableCell>
                      <TableCell className="py-2.5 text-right whitespace-nowrap text-foreground/85">
                        {formatCurrency(Number(order.total ?? 0), order.currency)}
                      </TableCell>
                      <TableCell className="py-2.5">
                        <StatusBadge
                          tone={
                            order.payment_status === "paid"
                              ? "success"
                              : order.payment_status === "rejected"
                                ? "danger"
                                : "warning"
                          }
                        >
                          {order.payment_status}
                        </StatusBadge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </div>
    </AdminFrame>
  );
}

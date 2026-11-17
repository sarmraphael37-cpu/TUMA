import { ArrowUpRight, Filter, Plus } from "lucide-react";

import { StatusBadge, type StatusTone } from "@/components/dashboard/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { recentOrders } from "@/content/marketing";

const statusTone: Record<string, StatusTone> = {
  Delivered: "success",
  "In transit": "info",
  Processing: "brand",
  "Quote sent": "neutral",
};

const paymentTone: Record<string, StatusTone> = {
  Paid: "success",
  Partial: "warning",
  Pending: "warning",
  Unpaid: "danger",
};

/**
 * Static representation of the orders workspace. The only real control on the
 * marketing page is the demo tab strip; this panel is a product screenshot.
 */
export function OrdersPanel() {
  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[9px] text-muted-foreground">Sales pipeline</p>
          <h3 className="font-heading text-sm font-semibold tracking-tight sm:text-[15px]">
            Orders
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex h-6 items-center gap-1 rounded-md border border-white/[0.07] bg-white/[0.03] px-2 text-[9px] text-muted-foreground">
            <Filter className="size-2.5" aria-hidden />
            November 2026
          </span>
          <span className="inline-flex h-6 items-center gap-1 rounded-md bg-primary/90 px-2 text-[9px] font-medium text-primary-foreground">
            <Plus className="size-2.5" aria-hidden />
            New order
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Open orders", value: "38", detail: "+6 this week" },
          { label: "Awaiting payment", value: "2.4M", detail: "XAF outstanding" },
          { label: "Fulfilled", value: "412", detail: "this month" },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5"
          >
            <p className="truncate text-[8px] text-muted-foreground">
              {item.label}
            </p>
            <p className="mt-0.5 font-heading text-[11px] font-semibold tracking-tight sm:text-xs">
              {item.value}
            </p>
            <p className="mt-0.5 truncate text-[8px] text-muted-foreground">
              {item.detail}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
        <div className="flex items-center justify-between">
          <p className="text-[9px] font-medium">All orders</p>
          <span className="text-[8px] text-muted-foreground">
            Showing 5 of 38
          </span>
        </div>

        <Table className="mt-1.5 text-[9px]">
          <TableHeader>
            <TableRow className="border-white/[0.06] hover:bg-transparent">
              {["Order", "Customer", "Total", "Payment", "Status"].map(
                (heading) => (
                  <TableHead
                    key={heading}
                    className="h-6 px-1 text-[8px] font-medium text-muted-foreground first:px-0 last:px-0"
                  >
                    {heading}
                  </TableHead>
                ),
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentOrders.map((order) => (
              <TableRow
                key={order.id}
                className="border-white/[0.05] hover:bg-transparent"
              >
                <TableCell className="px-0 py-1.5 font-mono text-[8px] text-muted-foreground">
                  {order.id}
                </TableCell>
                <TableCell className="max-w-[120px] px-1 py-1.5">
                  <p className="truncate text-[8px] font-medium">
                    {order.customer}
                  </p>
                  <p className="truncate text-[8px] text-muted-foreground">
                    {order.items}
                  </p>
                </TableCell>
                <TableCell className="px-1 py-1.5 text-[8px] whitespace-nowrap text-foreground/80">
                  {order.total}
                </TableCell>
                <TableCell className="px-1 py-1.5">
                  <StatusBadge
                    tone={paymentTone[order.payment] ?? "neutral"}
                    className="text-[8px]"
                  >
                    {order.payment}
                  </StatusBadge>
                </TableCell>
                <TableCell className="px-0 py-1.5 text-right">
                  <StatusBadge tone={statusTone[order.status] ?? "neutral"}>
                    {order.status}
                  </StatusBadge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="mt-2 flex items-center justify-between border-t border-white/[0.05] pt-2 text-[8px] text-muted-foreground">
          <span>Average order value · 214,400 XAF</span>
          <span className="inline-flex items-center gap-0.5 text-mint-glow">
            <ArrowUpRight className="size-2.5" aria-hidden />
            12.4% vs October
          </span>
        </div>
      </div>
    </div>
  );
}

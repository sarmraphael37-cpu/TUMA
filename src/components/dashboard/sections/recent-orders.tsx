import Link from "next/link";
import { ReceiptText, ShoppingBag } from "lucide-react";

import { StatusBadge } from "@/components/dashboard/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { OrderRow } from "@/lib/db/dashboard";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  orderStatusLabel,
  orderStatusTone,
  paymentStatusLabel,
  paymentStatusTone,
} from "@/lib/orders";

export function RecentOrders({
  orders,
  currency,
}: {
  orders: OrderRow[];
  currency: string;
}) {
  return (
    <div className="overflow-x-auto">
      <Table className="text-[11.5px]">
        <TableHeader>
          <TableRow className="border-white/[0.06] hover:bg-transparent">
            <TableHead className="h-8 px-1 text-[10px] text-muted-foreground">
              Order
            </TableHead>
            <TableHead className="h-8 px-1 text-[10px] text-muted-foreground">
              Customer
            </TableHead>
            <TableHead className="h-8 px-1 text-[10px] text-muted-foreground">
              Date
            </TableHead>
            <TableHead className="h-8 px-1 text-[10px] text-muted-foreground">
              Total
            </TableHead>
            <TableHead className="h-8 px-1 text-[10px] text-muted-foreground">
              Payment
            </TableHead>
            <TableHead className="h-8 px-1 text-right text-[10px] text-muted-foreground">
              Status
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow
              key={order.id}
              className="border-white/[0.05] hover:bg-white/[0.02]"
            >
              <TableCell className="px-1 py-2.5 font-mono text-[10.5px] text-muted-foreground">
                {order.order_number}
              </TableCell>
              <TableCell className="max-w-[160px] truncate px-1 py-2.5 text-foreground/85">
                {order.customers?.name ?? "Walk-in customer"}
              </TableCell>
              <TableCell className="px-1 py-2.5 whitespace-nowrap text-muted-foreground">
                {formatDate(order.placed_at)}
              </TableCell>
              <TableCell className="px-1 py-2.5 whitespace-nowrap text-foreground/85">
                {formatCurrency(Number(order.total ?? 0), currency)}
              </TableCell>
              <TableCell className="px-1 py-2.5">
                <StatusBadge tone={paymentStatusTone(order.payment_status)}>
                  {paymentStatusLabel(order.payment_status)}
                </StatusBadge>
              </TableCell>
              <TableCell className="px-1 py-2.5 text-right">
                <StatusBadge tone={orderStatusTone(order.status)}>
                  {orderStatusLabel(order.status)}
                </StatusBadge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function RecentOrdersEmpty({ hasProducts }: { hasProducts: boolean }) {
  return (
    <div className="flex flex-col items-center px-5 py-10 text-center">
      <span className="grid size-11 place-items-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-muted-foreground">
        <ShoppingBag className="size-5" aria-hidden />
      </span>
      <p className="mt-3 text-[12.5px] font-medium">No orders in this period</p>
      <p className="mt-1 max-w-xs text-[11.5px] leading-relaxed text-muted-foreground">
        {hasProducts
          ? "Orders you record will appear here with their payment status and totals."
          : "Add the products you sell first — orders and revenue follow from there."}
      </p>
      <Link
        href={hasProducts ? "/dashboard/products" : "/dashboard/products#add-product"}
        className="mt-4 inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 text-[11.5px] font-medium transition-colors hover:bg-white/[0.07]"
      >
        <ReceiptText className="size-3.5" aria-hidden />
        {hasProducts ? "Review your catalogue" : "Add your first product"}
      </Link>
    </div>
  );
}

"use client";

import Link from "next/link";
import {
  Bell,
  Boxes,
  PackageSearch,
  ShoppingBag,
  TriangleAlert,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type NotificationLowStock = {
  id: string;
  name: string;
  sku: string;
  stock_quantity: number;
  low_stock_threshold: number;
};

export type NotificationOrder = {
  id: string;
  order_number: string;
  status: string;
  customer: string | null;
  placed_at: string;
};

export function NotificationsMenu({
  lowStock,
  lowStockCount,
  pendingOrders,
  pendingOrdersCount,
}: {
  lowStock: NotificationLowStock[];
  lowStockCount: number;
  pendingOrders: NotificationOrder[];
  pendingOrdersCount: number;
}) {
  const total = lowStockCount + pendingOrdersCount;
  const empty = total === 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={
            total > 0
              ? `Notifications, ${total} unread`
              : "Notifications, nothing to review"
          }
          className="relative grid size-9 place-items-center rounded-xl border border-white/[0.07] bg-white/[0.025] text-muted-foreground transition-colors hover:border-white/[0.13] hover:bg-white/[0.045] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <Bell className="size-4" aria-hidden />
          {total > 0 ? (
            <span className="absolute -top-1 -right-1 grid min-w-4 place-items-center rounded-full bg-amber-glow px-1 text-[9px] font-semibold text-navy-950">
              {total > 9 ? "9+" : total}
            </span>
          ) : null}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-[21rem] border border-white/[0.08] bg-navy-850 p-1.5"
      >
        <DropdownMenuLabel className="px-2 py-1.5 text-[12px] font-medium">
          Notifications
        </DropdownMenuLabel>

        {empty ? (
          <div className="flex flex-col items-center px-4 py-6 text-center">
            <span className="grid size-9 place-items-center rounded-xl border border-mint-glow/20 bg-mint-glow/[0.07] text-mint-glow">
              <PackageSearch className="size-4" aria-hidden />
            </span>
            <p className="mt-2.5 text-[12px] font-medium">All clear</p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              No low stock to restock and no order waiting on you.
            </p>
          </div>
        ) : null}

        {lowStockCount > 0 ? (
          <>
            <DropdownMenuSeparator className="bg-white/[0.07]" />
            <p className="px-2 pt-1 pb-1 text-[10px] font-semibold tracking-[0.12em] text-muted-foreground/70 uppercase">
              Low stock ({lowStockCount})
            </p>
            {lowStock.map((item) => (
              <DropdownMenuItem key={item.id} asChild>
                <Link
                  href="/dashboard#low-stock"
                  className="gap-2.5 py-2 text-[12px]"
                >
                  <TriangleAlert
                    className="size-3.5 shrink-0 text-amber-glow"
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{item.name}</span>
                    <span className="block text-[10.5px] text-muted-foreground">
                      {item.stock_quantity} left · alert at{" "}
                      {item.low_stock_threshold}
                    </span>
                  </span>
                </Link>
              </DropdownMenuItem>
            ))}
          </>
        ) : null}

        {pendingOrdersCount > 0 ? (
          <>
            <DropdownMenuSeparator className="bg-white/[0.07]" />
            <p className="px-2 pt-1 pb-1 text-[10px] font-semibold tracking-[0.12em] text-muted-foreground/70 uppercase">
              Orders in progress ({pendingOrdersCount})
            </p>
            {pendingOrders.map((order) => (
              <DropdownMenuItem key={order.id} asChild>
                <Link
                  href="/dashboard#recent-orders"
                  className="gap-2.5 py-2 text-[12px]"
                >
                  <ShoppingBag
                    className="size-3.5 shrink-0 text-cyan-glow"
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-mono text-[11px]">
                      {order.order_number}
                    </span>
                    <span className="block truncate text-[10.5px] text-muted-foreground">
                      {order.customer ?? "Walk-in customer"} · {order.status}
                    </span>
                  </span>
                </Link>
              </DropdownMenuItem>
            ))}
          </>
        ) : null}

        <DropdownMenuSeparator className="bg-white/[0.07]" />
        <DropdownMenuItem asChild>
          <Link href="/dashboard" className="gap-2 text-[11.5px]">
            <Boxes className="size-3.5" aria-hidden />
            Open the overview
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

"use client";

import { Menu } from "lucide-react";
import { GlobalSearch } from "@/components/dashboard/shell/global-search";
import {
  NotificationsMenu,
  type NotificationLowStock,
  type NotificationOrder,
} from "@/components/dashboard/shell/notifications-menu";
import { UserMenu } from "@/components/dashboard/shell/user-menu";
import { Button } from "@/components/ui/button";

export function TopBar({
  businessName,
  user,
  plan,
  lowStock,
  lowStockCount,
  pendingOrders,
  pendingOrdersCount,
  onOpenNav,
}: {
  businessName: string;
  user: { name: string; email: string };
  plan: string;
  lowStock: NotificationLowStock[];
  lowStockCount: number;
  pendingOrders: NotificationOrder[];
  pendingOrdersCount: number;
  onOpenNav: () => void;
}) {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/[0.06] bg-navy-950/85 backdrop-blur-xl lg:left-[var(--tuma-sidebar-width)]">
      <div className="flex h-14 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          size="icon"
          className="size-9 lg:hidden"
          onClick={onOpenNav}
          aria-label="Open navigation"
        >
          <Menu className="size-4" aria-hidden />
        </Button>

        <div className="hidden min-w-0 lg:block">
          <p className="truncate text-[10px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
            Workspace / {businessName}
          </p>
        </div>

        <GlobalSearch className="ml-auto max-w-xs flex-1 sm:max-w-sm" />

        <div className="flex items-center gap-2">
          <NotificationsMenu
            lowStock={lowStock}
            lowStockCount={lowStockCount}
            pendingOrders={pendingOrders}
            pendingOrdersCount={pendingOrdersCount}
          />
          <UserMenu
            name={user.name}
            email={user.email}
            plan={plan}
            businessName={businessName}
          />
        </div>
      </div>
    </header>
  );
}

"use client";

import { useEffect, useState } from "react";

import { DashboardSidebar } from "@/components/dashboard/shell/sidebar";
import { useSidebarCollapsed } from "@/components/dashboard/shell/sidebar-store";
import { TopBar } from "@/components/dashboard/shell/top-bar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export type DashboardChromeProps = {
  business: {
    name: string;
    slug: string;
    category: string;
    currency: string;
  };
  user: { name: string; email: string };
  plan: { plan: string; status: string; trialEndsAt: string | null } | null;
  notifications: {
    lowStock: {
      id: string;
      name: string;
      sku: string;
      stock_quantity: number;
      low_stock_threshold: number;
    }[];
    lowStockCount: number;
    pendingOrders: {
      id: string;
      order_number: string;
      status: string;
      customer: string | null;
      placed_at: string;
    }[];
    pendingOrdersCount: number;
  };
};

/**
 * The workspace chrome: sidebar, top bar and the mobile drawer.
 *
 * It deliberately renders *no children*. The page content stays in the server
 * tree — passing server components through a client component makes React
 * resolve them lazily, and a lazily resolved Suspense boundary can stay
 * pending forever.
 */
export function DashboardChrome({
  business,
  user,
  plan,
  notifications,
}: DashboardChromeProps) {
  const { collapsed, toggle } = useSidebarCollapsed();
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--tuma-sidebar-width",
      collapsed ? "76px" : "264px",
    );
  }, [collapsed]);

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden border-r border-white/[0.06] bg-navy-950/70 backdrop-blur-xl transition-[width] duration-300 lg:block ${
          collapsed ? "w-[76px]" : "w-[264px]"
        }`}
      >
        <DashboardSidebar
          business={business}
          plan={plan}
          collapsed={collapsed}
          onToggle={toggle}
        />
      </aside>

      <Sheet open={navOpen} onOpenChange={setNavOpen}>
        <SheetContent
          side="left"
          className="w-[17rem] border-white/[0.08] bg-navy-950/95 p-0 backdrop-blur-2xl"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Workspace navigation</SheetTitle>
            <SheetDescription>
              Move between your overview and your product catalogue.
            </SheetDescription>
          </SheetHeader>
          <DashboardSidebar
            business={business}
            plan={plan}
            variant="mobile"
            onNavigate={() => setNavOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <TopBar
        businessName={business.name}
        user={user}
        plan={plan?.plan ?? "No plan"}
        lowStock={notifications.lowStock}
        lowStockCount={notifications.lowStockCount}
        pendingOrders={notifications.pendingOrders}
        pendingOrdersCount={notifications.pendingOrdersCount}
        onOpenNav={() => setNavOpen(true)}
      />
    </>
  );
}

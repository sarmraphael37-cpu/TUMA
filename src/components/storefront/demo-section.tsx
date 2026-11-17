"use client";

import { useState } from "react";
import {
  BarChart3,
  Boxes,
  LayoutDashboard,
  ShoppingBag,
  Sparkles,
} from "lucide-react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { InsightsPanel } from "@/components/dashboard/insights-panel";
import { InventoryPanel } from "@/components/dashboard/inventory-panel";
import { OrdersPanel } from "@/components/dashboard/orders-panel";
import { OverviewPanel } from "@/components/dashboard/overview-panel";
import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/layout/reveal";
import { SectionHeading } from "@/components/layout/section-heading";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { productPreviewContent } from "@/content/marketing";

const demoTabs = [
  { value: "overview", label: "Overview", icon: LayoutDashboard, panel: OverviewPanel },
  { value: "orders", label: "Orders", icon: ShoppingBag, panel: OrdersPanel },
  { value: "inventory", label: "Inventory", icon: Boxes, panel: InventoryPanel },
  { value: "insights", label: "Insights", icon: Sparkles, panel: InsightsPanel },
] as const;

const shellLabels: Record<string, "Overview" | "Orders" | "Inventory" | "Analytics"> = {
  overview: "Overview",
  orders: "Orders",
  inventory: "Inventory",
  insights: "Analytics",
};

/**
 * The interactive product tour. Tab switching is a real control; everything
 * inside the framed workspace is a static, screenshot-quality preview.
 */
export function DemoSection() {
  const [active, setActive] = useState<string>("overview");

  return (
    <section id="demo" className="relative scroll-mt-24 py-20 sm:py-24 lg:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/3 -z-10 h-[420px] bg-[radial-gradient(ellipse_at_center,rgba(46,124,255,0.16),transparent_70%)]"
      />

      <Container>
        <Reveal>
          <SectionHeading
            eyebrow={productPreviewContent.eyebrow}
            title={productPreviewContent.title}
            description={productPreviewContent.description}
            align="center"
            className="max-w-3xl"
          />
        </Reveal>

        <Reveal delay={100} className="mt-10">
          <Tabs value={active} onValueChange={setActive} className="gap-5">
            <div className="flex justify-center">
              <TabsList className="h-auto w-full max-w-2xl flex-wrap gap-1 rounded-xl border border-white/[0.08] bg-white/[0.03] p-1.5 backdrop-blur sm:flex-nowrap">
                {demoTabs.map((tab) => {
                  const Icon = tab.icon;

                  return (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="h-9 gap-2 rounded-lg px-3 text-xs font-medium data-active:bg-white/[0.08] data-active:text-foreground sm:text-[13px]"
                    >
                      <Icon className="size-3.5" aria-hidden />
                      {tab.label}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            {demoTabs.map((tab) => {
              const Panel = tab.panel;

              return (
                <TabsContent key={tab.value} value={tab.value}>
                  <DashboardShell activeItem={shellLabels[tab.value]}>
                    <Panel />
                  </DashboardShell>
                </TabsContent>
              );
            })}
          </Tabs>
        </Reveal>

        <Reveal delay={160}>
          <p className="mt-5 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
            <BarChart3 className="size-3.5 text-cyan-glow" aria-hidden />
            Switch tabs to explore the workspace. Data shown is a representative
            demo.
          </p>
        </Reveal>
      </Container>
    </section>
  );
}

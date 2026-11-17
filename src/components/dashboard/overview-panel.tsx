import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { cn } from "cn";

import { RevenueChart } from "@/components/dashboard/revenue-chart";
import {
  StatusBadge,
  type StatusTone,
} from "@/components/dashboard/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  dashboardKpis,
  recentOrders,
  revenueSeries,
} from "@/content/marketing";

const statusTone: Record<string, StatusTone> = {
  Delivered: "success",
  "In transit": "info",
  Processing: "brand",
  "Quote sent": "neutral",
};

const topProducts = [
  { name: "Ankara fabric", sales: "312", share: 92 },
  { name: "Rice 25kg", sales: "248", share: 74 },
  { name: "Cooking oil", sales: "196", share: 58 },
  { name: "POS rolls", sales: "144", share: 42 },
];

export function OverviewPanel() {
  return (
    <div className="space-y-2.5">
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-[9px] text-muted-foreground">
            Tuesday, 12 November
          </p>
          <h3 className="font-heading text-sm font-semibold tracking-tight sm:text-[15px]">
            Good morning, Sandrine
          </h3>
        </div>
        <StatusBadge tone="success" className="hidden sm:inline-flex">
          <span className="mr-1 size-1 rounded-full bg-mint-glow" />
          Live sync
        </StatusBadge>
      </div>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {dashboardKpis.map((kpi) => {
          const Icon = kpi.trend === "up" ? ArrowUpRight : ArrowDownRight;

          return (
            <div
              key={kpi.label}
              className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5"
            >
              <p className="truncate text-[9px] text-muted-foreground">
                {kpi.label}
              </p>
              <p className="mt-1 font-heading text-[11px] font-semibold tracking-tight sm:text-xs">
                {kpi.value}
              </p>
              <span
                className={cn(
                  "mt-1 inline-flex items-center gap-0.5 text-[8px]",
                  kpi.trend === "up" ? "text-mint-glow" : "text-electric-300",
                )}
              >
                <Icon className="size-2.5" aria-hidden />
                {kpi.delta}
              </span>
            </div>
          );
        })}
      </div>

      <div className="grid gap-2 lg:grid-cols-[1.55fr_1fr]">
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-medium">Revenue</p>
              <p className="text-[8px] text-muted-foreground">
                Last 12 months
              </p>
            </div>
            <StatusBadge tone="success">+24.1%</StatusBadge>
          </div>
          <RevenueChart data={revenueSeries} className="mt-2 h-24 sm:h-28" />
        </div>

        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
          <p className="text-[9px] font-medium">Top products</p>
          <div className="mt-2.5 space-y-2">
            {topProducts.map((product, index) => (
              <div key={product.name} className="flex items-center gap-2">
                <span className="grid size-4 place-items-center rounded bg-white/[0.04] text-[8px] text-muted-foreground">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[8px] font-medium">
                    {product.name}
                  </p>
                  <div className="mt-1 h-0.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-electric-500 to-cyan-glow"
                      style={{ width: `${product.share}%` }}
                    />
                  </div>
                </div>
                <span className="text-[8px] text-muted-foreground">
                  {product.sales}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
        <div className="flex items-center justify-between">
          <p className="text-[9px] font-medium">Recent orders</p>
          <span className="text-[8px] text-muted-foreground">View all</span>
        </div>
        <Table className="mt-1.5 text-[9px]">
          <TableHeader>
            <TableRow className="border-white/[0.06] hover:bg-transparent">
              <TableHead className="h-6 px-0 text-[8px] font-medium text-muted-foreground">
                Order
              </TableHead>
              <TableHead className="h-6 px-1 text-[8px] font-medium text-muted-foreground">
                Customer
              </TableHead>
              <TableHead className="h-6 px-1 text-right text-[8px] font-medium text-muted-foreground">
                Total
              </TableHead>
              <TableHead className="h-6 px-0 text-right text-[8px] font-medium text-muted-foreground">
                Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentOrders.slice(0, 3).map((order) => (
              <TableRow
                key={order.id}
                className="border-white/[0.05] hover:bg-transparent"
              >
                <TableCell className="px-0 py-1.5 font-mono text-[8px] text-muted-foreground">
                  {order.id}
                </TableCell>
                <TableCell className="max-w-[110px] truncate px-1 py-1.5 text-[8px] font-medium">
                  {order.customer}
                </TableCell>
                <TableCell className="px-1 py-1.5 text-right text-[8px] text-foreground/80">
                  {order.total}
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
      </div>
    </div>
  );
}

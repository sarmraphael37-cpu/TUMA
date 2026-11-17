"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip,
  XAxis,
} from "recharts";

import { cn } from "cn";

import {
  ChartContainer,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatCurrency } from "@/lib/format";

type RevenuePoint = {
  month: string;
  revenue: number;
};

type RevenueChartProps = {
  data: RevenuePoint[];
  className?: string;
  showAxis?: boolean;
};

const config = {
  revenue: { label: "Revenue", color: "#38E0FF" },
} satisfies ChartConfig;

function RevenueTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ value?: number | string }>;
  label?: string;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-lg border border-white/10 bg-navy-850/95 px-3 py-2 text-[11px] shadow-[0_18px_40px_-12px_rgba(0,0,0,0.7)] backdrop-blur">
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-medium text-foreground">
        {formatCurrency(Number(payload[0]?.value ?? 0))}
      </p>
    </div>
  );
}

export function RevenueChart({
  data,
  className,
  showAxis = false,
}: RevenueChartProps) {
  return (
    <ChartContainer
      config={config}
      className={cn("relative aspect-auto w-full", className)}
    >
      <AreaChart
        data={data}
        margin={
          showAxis
            ? { top: 10, right: 8, left: -16, bottom: 0 }
            : { top: 8, right: 2, left: 2, bottom: 0 }
        }
      >
        <defs>
          <linearGradient id="tuma-revenue-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38E0FF" stopOpacity={0.34} />
            <stop offset="55%" stopColor="#2E7CFF" stopOpacity={0.13} />
            <stop offset="100%" stopColor="#2E7CFF" stopOpacity={0} />
          </linearGradient>
        </defs>

        {showAxis ? (
          <CartesianGrid
            vertical={false}
            stroke="rgba(125,165,255,0.10)"
            strokeDasharray="4 4"
          />
        ) : null}

        {showAxis ? (
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#8FA3C8", fontSize: 10 }}
            dy={6}
          />
        ) : null}

        <Tooltip
          cursor={{ stroke: "rgba(56,224,255,0.28)", strokeWidth: 1 }}
          content={<RevenueTooltip />}
        />

        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#38E0FF"
          strokeWidth={2}
          fill="url(#tuma-revenue-fill)"
          activeDot={{ r: 3, fill: "#38E0FF", strokeWidth: 0 }}
        />
      </AreaChart>
    </ChartContainer>
  );
}

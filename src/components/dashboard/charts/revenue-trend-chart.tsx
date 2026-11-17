"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatCompactCurrency, formatCurrency } from "@/lib/format";

export type RevenueTrendPoint = {
  label: string;
  revenue: number;
  previousRevenue: number;
};

const config = {
  revenue: { label: "This period", color: "#2e7cff" },
  previousRevenue: { label: "Previous period", color: "rgba(148,163,184,0.45)" },
} satisfies ChartConfig;

type TooltipEntry = {
  name?: string | number;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
};

export function RevenueTrendChart({
  data,
  currency,
}: {
  data: RevenueTrendPoint[];
  currency: string;
}) {
  return (
    <ChartContainer config={config} className="h-[260px] w-full">
      <AreaChart data={data} margin={{ left: 4, right: 4, top: 8 }}>
        <defs>
          <linearGradient id="tuma-revenue-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2e7cff" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#2e7cff" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient
            id="tuma-previous-fill"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.22} />
            <stop offset="100%" stopColor="#94a3b8" stopOpacity={0.02} />
          </linearGradient>
        </defs>

        <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={16}
          tick={{ fontSize: 10, fill: "rgba(255,255,255,0.45)" }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={52}
          tick={{ fontSize: 10, fill: "rgba(255,255,255,0.45)" }}
          tickFormatter={(value: number) => formatCompactCurrency(value, currency)}
        />

        <ChartTooltip
          cursor={{ stroke: "rgba(255,255,255,0.12)", strokeDasharray: "4 4" }}
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) {
              return null;
            }

            const entries = payload as unknown as TooltipEntry[];

            return (
              <div className="rounded-xl border border-white/10 bg-navy-850/95 px-3 py-2 text-[11px] shadow-[0_18px_40px_-12px_rgba(0,0,0,0.7)] backdrop-blur">
                <p className="text-muted-foreground">{String(label)}</p>
                {entries.map((entry) => (
                  <p
                    key={String(entry.dataKey)}
                    className="mt-1 flex items-center gap-2"
                  >
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ background: entry.color }}
                    />
                    <span className="text-muted-foreground">
                      {entry.dataKey === "previousRevenue"
                        ? "Previous period"
                        : "This period"}
                    </span>
                    <span className="font-medium text-foreground">
                      {formatCurrency(Number(entry.value ?? 0), currency)}
                    </span>
                  </p>
                ))}
              </div>
            );
          }}
        />

        <Area
          type="monotone"
          dataKey="previousRevenue"
          stroke="rgba(148,163,184,0.55)"
          strokeWidth={1.5}
          strokeDasharray="4 4"
          fill="url(#tuma-previous-fill)"
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#2e7cff"
          strokeWidth={2}
          fill="url(#tuma-revenue-fill)"
        />
      </AreaChart>
    </ChartContainer>
  );
}


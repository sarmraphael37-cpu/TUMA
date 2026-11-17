"use client";

import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatCompactCurrency, formatCurrency } from "@/lib/format";

export type SalesPerformancePoint = {
  label: string;
  revenue: number;
  orders: number;
};

const config = {
  revenue: { label: "Revenue", color: "#38e0ff" },
  orders: { label: "Orders", color: "#2e7cff" },
} satisfies ChartConfig;

type TooltipEntry = {
  name?: string | number;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
};

export function SalesPerformanceChart({
  data,
  currency,
}: {
  data: SalesPerformancePoint[];
  currency: string;
}) {
  return (
    <ChartContainer config={config} className="h-[260px] w-full">
      <ComposedChart data={data} margin={{ left: 4, right: 4, top: 8 }}>
        <defs>
          <linearGradient id="tuma-sales-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38e0ff" stopOpacity={0.45} />
            <stop offset="100%" stopColor="#38e0ff" stopOpacity={0.02} />
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
          yAxisId="orders"
          tickLine={false}
          axisLine={false}
          width={30}
          tick={{ fontSize: 10, fill: "rgba(255,255,255,0.45)" }}
          allowDecimals={false}
        />
        <YAxis
          yAxisId="revenue"
          orientation="right"
          tickLine={false}
          axisLine={false}
          width={52}
          tick={{ fontSize: 10, fill: "rgba(255,255,255,0.45)" }}
          tickFormatter={(value: number) => formatCompactCurrency(value, currency)}
        />

        <ChartTooltip
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
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
                      {entry.dataKey === "revenue" ? "Revenue" : "Orders"}
                    </span>
                    <span className="font-medium text-foreground">
                      {entry.dataKey === "revenue"
                        ? formatCurrency(Number(entry.value ?? 0), currency)
                        : Number(entry.value ?? 0)}
                    </span>
                  </p>
                ))}
              </div>
            );
          }}
        />

        <Bar
          yAxisId="orders"
          dataKey="orders"
          fill="#2e7cff"
          fillOpacity={0.35}
          radius={[4, 4, 0, 0]}
          maxBarSize={26}
        />
        <Area
          yAxisId="revenue"
          type="monotone"
          dataKey="revenue"
          stroke="#38e0ff"
          strokeWidth={2}
          fill="url(#tuma-sales-fill)"
        />
      </ComposedChart>
    </ChartContainer>
  );
}


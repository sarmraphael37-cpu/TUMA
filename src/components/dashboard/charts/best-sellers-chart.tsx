"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatCompactCurrency, formatCurrency } from "@/lib/format";

export type BestSellerPoint = {
  name: string;
  revenue: number;
  units: number;
};

const config = {
  revenue: { label: "Revenue", color: "#34e0b0" },
} satisfies ChartConfig;

type TooltipEntry = {
  value?: number | string;
  color?: string;
  dataKey?: string | number;
  payload?: BestSellerPoint;
};

export function BestSellersChart({
  data,
  currency,
}: {
  data: BestSellerPoint[];
  currency: string;
}) {
  return (
    <ChartContainer config={config} className="h-[240px] w-full">
      <BarChart
        data={data}
        layout="vertical"
        margin={{ left: 8, right: 12, top: 4 }}
      >
        <CartesianGrid horizontal={false} stroke="rgba(255,255,255,0.06)" />
        <XAxis
          type="number"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 10, fill: "rgba(255,255,255,0.45)" }}
          tickFormatter={(value: number) => formatCompactCurrency(value, currency)}
        />
        <YAxis
          type="category"
          dataKey="name"
          tickLine={false}
          axisLine={false}
          width={104}
          tick={{ fontSize: 10, fill: "rgba(255,255,255,0.7)" }}
        />

        <ChartTooltip
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) {
              return null;
            }

            const entry = (payload as unknown as TooltipEntry[])[0];
            const row = entry?.payload;

            return (
              <div className="rounded-xl border border-white/10 bg-navy-850/95 px-3 py-2 text-[11px] shadow-[0_18px_40px_-12px_rgba(0,0,0,0.7)] backdrop-blur">
                <p className="max-w-[200px] truncate font-medium text-foreground">
                  {row?.name}
                </p>
                <p className="mt-1 text-muted-foreground">
                  Revenue{" "}
                  <span className="text-foreground">
                    {formatCurrency(Number(entry?.value ?? 0), currency)}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  Units sold{" "}
                  <span className="text-foreground">{row?.units ?? 0}</span>
                </p>
              </div>
            );
          }}
        />

        <Bar
          dataKey="revenue"
          fill="#34e0b0"
          fillOpacity={0.75}
          radius={[0, 4, 4, 0]}
          maxBarSize={18}
        />
      </BarChart>
    </ChartContainer>
  );
}


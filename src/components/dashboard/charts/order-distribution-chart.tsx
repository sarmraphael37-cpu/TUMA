"use client";

import { Cell, Pie, PieChart } from "recharts";

import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import type { DistributionSlice } from "@/lib/db/dashboard";
import { cn } from "cn";

export type OrderDistributionSlice = {
  status: string;
  label: string;
  value: number;
  tone: DistributionSlice["tone"];
};

const TONE_COLORS: Record<OrderDistributionSlice["tone"], string> = {
  brand: "#2e7cff",
  info: "#38e0ff",
  success: "#34e0b0",
  warning: "#ffb454",
  danger: "#fb7185",
  neutral: "#94a3b8",
};

export function OrderDistributionChart({
  data,
}: {
  data: OrderDistributionSlice[];
}) {
  const total = data.reduce((sum, slice) => sum + slice.value, 0);

  const config = {
    value: { label: "Orders" },
  } satisfies ChartConfig;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <ChartContainer config={config} className="mx-auto h-[200px] w-full max-w-[220px]">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius={58}
            outerRadius={88}
            paddingAngle={2}
            stroke="transparent"
          >
            {data.map((slice) => (
              <Cell key={slice.status} fill={TONE_COLORS[slice.tone]} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>

      <ul className="flex-1 space-y-2">
        {data.map((slice) => {
          const share = total ? Math.round((slice.value / total) * 100) : 0;

          return (
            <li
              key={slice.status}
              className="flex items-center gap-2.5 text-[11.5px]"
            >
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ background: TONE_COLORS[slice.tone] }}
                aria-hidden
              />
              <span className="min-w-0 flex-1 truncate text-foreground/85">
                {slice.label}
              </span>
              <span className="text-muted-foreground">{slice.value}</span>
              <span
                className={cn(
                  "w-9 text-right font-mono text-[10.5px] text-muted-foreground/80",
                )}
              >
                {share}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}


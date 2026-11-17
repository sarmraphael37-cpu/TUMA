import {
  ArrowDownRight,
  ArrowUpRight,
  Minus,
  PackagePlus,
  ReceiptText,
  ShoppingBag,
  Users,
} from "lucide-react";

import type { GrowthSummary } from "@/lib/db/dashboard";
import { formatCurrency, formatNumber } from "@/lib/format";

function DeltaChip({ value }: { value: string | null }) {
  if (!value) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
        <Minus className="size-3" aria-hidden />
        no baseline
      </span>
    );
  }

  const up = value.startsWith("+");
  const down = value.startsWith("-");

  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
        up
          ? "bg-mint-glow/12 text-mint-glow"
          : down
            ? "bg-rose-400/12 text-rose-300"
            : "bg-white/[0.06] text-muted-foreground"
      }`}
    >
      {up ? (
        <ArrowUpRight className="size-3" aria-hidden />
      ) : down ? (
        <ArrowDownRight className="size-3" aria-hidden />
      ) : (
        <Minus className="size-3" aria-hidden />
      )}
      {value}
    </span>
  );
}

export function GrowthSummary({
  growth,
  currency,
  rangeLabel,
}: {
  growth: GrowthSummary;
  currency: string;
  rangeLabel: string;
}) {
  const rows = [
    {
      label: "Revenue collected",
      value: formatCurrency(growth.revenueCurrent, currency),
      delta: growth.revenueDelta,
      previous: `previous period: ${formatCurrency(growth.revenuePrevious, currency)}`,
      icon: ReceiptText,
    },
    {
      label: "Orders recorded",
      value: formatNumber(growth.ordersCurrent),
      delta: growth.ordersDelta,
      previous: `previous period: ${formatNumber(growth.ordersPrevious)}`,
      icon: ShoppingBag,
    },
    {
      label: "New customers",
      value: formatNumber(growth.customersCurrent),
      delta: growth.customersDelta,
      previous: `previous period: ${formatNumber(growth.customersPrevious)}`,
      icon: Users,
    },
    {
      label: "Products added",
      value: formatNumber(growth.productsAdded),
      delta: null,
      previous: "added to your catalogue in this period",
      icon: PackagePlus,
    },
  ];

  return (
    <div>
      <p className="text-[10.5px] text-muted-foreground">
        {rangeLabel} compared with the period before it.
      </p>

      <ul className="mt-3 space-y-2">
        {rows.map((row) => {
          const Icon = row.icon;

          return (
            <li
              key={row.label}
              className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-white/[0.05] text-muted-foreground">
                <Icon className="size-3.5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11.5px] text-muted-foreground">
                  {row.label}
                </p>
                <p className="truncate text-[10px] text-muted-foreground/70">
                  {row.previous}
                </p>
              </div>
              <p className="shrink-0 text-[12.5px] font-medium text-foreground">
                {row.value}
              </p>
              <DeltaChip value={row.delta} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

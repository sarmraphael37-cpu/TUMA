import Link from "next/link";
import { Package } from "lucide-react";

import type { BestSeller } from "@/lib/db/dashboard";
import { formatCurrency, formatNumber } from "@/lib/format";

export function TopProducts({
  sellers,
  currency,
}: {
  sellers: BestSeller[];
  currency: string;
}) {
  const top = sellers.slice(0, 5);
  const max = top.reduce((best, seller) => Math.max(best, seller.revenue), 0);

  return (
    <ol className="space-y-2.5">
      {top.map((seller, index) => {
        const share = max ? Math.round((seller.revenue / max) * 100) : 0;

        return (
          <li
            key={seller.key}
            className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg bg-white/[0.05] font-mono text-[10px] text-muted-foreground">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-medium">{seller.name}</p>
                <p className="mt-0.5 text-[10.5px] text-muted-foreground">
                  {formatNumber(seller.units)} units sold
                  {seller.stock !== null
                    ? ` · ${formatNumber(seller.stock)} in stock`
                    : ""}
                </p>
              </div>
              <p className="shrink-0 text-[11.5px] font-medium text-foreground/90">
                {formatCurrency(seller.revenue, currency)}
              </p>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.07]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-mint-glow to-cyan-glow"
                style={{ width: `${Math.max(share, 4)}%` }}
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function TopProductsEmpty() {
  return (
    <div className="flex flex-col items-center px-5 py-8 text-center">
      <span className="grid size-10 place-items-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-muted-foreground">
        <Package className="size-4" aria-hidden />
      </span>
      <p className="mt-3 text-[12.5px] font-medium">No sales in this period</p>
      <p className="mt-1 max-w-xs text-[11.5px] leading-relaxed text-muted-foreground">
        Your best-selling products appear here as soon as you record orders.
      </p>
      <Link
        href="/dashboard/products"
        className="mt-4 inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 text-[11.5px] font-medium transition-colors hover:bg-white/[0.07]"
      >
        Review your catalogue
      </Link>
    </div>
  );
}

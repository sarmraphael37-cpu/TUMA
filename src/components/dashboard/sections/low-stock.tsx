import { TriangleAlert } from "lucide-react";

import type { ProductRow } from "@/lib/db/dashboard";
import { formatNumber } from "@/lib/format";

export function LowStock({ products }: { products: ProductRow[] }) {
  return (
    <ul className="space-y-2">
      {products.slice(0, 6).map((product) => {
        const ceiling = Math.max(product.low_stock_threshold * 2, 1);
        const ratio = Math.min(
          Math.round((product.stock_quantity / ceiling) * 100),
          100,
        );

        return (
          <li
            key={product.id}
            className="rounded-xl border border-amber-glow/15 bg-amber-glow/[0.04] px-3 py-2.5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[12px] font-medium">{product.name}</p>
                <p className="truncate font-mono text-[9.5px] text-muted-foreground">
                  {product.sku}
                </p>
              </div>
              <span className="shrink-0 text-[10.5px] text-amber-glow">
                {formatNumber(product.stock_quantity)} left · alert at{" "}
                {formatNumber(product.low_stock_threshold)}
              </span>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className="h-full rounded-full bg-amber-glow"
                style={{ width: `${Math.max(ratio, 5)}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function LowStockEmpty() {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-mint-glow/15 bg-mint-glow/[0.05] px-3 py-3">
      <span className="grid size-7 place-items-center rounded-lg bg-mint-glow/10 text-mint-glow">
        <TriangleAlert className="size-3.5" aria-hidden />
      </span>
      <p className="text-[11.5px] text-muted-foreground">
        Every active product is above its alert level. Nothing to restock today.
      </p>
    </div>
  );
}

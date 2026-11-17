import Link from "next/link";

import { ProductActions } from "@/components/dashboard/products/product-actions";
import {
  AvailabilityBadge,
  DiscountBadge,
  ProductPrice,
  ProductThumb,
  StockMeter,
  stockState,
} from "@/components/dashboard/products/product-primitives";
import type { CatalogueProduct } from "@/lib/db/catalogue";
import { productImageUrl } from "@/lib/images";
import { formatNumber } from "@/lib/format";

export function ProductCard({
  product,
  currency,
  onEdit,
}: {
  product: CatalogueProduct;
  currency: string;
  onEdit?: (product: CatalogueProduct) => void;
}) {
  const stock = stockState(product.stock_quantity, product.low_stock_threshold);
  const cover = productImageUrl(product.images?.[0]);

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] transition-colors hover:border-white/[0.13]">
      <div className="flex items-start gap-3 p-3.5">
        <Link
          href={`/dashboard/products?q=${encodeURIComponent(product.sku)}`}
          className="relative"
          aria-label={`View ${product.name}`}
        >
          <ProductThumb url={cover} name={product.name} size="lg" />
          {stock.state === "out" ? (
            <span className="absolute inset-0 rounded-lg bg-navy-950/70" />
          ) : null}
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link
                href={`/dashboard/products?q=${encodeURIComponent(product.sku)}`}
                className="block truncate text-[13px] font-medium text-foreground hover:text-cyan-glow"
              >
                {product.name}
              </Link>
              <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">
                {product.sku}
              </p>
            </div>
            <ProductActions
              productId={product.id}
              status={product.status}
              deleted={Boolean(product.deleted_at)}
              onEdit={() => onEdit?.(product)}
            />
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <AvailabilityBadge
              status={product.status}
              deleted={Boolean(product.deleted_at)}
            />
            {stock.state !== "ok" ? (
              <span
                className={
                  stock.state === "out"
                    ? "text-[10px] font-medium text-rose-300"
                    : "text-[10px] font-medium text-amber-glow"
                }
              >
                {stock.label}
              </span>
            ) : null}
            <DiscountBadge
              price={Number(product.price)}
              originalPrice={
                product.original_price === null ? null : Number(product.original_price)
              }
            />
          </div>

          {product.category ? (
            <p className="mt-2 truncate text-[10.5px] text-muted-foreground">
              {product.category}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-auto border-t border-white/[0.06] px-3.5 py-3">
        <div className="flex items-center justify-between gap-3">
          <ProductPrice
            price={Number(product.price)}
            originalPrice={
              product.original_price === null ? null : Number(product.original_price)
            }
            currency={currency}
          />
          <span className="text-[11px] text-muted-foreground">
            {formatNumber(product.stock_quantity)} in stock
          </span>
        </div>
        <StockMeter
          stock={product.stock_quantity}
          stockThreshold={product.low_stock_threshold}
          className="mt-2"
        />
      </div>
    </article>
  );
}



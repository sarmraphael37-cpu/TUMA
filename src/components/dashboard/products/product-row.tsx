import {
  AvailabilityBadge,
  DiscountBadge,
  ProductPrice,
  ProductThumb,
  StockMeter,
  stockState,
} from "@/components/dashboard/products/product-primitives";
import { ProductActions } from "@/components/dashboard/products/product-actions";
import type { CatalogueProduct } from "@/lib/db/catalogue";
import { productImageUrl } from "@/lib/images";
import { formatNumber } from "@/lib/format";

export function ProductRow({
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
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition-colors hover:border-white/[0.12] sm:grid-cols-[auto_minmax(0,2.2fr)_auto_auto_auto]">
      <ProductThumb url={cover} name={product.name} />

      <div className="min-w-0">
        <p className="truncate text-[12.5px] font-medium">{product.name}</p>
        <p className="truncate font-mono text-[9.5px] text-muted-foreground">
          {product.sku}
          {product.category ? ` · ${product.category}` : ""}
        </p>
        <div className="mt-1.5 flex items-center gap-2 sm:hidden">
          <AvailabilityBadge
            tone={stock.tone}
            status={product.status}
            deleted={Boolean(product.deleted_at)}
          />
          <span className="text-[10px] text-muted-foreground">
            {formatNumber(product.stock_quantity)} in stock
          </span>
        </div>
      </div>

      <div className="hidden w-28 sm:block">
        <AvailabilityBadge
          tone={stock.tone}
          status={product.status}
          deleted={Boolean(product.deleted_at)}
        />
      </div>

      <div className="hidden w-24 sm:block">
        <p className="text-[11px] text-foreground/85">
          {formatNumber(product.stock_quantity)} units
        </p>
        <StockMeter
          stock={product.stock_quantity}
          stockThreshold={product.low_stock_threshold}
          className="mt-1"
        />
      </div>

      <div className="text-right">
        <ProductPrice
          currency={currency}
          price={Number(product.price)}
          originalPrice={
            product.original_price === null
              ? null
              : Number(product.original_price)
          }
        />
        {product.original_price !== null &&
        Number(product.original_price) > Number(product.price) ? (
          <DiscountBadge
            price={Number(product.price)}
            originalPrice={Number(product.original_price)}
          />
        ) : null}
      </div>

      <ProductActions
        productId={product.id}
        status={product.status}
        deleted={Boolean(product.deleted_at)}
        onEdit={() => onEdit?.(product)}
      />
    </div>
  );
}


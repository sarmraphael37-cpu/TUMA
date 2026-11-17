import Image from "next/image";
import Link from "next/link";

import type { StorefrontProduct } from "@/lib/db/storefront";
import { formatCurrency } from "@/lib/format";

/**
 * A product in the storefront grid.
 *
 * The tile links to the product page, where the quantity can be picked before
 * the product goes into the cart.
 */
export function ProductTile({
  product,
  currency,
  slug,
}: {
  product: StorefrontProduct;
  currency: string;
  slug: string;
}) {
  const cover = product.images[0] ?? null;
  const discounted =
    product.original_price !== null && product.original_price > product.price;
  const outOfStock = product.stock_quantity <= 0;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] transition-colors hover:border-white/[0.14]">
      <div className="relative aspect-[4/3] w-full overflow-hidden border-b border-white/[0.06] bg-white/[0.03]">
        {cover ? (
          <Image
            src={cover}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="grid size-full place-items-center">
            <span className="font-heading text-lg font-semibold text-muted-foreground/70">
              {product.name.slice(0, 2).toUpperCase()}
            </span>
          </div>
        )}

        {outOfStock ? (
          <span className="absolute inset-x-3 bottom-3 rounded-lg bg-navy-950/80 px-2 py-1 text-center text-[10.5px] font-medium text-rose-200 backdrop-blur">
            Sold out
          </span>
        ) : discounted ? (
          <span className="absolute left-3 top-3 rounded-full bg-mint-glow/90 px-2 py-0.5 text-[10px] font-semibold text-navy-950">
            {Math.round(
              ((product.original_price! - product.price) /
                product.original_price!) *
                100,
            )}
            % off
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        {product.category ? (
          <p className="text-[10px] font-medium tracking-[0.14em] text-cyan-glow/70 uppercase">
            {product.category}
          </p>
        ) : null}

        <h3 className="mt-1 line-clamp-2 text-[13px] leading-snug font-medium">
          <Link
            href={`/shop/${slug}/p/${product.id}`}
            className="hover:text-cyan-glow"
            data-product-name={product.name}
          >
            {product.name}
          </Link>
        </h3>

        {product.description ? (
          <p className="mt-1.5 line-clamp-2 text-[11.5px] leading-relaxed text-muted-foreground">
            {product.description}
          </p>
        ) : null}

        <div className="mt-auto flex items-baseline justify-between gap-2 pt-3">
          <p className="flex items-baseline gap-1.5">
            <span className="text-[13px] font-semibold">
              {formatCurrency(product.price, currency)}
            </span>
            {discounted ? (
              <span className="text-[10.5px] text-muted-foreground line-through">
                {formatCurrency(product.original_price!, currency)}
              </span>
            ) : null}
          </p>
          {!outOfStock ? (
            <span className="text-[10.5px] text-muted-foreground">
              {product.stock_quantity} in stock
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

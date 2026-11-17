import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Phone } from "lucide-react";

import { AddToCart } from "@/components/shop/add-to-cart";
import { getStorefrontBusiness, getStorefrontProduct } from "@/lib/db/storefront";
import { formatCurrency } from "@/lib/format";

type Props = {
  params: Promise<{ slug: string; productId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, productId } = await params;
  const business = await getStorefrontBusiness(slug);

  if (!business) {
    return { title: "Shop not found" };
  }

  const product = await getStorefrontProduct(business.id, productId);

  if (!product) {
    return { title: "Product not found" };
  }

  return {
    title: product.name,
    description: product.description ?? undefined,
    openGraph: {
      title: product.name,
      description: product.description ?? undefined,
      images: product.images[0] ? [product.images[0]] : undefined,
    },
  };
}

export default async function StorefrontProductPage({ params }: Props) {
  const { slug, productId } = await params;
  const business = await getStorefrontBusiness(slug);

  if (!business) {
    notFound();
  }

  const product = await getStorefrontProduct(business.id, productId);

  if (!product) {
    notFound();
  }

  const discounted =
    product.original_price !== null && product.original_price > product.price;

  return (
    <div className="space-y-6">
      <Link
        href={`/shop/${business.slug}`}
        className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Back to the catalogue
      </Link>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.03]">
            {product.images[0] ? (
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                priority
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover"
              />
            ) : (
              <div className="grid size-full place-items-center">
                <span className="font-heading text-3xl font-semibold text-muted-foreground/70">
                  {product.name.slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {product.images.length > 1 ? (
            <div className="flex flex-wrap gap-2">
              {product.images.slice(1, 5).map((image) => (
                <span
                  key={image}
                  className="relative size-16 overflow-hidden rounded-xl border border-white/[0.07]"
                >
                  <Image
                    src={image}
                    alt=""
                    width={64}
                    height={64}
                    className="size-full object-cover"
                  />
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col">
          {product.category ? (
            <p className="text-[10.5px] font-medium tracking-[0.16em] text-cyan-glow/70 uppercase">
              {product.category}
            </p>
          ) : null}

          <h1 className="mt-1.5 font-heading text-[1.6rem] leading-tight font-semibold tracking-[-0.03em]">
            {product.name}
          </h1>

          <p className="mt-3 flex items-baseline gap-2">
            <span className="font-heading text-[1.35rem] font-semibold">
              {formatCurrency(product.price, business.currency)}
            </span>
            {discounted ? (
              <span className="text-[12.5px] text-muted-foreground line-through">
                {formatCurrency(product.original_price!, business.currency)}
              </span>
            ) : null}
            {discounted ? (
              <span className="rounded-full bg-mint-glow/12 px-2 py-0.5 text-[10.5px] font-medium text-mint-glow">
                {Math.round(
                  ((product.original_price! - product.price) /
                    product.original_price!) *
                    100,
                )}
                % off
              </span>
            ) : null}
          </p>

          {product.description ? (
            <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          ) : null}

          <p className="mt-3 text-[11.5px] text-muted-foreground">
            {product.stock_quantity > 0
              ? `${product.stock_quantity} available`
              : "Currently sold out"}
          </p>

          <div className="mt-6">
            <AddToCart
              productId={product.id}
              name={product.name}
              price={Number(product.price)}
              currency={business.currency}
              image={product.images[0] ?? null}
              stock={product.stock_quantity}
            />
          </div>

          <dl className="mt-8 space-y-2 border-t border-white/[0.07] pt-4 text-[12px]">
            <div className="flex items-center gap-2">
              <Phone className="size-3.5 text-muted-foreground" aria-hidden />
              <dt className="sr-only">Shop phone</dt>
              <dd>
                <a
                  href={`tel:${business.phone.replace(/\s/g, "")}`}
                  className="text-foreground/85 hover:text-cyan-glow"
                >
                  {business.phone}
                </a>
              </dd>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="size-3.5 text-muted-foreground" aria-hidden />
              <dt className="sr-only">Shop location</dt>
              <dd className="text-foreground/85">{business.location}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}

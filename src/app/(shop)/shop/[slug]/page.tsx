import type { Metadata } from "next";
import { Suspense } from "react";
import { PackageSearch, Megaphone } from "lucide-react";

import { CatalogueControls } from "@/components/shop/catalogue-controls";
import { ProductTile } from "@/components/shop/product-tile";
import { QrCodeLink } from "@/components/qr-code";
import { getStorefrontBusiness, getStorefrontProducts } from "@/lib/db/storefront";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string; category?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const business = await getStorefrontBusiness(slug);

  if (!business) {
    return { title: "Shop not found" };
  }

  return {
    title: business.name,
    description:
      business.description ??
      `Browse the catalogue of ${business.name} and order directly from their shop.`,
    openGraph: {
      title: business.name,
      description: business.description ?? undefined,
      images: business.cover_image_url ? [business.cover_image_url] : undefined,
    },
  };
}

export default async function StorefrontPage({ params, searchParams }: Props) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);

  const business = await getStorefrontBusiness(slug);

  if (!business) {
    return null;
  }

  const products = await getStorefrontProducts(business.id);
  const categories = Array.from(
    new Set(
      products
        .map((product) => product.category)
        .filter((category): category is string => Boolean(category)),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const search = query.q?.trim().toLowerCase() ?? "";
  const category = query.category ?? "all";

  const visible = products.filter((product) => {
    if (category !== "all" && product.category !== category) {
      return false;
    }

    if (!search) {
      return true;
    }

    return (
      product.name.toLowerCase().includes(search) ||
      (product.description ?? "").toLowerCase().includes(search) ||
      (product.category ?? "").toLowerCase().includes(search)
    );
  });

  return (
    <div className="space-y-6">
      <Suspense fallback={<div className="h-16 animate-pulse rounded-xl bg-white/[0.03]" />}>
        <CatalogueControls
          slug={business.slug}
          categories={categories}
          total={visible.length}
        />
      </Suspense>

      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <QrCodeLink
          url={`http://localhost:3011/shop/${business.slug}`}
          size={280}
          qrSize={220}
          className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-2.5"
        />
        <a
          href={`/shop/${business.slug}`}
          target="_blank"
          rel="noreferrer"
          className="text-[11px] text-muted-foreground">
          <Megaphone className="size-3.5 align-middle" aria-hidden />
          Share storefront
        </a>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] px-5 py-12 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl border border-white/[0.08] bg-white/[0.03]">
            <PackageSearch className="size-5 text-muted-foreground" aria-hidden />
          </span>
          <h2 className="mt-3 font-heading text-[15px] font-semibold">
            {search || category !== "all"
              ? "Nothing matches that search"
              : "The catalogue is empty for now"}
          </h2>
          <p className="mx-auto mt-1.5 max-w-sm text-[12.5px] leading-relaxed text-muted-foreground">
            {search || category !== "all"
              ? "Try a different word or pick another category."
              : "This shop has not published any product yet. Check back soon."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((product) => (
            <ProductTile
              key={product.id}
              product={product}
              currency={business.currency}
              slug={business.slug}
            />
          ))}
        </div>
      )}
    </div>
  );
}

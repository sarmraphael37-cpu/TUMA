import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  Archive,
  Boxes,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Package,
  TriangleAlert,
} from "lucide-react";

import { Card } from "@/components/dashboard/cards/card";
import { CatalogueToolbar } from "@/components/dashboard/products/catalogue-toolbar";
import {
  ProductCatalogue,
  ProductCreateButton,
} from "@/components/dashboard/products/product-catalogue";
import { DashboardFrame } from "@/components/dashboard/shell/dashboard-frame";
import { EmptyState } from "@/components/dashboard/states/empty-state";
import { ErrorState } from "@/components/dashboard/states/error-state";
import { getOwnedBusiness } from "@/lib/auth/server";
import { getCatalogue } from "@/lib/db/products";
import { formatCurrency, formatNumber } from "@/lib/format";

export const metadata: Metadata = {
  title: "Products",
  description: "Manage your catalogue, pricing and inventory.",
};

type SearchParams = Promise<{
  q?: string;
  category?: string;
  status?: string;
  sort?: string;
  view?: string;
  page?: string;
  created?: string;
  updated?: string;
  deleted?: string;
  restored?: string;
  archived?: string;
  error?: string;
}>;

function PageFallback() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-white/[0.05]" />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-20 animate-pulse rounded-2xl border border-white/[0.05] bg-white/[0.02]"
          />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-2xl border border-white/[0.05] bg-white/[0.02]" />
    </div>
  );
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  const page = Math.max(Number(params.page ?? "1") || 1, 1);
  const view = params.view === "table" ? "table" : "grid";
  const status = (params.status ?? "all") as
    | "all"
    | "active"
    | "archived"
    | "deleted"
    | "low";

  const catalogue = await getCatalogue({
    query: params.q,
    category: params.category,
    status,
    sort: (params.sort ?? "recent") as never,
    page,
  });

  const business = await getOwnedBusiness();
  const currency = business?.currency ?? "XAF";
  const stats = catalogue.stats;

  const notices: { tone: "success" | "error"; message: string }[] = [];

  if (params.created) {
    notices.push({ tone: "success", message: "Product created and added to your catalogue." });
  }
  if (params.updated) {
    notices.push({ tone: "success", message: "Product updated." });
  }
  if (params.archived) {
    notices.push({ tone: "success", message: "Product archived." });
  }
  if (params.deleted) {
    notices.push({ tone: "success", message: "Product deleted." });
  }
  if (params.restored) {
    notices.push({ tone: "success", message: "Product restored." });
  }
  if (params.error) {
    notices.push({
      tone: "error",
      message: "That change could not be saved. Nothing was modified — please try again.",
    });
  }

  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.category) search.set("category", params.category);
  if (params.status && params.status !== "all") search.set("status", params.status);
  if (params.sort && params.sort !== "recent") search.set("sort", params.sort);
  if (params.view && params.view !== "grid") search.set("view", params.view);

  function pageLink(target: number) {
    const next = new URLSearchParams(search);
    next.set("page", String(target));
    return `/dashboard/products?${next.toString()}`;
  }

  return (
    <DashboardFrame>
      <div className="space-y-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0">
            <h1 className="font-heading text-[1.65rem] leading-tight font-semibold tracking-[-0.035em] sm:text-[1.9rem]">
              Products
            </h1>
            <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-muted-foreground">
              Your catalogue, pricing and stock levels. Everything here comes
              straight from your workspace.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ProductCreateButton
              capabilities={{
                images: catalogue.capabilities.images,
                originalPrice: catalogue.capabilities.originalPrice,
              }}
            />
          </div>
        </div>

        {notices.map((notice) => (
          <div
            key={notice.message}
            role="status"
            className={
              notice.tone === "success"
                ? "rounded-xl border border-mint-glow/20 bg-mint-glow/[0.07] px-3.5 py-3 text-[12px] text-mint-glow"
                : "rounded-xl border border-rose-400/20 bg-rose-400/[0.07] px-3.5 py-3 text-[12px] text-rose-200"
            }
          >
            {notice.message}
          </div>
        ))}

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <StatTile
            label="Active products"
            value={formatNumber(stats.active)}
            hint={`${formatNumber(stats.archived)} archived`}
            icon={Package}
            tone="brand"
          />
          <StatTile
            label="Catalogue value"
            value={formatCurrency(stats.inventoryValue, currency)}
            hint="Price × units in stock"
            icon={Boxes}
            tone="info"
          />
          <StatTile
            label="Low stock"
            value={formatNumber(stats.lowStock)}
            hint={
              stats.outOfStock > 0
                ? `${formatNumber(stats.outOfStock)} out of stock`
                : "At or below the alert level"
            }
            icon={TriangleAlert}
            tone={stats.lowStock > 0 ? "warning" : "success"}
          />
          <StatTile
            label="Average price"
            value={formatCurrency(stats.averagePrice, currency)}
            hint="Across active products"
            icon={Archive}
            tone="success"
          />
        </div>

        <Suspense fallback={<PageFallback />}>
          <CatalogueToolbar
            categories={catalogue.categories}
            total={catalogue.total}
            view={view}
            allowDeleted={catalogue.capabilities.softDelete}
          />
        </Suspense>

        {catalogue.errors.products ? (
          <ErrorState
            title="We could not load your catalogue"
            description={catalogue.errors.products}
          />
        ) : catalogue.products.length === 0 ? (
          <Card>
            <EmptyState
              icon={params.q ? <CircleAlert className="size-5" aria-hidden /> : <Package className="size-5" aria-hidden />}
              title={
                params.q
                  ? "No product matches that search"
                  : status === "deleted"
                    ? "Nothing in the bin"
                    : "Your catalogue is empty"
              }
              description={
                params.q
                  ? "Try a different name, SKU or clear the filters to see everything again."
                  : status === "deleted"
                    ? "Deleted products are kept for a while so your order history stays intact."
                    : 'Use "New product" above to add your first product and start tracking stock, pricing and sales.'
              }
              action={
                params.q ? null : (
                  <Link
                    href="/dashboard/products"
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 text-[11.5px] font-medium transition-colors hover:bg-white/[0.07]"
                  >
                    Show all products
                  </Link>
                )
              }
            />
          </Card>
        ) : (
          <>
            <ProductCatalogue
              products={catalogue.products}
              currency={currency}
              view={view}
              capabilities={{
                images: catalogue.capabilities.images,
                originalPrice: catalogue.capabilities.originalPrice,
              }}
            />

            {catalogue.pageCount > 1 ? (
              <div className="flex items-center justify-between gap-3 pt-1">
                <p className="text-[11px] text-muted-foreground">
                  Page {catalogue.page} of {catalogue.pageCount} ·{" "}
                  {formatNumber(catalogue.total)} product
                  {catalogue.total === 1 ? "" : "s"}
                </p>
                <div className="flex items-center gap-1.5">
                  <Link
                    href={pageLink(Math.max(1, catalogue.page - 1))}
                    aria-disabled={catalogue.page <= 1}
                    className={
                      catalogue.page <= 1
                        ? "pointer-events-none grid size-8 place-items-center rounded-lg border border-white/[0.07] text-muted-foreground/40"
                        : "grid size-8 place-items-center rounded-lg border border-white/[0.07] text-muted-foreground transition-colors hover:text-foreground"
                    }
                  >
                    <ChevronLeft className="size-4" aria-hidden />
                  </Link>
                  <Link
                    href={pageLink(Math.min(catalogue.pageCount, catalogue.page + 1))}
                    aria-disabled={catalogue.page >= catalogue.pageCount}
                    className={
                      catalogue.page >= catalogue.pageCount
                        ? "pointer-events-none grid size-8 place-items-center rounded-lg border border-white/[0.07] text-muted-foreground/40"
                        : "grid size-8 place-items-center rounded-lg border border-white/[0.07] text-muted-foreground transition-colors hover:text-foreground"
                    }
                  >
                    <ChevronRight className="size-4" aria-hidden />
                  </Link>
                </div>
              </div>
            ) : null}
          </>
        )}

        {stats.lowStock > 0 && status !== "low" ? (
          <p className="text-[11px] text-muted-foreground">
            <Link
              href="/dashboard/products?status=low"
              className="text-amber-glow underline-offset-2 hover:underline"
            >
              {formatNumber(stats.lowStock)} product
              {stats.lowStock === 1 ? "" : "s"} at or below the low-stock
              threshold
            </Link>{" "}
            need restocking.
          </p>
        ) : null}
      </div>
    </DashboardFrame>
  );
}

function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  icon: typeof Package;
  tone: "brand" | "info" | "success" | "warning";
}) {
  const tones = {
    brand: "bg-electric-500/12 text-electric-300 ring-electric-400/20",
    info: "bg-cyan-glow/12 text-cyan-glow ring-cyan-glow/20",
    success: "bg-mint-glow/12 text-mint-glow ring-mint-glow/20",
    warning: "bg-amber-glow/12 text-amber-glow ring-amber-glow/20",
  } as const;

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3.5 sm:p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10.5px] leading-tight font-medium text-muted-foreground">
          {label}
        </p>
        <span
          className={`grid size-7 shrink-0 place-items-center rounded-lg ring-1 ${tones[tone]}`}
        >
          <Icon className="size-3.5" aria-hidden />
        </span>
      </div>
      <p className="mt-2.5 font-heading text-[1.15rem] leading-none font-semibold tracking-[-0.03em] sm:text-[1.35rem]">
        {value}
      </p>
      <p className="mt-1.5 truncate text-[10px] text-muted-foreground">{hint}</p>
    </div>
  );
}


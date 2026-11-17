import type { Metadata } from "next";
import { ChevronLeft, ChevronRight, Package } from "lucide-react";

import { Card } from "@/components/dashboard/cards/card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { AdminFrame } from "@/components/admin/admin-frame";
import { EmptyState } from "@/components/dashboard/states/empty-state";
import { ErrorState } from "@/components/dashboard/states/error-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAdminProducts } from "@/lib/admin/queries";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/format";

export const metadata: Metadata = {
  title: "Products",
  description: "Catalogue across the platform.",
};

type SearchParams = Promise<{ q?: string; status?: string; page?: string }>;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const page = Math.max(Number(params.page ?? "1") || 1, 1);
  const result = await getAdminProducts({
    query: params.q,
    status: params.status,
    page,
  });

  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.status && params.status !== "all") query.set("status", params.status);

  function pageLink(target: number) {
    const next = new URLSearchParams(query);
    next.set("page", String(target));
    return `/admin/products?${next.toString()}`;
  }

  return (
    <AdminFrame>
      <div className="space-y-5">
        <div>
          <h1 className="font-heading text-[1.65rem] leading-tight font-semibold tracking-[-0.035em] sm:text-[1.9rem]">
            Products
          </h1>
          <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-muted-foreground">
            Every product across every merchant. {formatNumber(result.total)} total.
          </p>
        </div>

        <Card bodyClassName="p-3">
          <form action="/admin/products" method="get" className="flex flex-wrap items-center gap-2">
            <input
              type="search"
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Search by name or SKU"
              className="h-9 flex-1 min-w-[200px] rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 text-[12px] outline-none focus:border-white/[0.14]"
            />
            <select
              name="status"
              defaultValue={params.status ?? "all"}
              className="h-9 rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 text-[12px]"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
              <option value="deleted">Deleted</option>
            </select>
            <button
              type="submit"
              className="h-9 rounded-lg border border-white/[0.09] bg-white/[0.04] px-3 text-[11.5px] font-medium"
            >
              Filter
            </button>
          </form>
        </Card>

        {result.error ? (
          <ErrorState title="We could not load products" description={result.error} />
        ) : result.products.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Package className="size-5" aria-hidden />}
              title="No products match"
              description="Try a different search or filter."
            />
          </Card>
        ) : (
          <>
            <Card bodyClassName="p-0">
              <div className="overflow-x-auto">
                <Table className="text-[11.5px]">
                  <TableHeader>
                    <TableRow className="border-white/[0.06] hover:bg-transparent">
                      <TableHead className="h-9 pl-4 text-[10px] text-muted-foreground">Product</TableHead>
                      <TableHead className="h-9 text-[10px] text-muted-foreground">Merchant</TableHead>
                      <TableHead className="h-9 text-[10px] text-muted-foreground">Price</TableHead>
                      <TableHead className="h-9 text-[10px] text-muted-foreground">Stock</TableHead>
                      <TableHead className="h-9 text-[10px] text-muted-foreground">Status</TableHead>
                      <TableHead className="h-9 text-[10px] text-muted-foreground">Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.products.map((product) => (
                      <TableRow key={product.id} className="border-white/[0.05] hover:bg-white/[0.02]">
                        <TableCell className="py-2.5 pl-4">
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground/90">{product.name}</p>
                            <p className="truncate text-[10px] text-muted-foreground">{product.sku}</p>
                          </div>
                        </TableCell>
                        <TableCell className="py-2.5 text-muted-foreground">
                          {product.business?.name ?? "—"}
                        </TableCell>
                        <TableCell className="py-2.5 whitespace-nowrap text-foreground/85">
                          {formatCurrency(product.price, "XAF")}
                        </TableCell>
                        <TableCell className="py-2.5 text-muted-foreground">
                          {formatNumber(product.stockQuantity)}
                        </TableCell>
                        <TableCell className="py-2.5">
                          <StatusBadge
                            tone={
                              product.deletedAt
                                ? "neutral"
                                : product.status === "active"
                                  ? "success"
                                  : "warning"
                            }
                          >
                            {product.deletedAt ? "deleted" : product.status}
                          </StatusBadge>
                        </TableCell>
                        <TableCell className="py-2.5 whitespace-nowrap text-muted-foreground">
                          {formatDateTime(product.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>

            {result.pageCount > 1 ? (
              <div className="flex items-center justify-between gap-3 pt-1">
                <p className="text-[11px] text-muted-foreground">
                  Page {result.page} of {result.pageCount} · {formatNumber(result.total)} products
                </p>
                <div className="flex items-center gap-1.5">
                  <a
                    href={pageLink(Math.max(1, result.page - 1))}
                    className={
                      result.page <= 1
                        ? "pointer-events-none grid size-8 place-items-center rounded-lg border border-white/[0.07] text-muted-foreground/40"
                        : "grid size-8 place-items-center rounded-lg border border-white/[0.07] text-muted-foreground transition-colors hover:text-foreground"
                    }
                  >
                    <ChevronLeft className="size-4" aria-hidden />
                  </a>
                  <a
                    href={pageLink(Math.min(result.pageCount, result.page + 1))}
                    className={
                      result.page >= result.pageCount
                        ? "pointer-events-none grid size-8 place-items-center rounded-lg border border-white/[0.07] text-muted-foreground/40"
                        : "grid size-8 place-items-center rounded-lg border border-white/[0.07] text-muted-foreground transition-colors hover:text-foreground"
                    }
                  >
                    <ChevronRight className="size-4" aria-hidden />
                  </a>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </AdminFrame>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Store,
} from "lucide-react";

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
import { getAdminMerchants } from "@/lib/admin/queries";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { setBusinessStatusAction } from "../actions";

export const metadata: Metadata = {
  title: "Merchants",
  description: "Every business on the platform.",
};

type SearchParams = Promise<{
  q?: string;
  status?: string;
  page?: string;
}>;

export default async function AdminMerchantsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const page = Math.max(Number(params.page ?? "1") || 1, 1);
  const result = await getAdminMerchants({
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
    return `/admin/merchants?${next.toString()}`;
  }

  return (
    <AdminFrame>
      <div className="space-y-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h1 className="font-heading text-[1.65rem] leading-tight font-semibold tracking-[-0.035em] sm:text-[1.9rem]">
              Merchants
            </h1>
            <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-muted-foreground">
              Every business registered on TUMA, with its owner, plan and
              moderation state. {formatNumber(result.total)} total.
            </p>
          </div>
        </div>

        <Card bodyClassName="p-3">
          <form action="/admin/merchants" method="get" className="flex flex-wrap items-center gap-2">
            <input
              type="search"
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Search by name or slug"
              className="h-9 flex-1 min-w-[200px] rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 text-[12px] outline-none focus:border-white/[0.14]"
            />
            <select
              name="status"
              defaultValue={params.status ?? "all"}
              className="h-9 rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 text-[12px]"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="pending_review">Pending review</option>
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
          <ErrorState title="We could not load merchants" description={result.error} />
        ) : result.merchants.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Store className="size-5" aria-hidden />}
              title="No merchants match"
              description="Try a different search or clear the filters."
            />
          </Card>
        ) : (
          <>
            <Card bodyClassName="p-0">
              <div className="overflow-x-auto">
                <Table className="text-[11.5px]">
                  <TableHeader>
                    <TableRow className="border-white/[0.06] hover:bg-transparent">
                      <TableHead className="h-9 pl-4 text-[10px] text-muted-foreground">Business</TableHead>
                      <TableHead className="h-9 text-[10px] text-muted-foreground">Owner</TableHead>
                      <TableHead className="h-9 text-[10px] text-muted-foreground">Plan</TableHead>
                      <TableHead className="h-9 text-[10px] text-muted-foreground">Catalogue</TableHead>
                      <TableHead className="h-9 text-[10px] text-muted-foreground">Status</TableHead>
                      <TableHead className="h-9 text-[10px] text-muted-foreground">Created</TableHead>
                      <TableHead className="h-9 text-[10px] text-muted-foreground">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.merchants.map((merchant) => (
                      <TableRow key={merchant.id} className="border-white/[0.05] hover:bg-white/[0.02]">
                        <TableCell className="py-2.5 pl-4">
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground/90">{merchant.name}</p>
                            <p className="truncate text-[10px] text-muted-foreground">@{merchant.slug}</p>
                          </div>
                        </TableCell>
                        <TableCell className="py-2.5">
                          <div className="min-w-0">
                            <p className="truncate text-foreground/85">
                              {merchant.owner?.fullName ?? "—"}
                            </p>
                            <p className="truncate text-[10px] text-muted-foreground">
                              {merchant.owner?.email ?? "—"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="py-2.5">
                          {merchant.subscription ? (
                            <div>
                              <StatusBadge tone="info">
                                {merchant.subscription.plan}
                              </StatusBadge>
                              <p className="mt-0.5 text-[10px] text-muted-foreground">
                                {formatCurrency(merchant.subscription.price, merchant.subscription.currency)}
                              </p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="py-2.5 text-muted-foreground">
                          {formatNumber(merchant.productCount)} products ·{" "}
                          {formatNumber(merchant.orderCount)} orders
                        </TableCell>
                        <TableCell className="py-2.5">
                          <StatusBadge
                            tone={
                              merchant.adminStatus === "active"
                                ? "success"
                                : merchant.adminStatus === "suspended"
                                  ? "danger"
                                  : "warning"
                            }
                          >
                            {merchant.adminStatus}
                          </StatusBadge>
                          {merchant.suspendedReason ? (
                            <p className="mt-0.5 max-w-[180px] truncate text-[9.5px] text-muted-foreground">
                              {merchant.suspendedReason}
                            </p>
                          ) : null}
                        </TableCell>
                        <TableCell className="py-2.5 whitespace-nowrap text-muted-foreground">
                          {formatDate(merchant.createdAt)}
                        </TableCell>
                        <TableCell className="py-2.5">
                          <form action={setBusinessStatusAction} className="flex items-center gap-1.5">
                            <input type="hidden" name="businessId" value={merchant.id} />
                            <select
                              name="status"
                              defaultValue={merchant.adminStatus}
                              className="h-7 rounded-md border border-white/[0.07] bg-white/[0.025] px-1.5 text-[10.5px]"
                            >
                              <option value="active">Active</option>
                              <option value="suspended">Suspended</option>
                              <option value="pending_review">Pending review</option>
                            </select>
                            <input
                              type="text"
                              name="reason"
                              placeholder="Reason"
                              className="h-7 w-24 rounded-md border border-white/[0.07] bg-white/[0.025] px-1.5 text-[10.5px]"
                            />
                            <button
                              type="submit"
                              className="h-7 rounded-md border border-white/[0.09] bg-white/[0.04] px-2 text-[10.5px] font-medium"
                            >
                              Apply
                            </button>
                          </form>
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
                  Page {result.page} of {result.pageCount} · {formatNumber(result.total)} merchants
                </p>
                <div className="flex items-center gap-1.5">
                  <Link
                    href={pageLink(Math.max(1, result.page - 1))}
                    aria-disabled={result.page <= 1}
                    className={
                      result.page <= 1
                        ? "pointer-events-none grid size-8 place-items-center rounded-lg border border-white/[0.07] text-muted-foreground/40"
                        : "grid size-8 place-items-center rounded-lg border border-white/[0.07] text-muted-foreground transition-colors hover:text-foreground"
                    }
                  >
                    <ChevronLeft className="size-4" aria-hidden />
                  </Link>
                  <Link
                    href={pageLink(Math.min(result.pageCount, result.page + 1))}
                    aria-disabled={result.page >= result.pageCount}
                    className={
                      result.page >= result.pageCount
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
      </div>
    </AdminFrame>
  );
}

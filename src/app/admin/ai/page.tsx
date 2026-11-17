import type { Metadata } from "next";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

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
import { getAdminAiGenerations, getPlatformOverview } from "@/lib/admin/queries";
import { formatDateTime, formatNumber } from "@/lib/format";

export const metadata: Metadata = {
  title: "AI usage",
  description: "Generations, tokens and failures across the platform.",
};

type SearchParams = Promise<{
  q?: string;
  status?: string;
  kind?: string;
  page?: string;
}>;

export default async function AdminAiPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const page = Math.max(Number(params.page ?? "1") || 1, 1);
  const result = await getAdminAiGenerations({
    query: params.q,
    status: params.status,
    kind: params.kind,
    page,
  });

  const overview = await getPlatformOverview(
    (await import("@/lib/db/ranges")).resolveDashboardRange({ range: "30d" }),
  );
  const ai = overview.aiUsage;

  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.status && params.status !== "all") query.set("status", params.status);
  if (params.kind && params.kind !== "all") query.set("kind", params.kind);

  function pageLink(target: number) {
    const next = new URLSearchParams(query);
    next.set("page", String(target));
    return `/admin/ai?${next.toString()}`;
  }

  return (
    <AdminFrame>
      <div className="space-y-5">
        <div>
          <h1 className="font-heading text-[1.65rem] leading-tight font-semibold tracking-[-0.035em] sm:text-[1.9rem]">
            AI usage
          </h1>
          <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-muted-foreground">
            Generations, tokens and failures across every merchant workspace.{" "}
            {formatNumber(result.total)} total.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Card bodyClassName="p-4">
            <p className="text-[10.5px] text-muted-foreground">Generations</p>
            <p className="mt-1.5 font-heading text-[1.2rem] font-semibold">
              {formatNumber(Number(ai.total ?? 0))}
            </p>
          </Card>
          <Card bodyClassName="p-4">
            <p className="text-[10.5px] text-muted-foreground">Tokens</p>
            <p className="mt-1.5 font-heading text-[1.2rem] font-semibold">
              {formatNumber(Number(ai.tokens ?? 0))}
            </p>
          </Card>
          <Card bodyClassName="p-4">
            <p className="text-[10.5px] text-muted-foreground">Completed</p>
            <p className="mt-1.5 font-heading text-[1.2rem] font-semibold">
              {formatNumber(Number(ai.completed ?? 0))}
            </p>
          </Card>
          <Card bodyClassName="p-4">
            <p className="text-[10.5px] text-muted-foreground">Failed</p>
            <p className="mt-1.5 font-heading text-[1.2rem] font-semibold">
              {formatNumber(Number(ai.failed ?? 0))}
            </p>
          </Card>
        </div>

        <Card bodyClassName="p-3">
          <form action="/admin/ai" method="get" className="flex flex-wrap items-center gap-2">
            <input
              type="search"
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Search prompt, merchant or user"
              className="h-9 flex-1 min-w-[200px] rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 text-[12px] outline-none focus:border-white/[0.14]"
            />
            <select
              name="status"
              defaultValue={params.status ?? "all"}
              className="h-9 rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 text-[12px]"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
            <select
              name="kind"
              defaultValue={params.kind ?? "all"}
              className="h-9 rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 text-[12px]"
            >
              <option value="all">All kinds</option>
              <option value="insight">Insight</option>
              <option value="marketing">Marketing</option>
              <option value="product_copy">Product copy</option>
              <option value="assistant">Assistant</option>
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
          <ErrorState title="We could not load AI usage" description={result.error} />
        ) : result.generations.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Sparkles className="size-5" aria-hidden />}
              title="No generations match"
              description="AI requests appear here once merchants use TUMA AI."
            />
          </Card>
        ) : (
          <>
            <Card bodyClassName="p-0">
              <div className="overflow-x-auto">
                <Table className="text-[11.5px]">
                  <TableHeader>
                    <TableRow className="border-white/[0.06] hover:bg-transparent">
                      <TableHead className="h-9 pl-4 text-[10px] text-muted-foreground">Kind</TableHead>
                      <TableHead className="h-9 text-[10px] text-muted-foreground">Merchant</TableHead>
                      <TableHead className="h-9 text-[10px] text-muted-foreground">User</TableHead>
                      <TableHead className="h-9 text-[10px] text-muted-foreground">Prompt</TableHead>
                      <TableHead className="h-9 text-[10px] text-muted-foreground">Tokens</TableHead>
                      <TableHead className="h-9 text-[10px] text-muted-foreground">Status</TableHead>
                      <TableHead className="h-9 text-[10px] text-muted-foreground">Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.generations.map((generation) => (
                      <TableRow key={generation.id} className="border-white/[0.05] hover:bg-white/[0.02]">
                        <TableCell className="py-2.5 pl-4">
                          <StatusBadge tone="info">{generation.kind}</StatusBadge>
                        </TableCell>
                        <TableCell className="py-2.5 text-muted-foreground">
                          {generation.business?.name ?? "—"}
                        </TableCell>
                        <TableCell className="py-2.5 text-muted-foreground">
                          {generation.user?.email ?? "—"}
                        </TableCell>
                        <TableCell className="py-2.5 max-w-[260px]">
                          <span className="block truncate text-foreground/85">
                            {generation.prompt}
                          </span>
                        </TableCell>
                        <TableCell className="py-2.5 text-muted-foreground">
                          {formatNumber(generation.tokensUsed)}
                        </TableCell>
                        <TableCell className="py-2.5">
                          <StatusBadge
                            tone={
                              generation.status === "completed"
                                ? "success"
                                : generation.status === "failed"
                                  ? "danger"
                                  : "warning"
                            }
                          >
                            {generation.status}
                          </StatusBadge>
                        </TableCell>
                        <TableCell className="py-2.5 whitespace-nowrap text-muted-foreground">
                          {formatDateTime(generation.createdAt)}
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
                Page {result.page} of {result.pageCount} · {formatNumber(result.total)} generations
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

import type { Metadata } from "next";
import { ChevronLeft, ChevronRight, ScrollText } from "lucide-react";

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
import { getAdminAuditLog } from "@/lib/admin/queries";
import { formatDateTime, formatNumber } from "@/lib/format";

export const metadata: Metadata = {
  title: "Audit log",
  description: "Sensitive administrative actions.",
};

type SearchParams = Promise<{ action?: string; entityType?: string; page?: string }>;

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const page = Math.max(Number(params.page ?? "1") || 1, 1);
  const result = await getAdminAuditLog({
    action: params.action,
    entityType: params.entityType,
    page,
  });

  const query = new URLSearchParams();
  if (params.action && params.action !== "all") query.set("action", params.action);
  if (params.entityType && params.entityType !== "all") query.set("entityType", params.entityType);

  function pageLink(target: number) {
    const next = new URLSearchParams(query);
    next.set("page", String(target));
    return `/admin/audit?${next.toString()}`;
  }

  return (
    <AdminFrame>
      <div className="space-y-5">
        <div>
          <h1 className="font-heading text-[1.65rem] leading-tight font-semibold tracking-[-0.035em] sm:text-[1.9rem]">
            Audit log
          </h1>
          <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-muted-foreground">
            Every sensitive action taken by platform staff. {formatNumber(result.total)} entries.
          </p>
        </div>

        <Card bodyClassName="p-3">
          <form action="/admin/audit" method="get" className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              name="action"
              defaultValue={params.action && params.action !== "all" ? params.action : ""}
              placeholder="Action (e.g. business_status_changed)"
              className="h-9 flex-1 min-w-[200px] rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 text-[12px] outline-none focus:border-white/[0.14]"
            />
            <input
              type="text"
              name="entityType"
              defaultValue={params.entityType && params.entityType !== "all" ? params.entityType : ""}
              placeholder="Entity type (e.g. business)"
              className="h-9 flex-1 min-w-[200px] rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 text-[12px] outline-none focus:border-white/[0.14]"
            />
            <button
              type="submit"
              className="h-9 rounded-lg border border-white/[0.09] bg-white/[0.04] px-3 text-[11.5px] font-medium"
            >
              Filter
            </button>
          </form>
        </Card>

        {result.error ? (
          <ErrorState title="We could not load the audit log" description={result.error} />
        ) : result.entries.length === 0 ? (
          <Card>
            <EmptyState
              icon={<ScrollText className="size-5" aria-hidden />}
              title="No audit entries match"
              description="Sensitive admin actions appear here."
            />
          </Card>
        ) : (
          <>
            <Card bodyClassName="p-0">
              <div className="overflow-x-auto">
                <Table className="text-[11.5px]">
                  <TableHeader>
                    <TableRow className="border-white/[0.06] hover:bg-transparent">
                      <TableHead className="h-9 pl-4 text-[10px] text-muted-foreground">When</TableHead>
                      <TableHead className="h-9 text-[10px] text-muted-foreground">Actor</TableHead>
                      <TableHead className="h-9 text-[10px] text-muted-foreground">Action</TableHead>
                      <TableHead className="h-9 text-[10px] text-muted-foreground">Entity</TableHead>
                      <TableHead className="h-9 text-[10px] text-muted-foreground">Target</TableHead>
                      <TableHead className="h-9 text-[10px] text-muted-foreground">Metadata</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.entries.map((entry) => (
                      <TableRow key={entry.id} className="border-white/[0.05] hover:bg-white/[0.02]">
                        <TableCell className="py-2.5 pl-4 whitespace-nowrap text-muted-foreground">
                          {formatDateTime(entry.createdAt)}
                        </TableCell>
                        <TableCell className="py-2.5 text-foreground/85">
                          {entry.actorEmail ?? "—"}
                        </TableCell>
                        <TableCell className="py-2.5">
                          <StatusBadge tone="brand">{entry.action}</StatusBadge>
                        </TableCell>
                        <TableCell className="py-2.5 text-muted-foreground">
                          {entry.entityType ?? "—"}
                          {entry.entityId ? (
                            <span className="block text-[9.5px] text-muted-foreground/70">
                              {entry.entityId}
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell className="py-2.5 text-muted-foreground">
                          {entry.targetType ?? "—"}
                          {entry.targetId ? (
                            <span className="block text-[9.5px] text-muted-foreground/70">
                              {entry.targetId}
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell className="py-2.5 max-w-[260px]">
                          <span className="block truncate text-[10px] text-muted-foreground">
                            {Object.keys(entry.metadata).length
                              ? JSON.stringify(entry.metadata)
                              : "—"}
                          </span>
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
                  Page {result.page} of {result.pageCount} · {formatNumber(result.total)} entries
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

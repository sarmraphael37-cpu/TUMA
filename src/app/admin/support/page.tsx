import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, LifeBuoy } from "lucide-react";

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
import { getAdminTickets } from "@/lib/admin/queries";
import { formatDateTime, formatNumber } from "@/lib/format";

export const metadata: Metadata = {
  title: "Support",
  description: "Merchant support tickets.",
};

type SearchParams = Promise<{ status?: string; priority?: string }>;

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const result = await getAdminTickets({
    status: params.status,
    priority: params.priority,
  });

  return (
    <AdminFrame>
      <div className="space-y-5">
        <div>
          <h1 className="font-heading text-[1.65rem] leading-tight font-semibold tracking-[-0.035em] sm:text-[1.9rem]">
            Support tickets
          </h1>
          <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-muted-foreground">
            Every ticket opened by a merchant. {formatNumber(result.total)} total.
          </p>
        </div>

        <Card bodyClassName="p-3">
          <form action="/admin/support" method="get" className="flex flex-wrap items-center gap-2">
            <select
              name="status"
              defaultValue={params.status ?? "all"}
              className="h-9 rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 text-[12px]"
            >
              <option value="all">All statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In progress</option>
              <option value="waiting_on_customer">Waiting on customer</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <select
              name="priority"
              defaultValue={params.priority ?? "all"}
              className="h-9 rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 text-[12px]"
            >
              <option value="all">All priorities</option>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
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
          <ErrorState title="We could not load tickets" description={result.error} />
        ) : result.tickets.length === 0 ? (
          <Card>
            <EmptyState
              icon={<LifeBuoy className="size-5" aria-hidden />}
              title="No tickets match"
              description="Tickets opened by merchants appear here."
            />
          </Card>
        ) : (
          <Card bodyClassName="p-0">
            <div className="overflow-x-auto">
              <Table className="text-[11.5px]">
                <TableHeader>
                  <TableRow className="border-white/[0.06] hover:bg-transparent">
                    <TableHead className="h-9 pl-4 text-[10px] text-muted-foreground">Subject</TableHead>
                    <TableHead className="h-9 text-[10px] text-muted-foreground">Merchant</TableHead>
                    <TableHead className="h-9 text-[10px] text-muted-foreground">Category</TableHead>
                    <TableHead className="h-9 text-[10px] text-muted-foreground">Priority</TableHead>
                    <TableHead className="h-9 text-[10px] text-muted-foreground">Status</TableHead>
                    <TableHead className="h-9 text-[10px] text-muted-foreground">Last message</TableHead>
                    <TableHead className="h-9 w-8 pr-4" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.tickets.map((ticket) => (
                    <TableRow key={ticket.id} className="border-white/[0.05] hover:bg-white/[0.02]">
                      <TableCell className="py-2.5 pl-4">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground/90">
                            {ticket.subject}
                          </p>
                          <p className="truncate text-[10px] text-muted-foreground">
                            {ticket.messageCount} messages
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="py-2.5 text-muted-foreground">
                        {ticket.business?.name ?? "—"}
                      </TableCell>
                      <TableCell className="py-2.5 text-muted-foreground">
                        {ticket.category}
                      </TableCell>
                      <TableCell className="py-2.5">
                        <StatusBadge
                          tone={
                            ticket.priority === "urgent"
                              ? "danger"
                              : ticket.priority === "high"
                                ? "warning"
                                : "neutral"
                          }
                        >
                          {ticket.priority}
                        </StatusBadge>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <StatusBadge
                          tone={
                            ticket.status === "resolved" || ticket.status === "closed"
                              ? "success"
                              : ticket.status === "in_progress"
                                ? "brand"
                                : "warning"
                          }
                        >
                          {ticket.status.replace(/_/g, " ")}
                        </StatusBadge>
                      </TableCell>
                      <TableCell className="py-2.5 whitespace-nowrap text-muted-foreground">
                        {ticket.lastMessageAt
                          ? formatDateTime(ticket.lastMessageAt)
                          : formatDateTime(ticket.createdAt)}
                      </TableCell>
                      <TableCell className="py-2.5 pr-4 text-right">
                        <Link
                          href={`/admin/support/${ticket.id}`}
                          aria-label={`Open ticket ${ticket.subject}`}
                          className="inline-grid size-7 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground"
                        >
                          <ChevronRight className="size-4" aria-hidden />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </div>
    </AdminFrame>
  );
}

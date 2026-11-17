import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Card } from "@/components/dashboard/cards/card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { AdminFrame } from "@/components/admin/admin-frame";
import { ErrorState } from "@/components/dashboard/states/error-state";
import { getAdminTicket } from "@/lib/admin/queries";
import { formatDateTime } from "@/lib/format";
import { replyTicketAction, setTicketStatusAction, deleteTicketAction } from "../../actions";

export const metadata: Metadata = {
  title: "Ticket",
  description: "Support ticket detail.",
};

type Params = Promise<{ id: string }>;

export default async function AdminSupportDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const result = await getAdminTicket(id);

  if (result.error || !result.ticket) {
    return (
      <AdminFrame>
        <ErrorState
          title="We could not load this ticket"
          description={result.error ?? "Ticket not found."}
        />
      </AdminFrame>
    );
  }

  const ticket = result.ticket;

  return (
    <AdminFrame>
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/support"
            className="inline-grid size-8 place-items-center rounded-lg border border-white/[0.07] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden />
          </Link>
          <div className="min-w-0">
            <h1 className="font-heading text-[1.4rem] leading-tight font-semibold tracking-[-0.035em]">
              {ticket.subject}
            </h1>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">
              {ticket.business?.name ?? "Unknown business"} · opened{" "}
              {formatDateTime(ticket.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone="info">{ticket.category}</StatusBadge>
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
          {ticket.requester ? (
            <span className="text-[10.5px] text-muted-foreground">
              {ticket.requester.fullName} · {ticket.requester.email}
            </span>
          ) : null}
        </div>

        <Card title="Conversation">
          <div className="space-y-3">
            {result.messages.length === 0 ? (
              <p className="text-[12px] text-muted-foreground">No messages yet.</p>
            ) : (
              result.messages.map((message) => (
                <div
                  key={message.id}
                  className={
                    message.authorType === "admin"
                      ? "rounded-xl border border-electric-400/20 bg-electric-400/[0.05] p-3"
                      : "rounded-xl border border-white/[0.07] bg-white/[0.02] p-3"
                  }
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium text-foreground/90">
                      {message.authorName}
                      <span className="ml-2 text-[9.5px] uppercase tracking-wide text-muted-foreground">
                        {message.authorType}
                      </span>
                    </span>
                    <span className="text-[9.5px] text-muted-foreground">
                      {formatDateTime(message.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap text-[12.5px] leading-relaxed text-foreground/85">
                    {message.body}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card title="Reply">
          <form action={replyTicketAction} className="space-y-3">
            <input type="hidden" name="ticketId" value={ticket.id} />
            <textarea
              name="message"
              required
              rows={4}
              placeholder="Write a reply to the merchant"
              className="w-full rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 py-2 text-[12px] outline-none focus:border-white/[0.14]"
            />
            <div className="flex flex-wrap items-center gap-2">
              <select
                name="status"
                defaultValue={ticket.status}
                className="h-9 rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 text-[12px]"
              >
                <option value="open">Open</option>
                <option value="in_progress">In progress</option>
                <option value="waiting_on_customer">Waiting on customer</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              <button
                type="submit"
                className="h-9 rounded-lg border border-white/[0.09] bg-white/[0.04] px-3 text-[11.5px] font-medium"
              >
                Send reply
              </button>
            </div>
          </form>
        </Card>

        <div className="flex flex-wrap items-center gap-2">
          <form action={setTicketStatusAction}>
            <input type="hidden" name="ticketId" value={ticket.id} />
            <input type="hidden" name="status" value="resolved" />
            <button
              type="submit"
              className="h-8 rounded-lg border border-mint-glow/20 bg-mint-glow/[0.06] px-3 text-[11.5px] font-medium text-mint-glow"
            >
              Mark resolved
            </button>
          </form>
          <form action={deleteTicketAction}>
            <input type="hidden" name="ticketId" value={ticket.id} />
            <button
              type="submit"
              className="h-8 rounded-lg border border-rose-400/20 bg-rose-400/[0.06] px-3 text-[11.5px] font-medium text-rose-300"
            >
              Delete ticket
            </button>
          </form>
        </div>
      </div>
    </AdminFrame>
  );
}

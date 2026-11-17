import type { Metadata } from "next";
import { LifeBuoy } from "lucide-react";

import { Card } from "@/components/dashboard/cards/card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { DashboardFrame } from "@/components/dashboard/shell/dashboard-frame";
import { EmptyState } from "@/components/dashboard/states/empty-state";
import { ErrorState } from "@/components/dashboard/states/error-state";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getPublicPlatformSettings } from "@/lib/admin/settings";
import { formatDateTime } from "@/lib/format";
import { createTicketAction, replyTicketAction } from "./actions";

export const metadata: Metadata = {
  title: "Support",
  description: "Get help from the TUMA team.",
};

export default async function MerchantSupportPage() {
  const supabase = await getSupabaseServerClient();
  const settings = await getPublicPlatformSettings();

  let tickets: Array<{
    id: string;
    subject: string;
    category: string;
    priority: string;
    status: string;
    created_at: string;
    support_ticket_messages: Array<{
      id: string;
      author_type: string;
      body: string;
      created_at: string;
    }>;
  }> = [];
  let error: string | null = null;

  try {
    const { data, error: queryError } = await supabase
      .from("support_tickets")
      .select(
        "id, subject, category, priority, status, created_at, support_ticket_messages(id, author_type, body, created_at)",
      )
      .order("created_at", { ascending: false });

    if (queryError) {
      error = queryError.message;
    } else {
      tickets = (data ?? []) as typeof tickets;
    }
  } catch (caught) {
    error = caught instanceof Error ? caught.message : "Unknown error";
  }

  return (
    <DashboardFrame>
      <div className="space-y-5">
        <div>
          <h1 className="font-heading text-[1.65rem] leading-tight font-semibold tracking-[-0.035em] sm:text-[1.9rem]">
            Support
          </h1>
          <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-muted-foreground">
            Open a ticket and the TUMA team will reply here.
            {settings.supportEmail ? (
              <>
                {" "}
                You can also email{" "}
                <a
                  href={`mailto:${settings.supportEmail}`}
                  className="text-cyan-glow hover:underline"
                >
                  {settings.supportEmail}
                </a>
                .
              </>
            ) : null}
          </p>
        </div>

        <Card title="Open a new ticket">
          <form action={createTicketAction} className="grid gap-3">
            <input
              type="text"
              name="subject"
              placeholder="Subject"
              required
              className="h-9 rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 text-[12px] outline-none focus:border-white/[0.14]"
            />
            <div className="flex flex-wrap items-center gap-2">
              <select
                name="category"
                defaultValue="general"
                className="h-9 rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 text-[12px]"
              >
                <option value="general">General</option>
                <option value="orders">Orders</option>
                <option value="payments">Payments</option>
                <option value="storefront">Storefront</option>
                <option value="billing">Billing</option>
                <option value="technical">Technical</option>
                <option value="other">Other</option>
              </select>
              <select
                name="priority"
                defaultValue="normal"
                className="h-9 rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 text-[12px]"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <textarea
              name="message"
              required
              rows={4}
              placeholder="Describe your issue"
              className="rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 py-2 text-[12px] outline-none focus:border-white/[0.14]"
            />
            <button
              type="submit"
              className="h-9 w-fit rounded-lg border border-white/[0.09] bg-white/[0.04] px-3 text-[11.5px] font-medium"
            >
              Open ticket
            </button>
          </form>
        </Card>

        {error ? (
          <ErrorState title="We could not load your tickets" description={error} />
        ) : tickets.length === 0 ? (
          <Card>
            <EmptyState
              icon={<LifeBuoy className="size-5" aria-hidden />}
              title="No tickets yet"
              description="Open a ticket above and the TUMA team will reply here."
            />
          </Card>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <Card key={ticket.id} title={ticket.subject}>
                <div className="space-y-3">
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
                    <span className="text-[10.5px] text-muted-foreground">
                      {formatDateTime(ticket.created_at)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {(ticket.support_ticket_messages ?? [])
                      .sort(
                        (a, b) =>
                          new Date(a.created_at).getTime() -
                          new Date(b.created_at).getTime(),
                      )
                      .map((message) => (
                        <div
                          key={message.id}
                          className={
                            message.author_type === "admin"
                              ? "rounded-xl border border-electric-400/20 bg-electric-400/[0.05] p-3"
                              : "rounded-xl border border-white/[0.07] bg-white/[0.02] p-3"
                          }
                        >
                          <span className="text-[9.5px] uppercase tracking-wide text-muted-foreground">
                            {message.author_type}
                          </span>
                          <p className="mt-1 whitespace-pre-wrap text-[12.5px] leading-relaxed text-foreground/85">
                            {message.body}
                          </p>
                          <p className="mt-1 text-[9.5px] text-muted-foreground">
                            {formatDateTime(message.created_at)}
                          </p>
                        </div>
                      ))}
                  </div>

                  <form action={replyTicketAction} className="flex items-start gap-2">
                    <input type="hidden" name="ticketId" value={ticket.id} />
                    <textarea
                      name="message"
                      required
                      rows={2}
                      placeholder="Reply"
                      className="flex-1 rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 py-2 text-[12px] outline-none focus:border-white/[0.14]"
                    />
                    <button
                      type="submit"
                      className="h-9 rounded-lg border border-white/[0.09] bg-white/[0.04] px-3 text-[11.5px] font-medium"
                    >
                      Reply
                    </button>
                  </form>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardFrame>
  );
}

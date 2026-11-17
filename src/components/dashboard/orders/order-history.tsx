import {
  CircleCheck,
  Clock3,
  History,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";

import type { OrderHistoryEntry } from "@/lib/db/orders";
import { formatDateTime } from "@/lib/format";
import {
  orderStatusLabel,
  paymentStatusLabel,
  type OrderStatusValue,
  type PaymentStatusValue,
} from "@/lib/orders";

const EVENT_META = {
  order_placed: {
    label: "Order placed",
    icon: ShoppingBag,
    tone: "text-electric-300",
  },
  status_changed: {
    label: "Status changed",
    icon: CircleCheck,
    tone: "text-cyan-glow",
  },
  payment_status_changed: {
    label: "Payment status changed",
    icon: Clock3,
    tone: "text-amber-glow",
  },
  payment_verified: {
    label: "Payment verified",
    icon: ShieldCheck,
    tone: "text-mint-glow",
  },
} as const;

function statusLabel(value: string): string {
  return orderStatusLabel(value as OrderStatusValue);
}

function paymentLabel(value: string): string {
  return paymentStatusLabel(value as PaymentStatusValue);
}

/**
 * The audited history of an order.
 *
 * Entries come from `order_events`, written by the database trigger in the
 * same transaction as the order change. When the audit migration is not
 * applied the page still shows the opening entry, and says so.
 */
export function OrderHistory({
  history,
  audited,
}: {
  history: OrderHistoryEntry[];
  audited: boolean;
}) {
  return (
    <div className="space-y-3">
      {!audited ? (
        <p className="rounded-xl border border-amber-glow/20 bg-amber-glow/[0.05] px-3 py-2.5 text-[11px] leading-relaxed text-amber-glow">
          The full audit trail is not enabled in this workspace database yet.
          Only the order&apos;s opening state is shown. Apply the latest TUMA
          migration to record every status and payment change.
        </p>
      ) : null}

      <ol className="relative space-y-4 border-l border-white/[0.08] pl-4">
        {history.map((entry) => {
          const meta =
            EVENT_META[entry.event_type as keyof typeof EVENT_META] ?? {
              label: entry.event_type.replace(/_/g, " "),
              icon: History,
              tone: "text-muted-foreground",
            };
          const Icon = meta.icon;
          const transition = [
            entry.from_status && entry.to_status
              ? `${statusLabel(entry.from_status)} → ${statusLabel(entry.to_status)}`
              : entry.to_status
                ? statusLabel(entry.to_status)
                : null,
            entry.from_payment_status && entry.to_payment_status
              ? `${paymentLabel(entry.from_payment_status)} → ${paymentLabel(
                  entry.to_payment_status,
                )}`
              : entry.to_payment_status
                ? paymentLabel(entry.to_payment_status)
                : null,
          ]
            .filter(Boolean)
            .join(" · ");

          return (
            <li key={entry.id} className="relative">
              <span className="absolute top-0.5 -left-[23px] grid size-3.5 place-items-center rounded-full border border-white/[0.12] bg-navy-900">
                <span className="size-1.5 rounded-full bg-white/40" />
              </span>

              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <Icon className={`size-3.5 ${meta.tone}`} aria-hidden />
                <p className="text-[11.5px] font-medium">{meta.label}</p>
                <span className="text-[10.5px] text-muted-foreground">
                  {formatDateTime(entry.created_at)}
                </span>
              </div>

              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {transition || null}
              </p>

              <p className="mt-0.5 text-[10.5px] text-muted-foreground/80">
                {entry.actor_name
                  ? `By ${entry.actor_name}`
                  : entry.event_type === "order_placed"
                    ? "Placed by the customer"
                    : "Recorded by the system"}
              </p>

              {entry.note ? (
                <p className="mt-1 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 text-[11px] leading-relaxed text-foreground/75">
                  {entry.note}
                </p>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  buildOrderConfirmationMessage,
  buildPaymentMessage,
  buildWhatsAppLink,
  type OrderMessageInput,
} from "@/lib/orders";
import { cn } from "cn";

type MessageKind = "confirmation" | "payment";

const TABS: { value: MessageKind; label: string }[] = [
  { value: "confirmation", label: "Order confirmation" },
  { value: "payment", label: "Payment update" },
];

/**
 * Pre-filled WhatsApp messages for one order.
 *
 * The merchant opens the chat; TUMA never claims the message was sent. The
 * confirmation carries every product, the total, the delivery location and the
 * public order link, and the payment wording only says "verified" when the
 * merchant actually verified the payment.
 */
export function OrderWhatsAppPanel({
  customerPhone,
  input,
}: {
  customerPhone: string | null;
  input: OrderMessageInput;
}) {
  const [tab, setTab] = useState<MessageKind>("confirmation");
  const [copied, setCopied] = useState(false);

  const message =
    tab === "confirmation"
      ? buildOrderConfirmationMessage(input)
      : buildPaymentMessage(input);

  const href = buildWhatsAppLink(customerPhone, message);

  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-3">
      <div
        role="tablist"
        aria-label="WhatsApp message"
        className="flex items-center gap-1 rounded-xl border border-white/[0.07] bg-white/[0.02] p-1"
      >
        {TABS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={tab === option.value}
            onClick={() => setTab(option.value)}
            className={cn(
              "flex-1 rounded-lg px-2 py-1.5 text-[11px] font-medium transition-colors",
              tab === option.value
                ? "bg-white/[0.09] text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <label className="sr-only" htmlFor="order-whatsapp-message">
        Message preview
      </label>
      <textarea
        id="order-whatsapp-message"
        readOnly
        value={message}
        rows={tab === "confirmation" ? 14 : 8}
        className="w-full resize-y rounded-xl border border-white/[0.07] bg-white/[0.015] px-3 py-2.5 font-mono text-[11px] leading-relaxed text-foreground/85 outline-none"
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          onClick={copy}
          variant="outline"
          className="h-8 rounded-lg border-white/[0.1] bg-white/[0.03] px-3 text-[11.5px]"
        >
          {copied ? (
            <Check className="size-3.5 text-mint-glow" aria-hidden />
          ) : (
            <Copy className="size-3.5" aria-hidden />
          )}
          {copied ? "Copied" : "Copy message"}
        </Button>

        {href ? (
          <Button
            asChild
            size="sm"
            className="h-8 rounded-lg px-3 text-[11.5px]"
          >
            <a href={href} target="_blank" rel="noreferrer noopener">
              <MessageCircle className="size-3.5" aria-hidden />
              Open WhatsApp
              <ExternalLink className="size-3" aria-hidden />
            </a>
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            disabled
            className="h-8 rounded-lg px-3 text-[11.5px]"
          >
            <MessageCircle className="size-3.5" aria-hidden />
            No phone number
          </Button>
        )}
      </div>

      <p className="text-[10.5px] leading-relaxed text-muted-foreground">
        {href
          ? "WhatsApp opens with this text already filled in. TUMA does not send anything automatically — you press Send."
          : "This order has no customer phone number on file, so TUMA cannot open a chat. Copy the message and send it yourself, or add the number to the customer record first."}
      </p>
      <p className="text-[10.5px] leading-relaxed text-muted-foreground/80">
        {input.orderUrl
          ? "Every product, quantity, line total, the total, the delivery location and the public order link are included in the confirmation."
          : "Every product, quantity, line total, the total and the delivery location are included in the confirmation. The public order link appears once the storefront migration is applied."}
      </p>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  buildStorefrontShareMessage,
  buildWhatsAppShareLink,
  type ShareProduct,
} from "@/lib/orders";

/**
 * Shareable storefront link and message.
 *
 * The message is pre-filled with the shop name, the link and up to three real
 * products with their real prices. WhatsApp opens with the text ready; TUMA
 * does not post or send anything on the merchant's behalf.
 */
export function StorefrontSharePanel({
  businessName,
  description,
  storefrontUrl,
  products,
  isPublic,
}: {
  businessName: string;
  description: string | null;
  storefrontUrl: string;
  products: ShareProduct[];
  isPublic: boolean;
}) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);

  const message = buildStorefrontShareMessage({
    businessName,
    storefrontUrl,
    description,
    products,
  });

  const shareLink = buildWhatsAppShareLink(message);

  async function copy(value: string, kind: "link" | "message") {
    try {
      await navigator.clipboard.writeText(value);
      if (kind === "link") {
        setCopiedLink(true);
        window.setTimeout(() => setCopiedLink(false), 2000);
      } else {
        setCopiedMessage(true);
        window.setTimeout(() => setCopiedMessage(false), 2000);
      }
    } catch {
      // The browser may block clipboard access outside a secure context; the
      // link stays selectable in the field below.
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="flex h-9 min-w-0 flex-1 items-center rounded-xl border border-white/[0.07] bg-white/[0.025] px-3">
          <a
            href={storefrontUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="min-w-0 flex-1 truncate text-[11.5px] text-cyan-glow hover:underline"
          >
            {storefrontUrl}
          </a>
          <ExternalLink
            className="ml-2 size-3.5 shrink-0 text-muted-foreground"
            aria-hidden
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => copy(storefrontUrl, "link")}
            className="h-9 rounded-xl border-white/[0.1] bg-white/[0.03] px-3 text-[11.5px]"
          >
            {copiedLink ? (
              <Check className="size-3.5 text-mint-glow" aria-hidden />
            ) : (
              <Copy className="size-3.5" aria-hidden />
            )}
            {copiedLink ? "Copied" : "Copy link"}
          </Button>

          <Button asChild size="sm" className="h-9 rounded-xl px-3 text-[11.5px]">
            <a href={shareLink} target="_blank" rel="noreferrer noopener">
              <MessageCircle className="size-3.5" aria-hidden />
              Share on WhatsApp
              <ExternalLink className="size-3" aria-hidden />
            </a>
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.07] bg-white/[0.015] px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] tracking-wide text-muted-foreground uppercase">
            Share message
          </p>
          <button
            type="button"
            onClick={() => copy(message, "message")}
            className="inline-flex items-center gap-1 text-[10.5px] text-muted-foreground transition-colors hover:text-foreground"
          >
            {copiedMessage ? (
              <Check className="size-3 text-mint-glow" aria-hidden />
            ) : (
              <Copy className="size-3" aria-hidden />
            )}
            {copiedMessage ? "Copied" : "Copy"}
          </button>
        </div>
        <pre className="mt-1.5 overflow-x-auto font-sans text-[11px] leading-relaxed whitespace-pre-wrap text-foreground/80">
          {message}
        </pre>
      </div>

      <p className="text-[10.5px] leading-relaxed text-muted-foreground">
        {isPublic
          ? "The message includes your link and up to three active products with their prices. WhatsApp opens with the text ready — you choose where to send it."
          : "Your storefront is private right now. Publish it above before sharing the link, otherwise visitors will see a closed shop."}
      </p>
    </div>
  );
}

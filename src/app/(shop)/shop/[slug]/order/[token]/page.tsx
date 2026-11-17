import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, MapPin, MessageCircle, Phone } from "lucide-react";

import { ClearCartAfterOrder } from "@/components/shop/clear-cart-after-order";
import { getOrderConfirmation } from "@/lib/db/storefront";
import { formatCurrency, formatDateTime } from "@/lib/format";

type Props = {
  params: Promise<{ slug: string; token: string }>;
};

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false, follow: false },
};

export default async function OrderConfirmationPage({ params }: Props) {
  const { slug, token } = await params;
  const order = await getOrderConfirmation(token);

  if (!order) {
    notFound();
  }

  const whatsappHref = order.business.whatsapp
    ? `https://wa.me/${order.business.whatsapp.replace(/[^\d]/g, "")}`
    : null;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <ClearCartAfterOrder slug={slug} />

      <div className="rounded-2xl border border-mint-glow/20 bg-mint-glow/[0.05] px-5 py-6 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-mint-glow/12">
          <CheckCircle2 className="size-6 text-mint-glow" aria-hidden />
        </span>
        <h1 className="mt-3 font-heading text-[1.35rem] font-semibold tracking-[-0.03em]">
          Thank you, your order is in
        </h1>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
          {order.business.name} will call you on{" "}
          <span className="text-foreground/85">{order.customer_phone}</span> to
          confirm the delivery.
        </p>
        <p className="mt-3 inline-flex items-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.04] px-3 py-1.5 text-[12.5px]">
          <span className="text-muted-foreground">Order number</span>
          <span className="font-mono font-medium" data-order-number={order.order_number}>
            {order.order_number}
          </span>
        </p>
      </div>

      <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 sm:p-5">
        <h2 className="font-heading text-[14px] font-semibold">Order summary</h2>

        <ul className="mt-4 space-y-3">
          {order.items.map((item, index) => (
            <li
              key={`${item.product_name}-${index}`}
              className="flex items-start justify-between gap-3 text-[12.5px]"
            >
              <span className="min-w-0">
                <span className="block truncate font-medium">{item.product_name}</span>
                <span className="mt-0.5 block text-[11px] text-muted-foreground">
                  {item.quantity} × {formatCurrency(item.unit_price, order.currency)}
                </span>
              </span>
              <span className="font-medium">
                {formatCurrency(item.line_total, order.currency)}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-4 space-y-1.5 border-t border-white/[0.07] pt-4 text-[12.5px]">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(order.subtotal, order.currency)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Delivery</span>
            <span className="text-muted-foreground">Confirmed by the shop</span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="font-medium">Total</span>
            <span className="font-heading text-[16px] font-semibold">
              {formatCurrency(order.total, order.currency)}
            </span>
          </div>
        </div>

        <p className="mt-3 text-[10.5px] text-muted-foreground">
          Placed on {formatDateTime(order.created_at)} · Status: {order.status}
        </p>
      </section>

      <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 sm:p-5">
        <h2 className="font-heading text-[14px] font-semibold">Delivery details</h2>
        <dl className="mt-3 space-y-2 text-[12.5px]">
          <div className="flex gap-2">
            <dt className="w-28 shrink-0 text-muted-foreground">Name</dt>
            <dd className="text-foreground/85">{order.customer_name}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-28 shrink-0 text-muted-foreground">Phone</dt>
            <dd className="text-foreground/85">{order.customer_phone}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-28 shrink-0 text-muted-foreground">Location</dt>
            <dd className="text-foreground/85">{order.delivery_location}</dd>
          </div>
          {order.notes ? (
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 text-muted-foreground">Notes</dt>
              <dd className="text-foreground/85">{order.notes}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      <div className="flex flex-wrap items-center gap-4 text-[12px]">
        <Link
          href={`/shop/${order.business.slug}`}
          className="inline-flex h-9 items-center rounded-xl border border-white/[0.1] bg-white/[0.04] px-3.5 text-[12px] font-medium transition-colors hover:bg-white/[0.07]"
        >
          Back to the shop
        </Link>

        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Phone className="size-3.5" aria-hidden />
          <a
            href={`tel:${order.business.phone.replace(/\s/g, "")}`}
            className="hover:text-cyan-glow"
          >
            {order.business.phone}
          </a>
        </span>

        {whatsappHref ? (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer noopener"
            className="flex items-center gap-1.5 text-muted-foreground hover:text-cyan-glow"
          >
            <MessageCircle className="size-3.5" aria-hidden />
            Message the shop on WhatsApp
          </a>
        ) : null}

        <span className="flex items-center gap-1.5 text-muted-foreground">
          <MapPin className="size-3.5" aria-hidden />
          {order.business.location}
        </span>
      </div>
    </div>
  );
}

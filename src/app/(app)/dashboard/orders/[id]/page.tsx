import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  Link2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ReceiptText,
  StickyNote,
  User,
} from "lucide-react";

import { Card } from "@/components/dashboard/cards/card";
import { OrderHistory } from "@/components/dashboard/orders/order-history";
import { OrderStatusForm } from "@/components/dashboard/orders/order-status-form";
import { OrderWhatsAppPanel } from "@/components/dashboard/orders/whatsapp-panel";
import { PaymentVerificationForm } from "@/components/dashboard/orders/payment-verification-form";
import { DashboardFrame } from "@/components/dashboard/shell/dashboard-frame";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { getOwnedBusiness } from "@/lib/auth/server";
import { getOrderDetail } from "@/lib/db/orders";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import {
  orderStatusLabel,
  orderStatusTone,
  paymentStatusLabel,
  paymentStatusTone,
} from "@/lib/orders";
import { getRequestOrigin } from "@/lib/url";

export const metadata: Metadata = {
  title: "Order",
  description: "The items, customer, payment and history of one order.",
};

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ updated?: string; payment?: string }>;
};

export default async function OrderDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const query = await searchParams;

  const [order, business] = await Promise.all([
    getOrderDetail(id),
    getOwnedBusiness(),
  ]);

  if (!order || !business) {
    notFound();
  }

  const origin = await getRequestOrigin();
  const storefrontUrl = `${origin}/shop/${business.slug}`;
  const orderUrl = order.public_token
    ? `${storefrontUrl}/order/${order.public_token}`
    : null;
  const currency = order.currency || business.currency;

  const notices: { tone: "success" | "info"; message: string }[] = [];

  if (query.updated) {
    notices.push({
      tone: "success",
      message:
        "Order status updated. The change is recorded in the order history with your name and the time.",
    });
  }

  if (query.payment === "paid") {
    notices.push({
      tone: "success",
      message:
        "Payment marked as verified. The time and your account were recorded on the order.",
    });
  } else if (query.payment === "rejected") {
    notices.push({
      tone: "success",
      message:
        "Payment marked as rejected. The reason is saved in the order history.",
    });
  } else if (query.payment === "awaiting_verification") {
    notices.push({
      tone: "info",
      message:
        "Payment marked as awaiting verification. The order does not claim the payment is verified.",
    });
  } else if (query.payment === "unpaid") {
    notices.push({
      tone: "info",
      message:
        "Payment marked as unpaid. Any earlier verification stamp was cleared.",
    });
  }

  return (
    <DashboardFrame>
      <div className="space-y-5">
        <div className="min-w-0">
          <Link
            href="/dashboard/orders"
            className="inline-flex items-center gap-1.5 text-[11.5px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            All orders
          </Link>

          <div className="mt-2 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-mono text-[1.45rem] leading-tight font-semibold tracking-[-0.02em] sm:text-[1.6rem]">
                  {order.order_number}
                </h1>
                <StatusBadge tone={orderStatusTone(order.status)}>
                  {orderStatusLabel(order.status)}
                </StatusBadge>
                <StatusBadge tone={paymentStatusTone(order.payment_status)}>
                  {paymentStatusLabel(order.payment_status)}
                </StatusBadge>
              </div>
              <p className="mt-1.5 text-[12px] text-muted-foreground">
                Placed {formatDateTime(order.placed_at)} by{" "}
                {order.customer?.name ?? "a walk-in customer"}.
              </p>
            </div>

            <div className="shrink-0 text-left sm:text-right">
              <p className="text-[10.5px] tracking-wide text-muted-foreground uppercase">
                Order total
              </p>
              <p className="mt-0.5 font-heading text-[1.35rem] leading-none font-semibold tracking-[-0.03em]">
                {formatCurrency(order.total, currency)}
              </p>
            </div>
          </div>
        </div>

        {notices.map((notice) => (
          <div
            key={notice.message}
            role="status"
            className={
              notice.tone === "success"
                ? "rounded-xl border border-mint-glow/20 bg-mint-glow/[0.07] px-3.5 py-3 text-[12px] text-mint-glow"
                : "rounded-xl border border-cyan-glow/20 bg-cyan-glow/[0.06] px-3.5 py-3 text-[12px] text-electric-200"
            }
          >
            {notice.message}
          </div>
        ))}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_330px]">
          <div className="space-y-4">
            <Card
              title="Items"
              description={`${order.item_count} unit${
                order.item_count === 1 ? "" : "s"
              } in this order`}
              action={
                <span className="inline-flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
                  <ReceiptText className="size-3.5" aria-hidden />
                  {order.items.length} product line
                  {order.items.length === 1 ? "" : "s"}
                </span>
              }
              bodyClassName="p-0"
            >
              {order.items.length === 0 ? (
                <p className="px-4 py-6 text-center text-[12px] text-muted-foreground">
                  No product lines are recorded on this order yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[11.5px]">
                    <thead>
                      <tr className="border-b border-white/[0.06] text-left text-[10px] text-muted-foreground">
                        <th className="px-4 py-2 font-medium">Product</th>
                        <th className="px-2 py-2 text-right font-medium">
                          Quantity
                        </th>
                        <th className="px-2 py-2 text-right font-medium">
                          Unit price
                        </th>
                        <th className="px-4 py-2 text-right font-medium">
                          Line total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-white/[0.04] last:border-0"
                        >
                          <td className="px-4 py-2.5 text-foreground/85">
                            {item.product_name}
                          </td>
                          <td className="px-2 py-2.5 text-right text-muted-foreground">
                            {item.quantity}
                          </td>
                          <td className="px-2 py-2.5 text-right whitespace-nowrap text-muted-foreground">
                            {formatCurrency(item.unit_price, currency)}
                          </td>
                          <td className="px-4 py-2.5 text-right whitespace-nowrap font-medium">
                            {formatCurrency(item.line_total, currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <dl className="space-y-1.5 border-t border-white/[0.06] px-4 py-3 text-[11.5px]">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd>{formatCurrency(order.subtotal, currency)}</dd>
                </div>
                {order.discount > 0 ? (
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Discount</dt>
                    <dd>−{formatCurrency(order.discount, currency)}</dd>
                  </div>
                ) : null}
                {order.tax > 0 ? (
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Tax</dt>
                    <dd>{formatCurrency(order.tax, currency)}</dd>
                  </div>
                ) : null}
                <div className="flex items-center justify-between border-t border-white/[0.06] pt-1.5">
                  <dt className="font-medium">Total</dt>
                  <dd className="font-heading text-[13px] font-semibold">
                    {formatCurrency(order.total, currency)}
                  </dd>
                </div>
              </dl>
            </Card>

            <Card
              title="Customer"
              description="Who placed the order and where it goes."
            >
              {order.customer ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5">
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-white/[0.07] bg-white/[0.03] text-muted-foreground">
                      <User className="size-3.5" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-medium">
                        {order.customer.name}
                      </p>
                      <p className="text-[10.5px] text-muted-foreground">
                        Customer record
                      </p>
                    </div>
                  </div>

                  <dl className="grid gap-2 text-[11.5px] sm:grid-cols-2">
                    <div className="flex items-start gap-2">
                      <Phone
                        className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
                        aria-hidden
                      />
                      <div className="min-w-0">
                        <dt className="text-[10px] text-muted-foreground">
                          Phone
                        </dt>
                        <dd className="truncate">
                          {order.customer.phone ? (
                            <a
                              href={`tel:${order.customer.phone.replace(/\s/g, "")}`}
                              className="text-foreground/85 hover:text-cyan-glow"
                            >
                              {order.customer.phone}
                            </a>
                          ) : (
                            <span className="text-muted-foreground">
                              Not provided
                            </span>
                          )}
                        </dd>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Mail
                        className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
                        aria-hidden
                      />
                      <div className="min-w-0">
                        <dt className="text-[10px] text-muted-foreground">
                          Email
                        </dt>
                        <dd className="truncate">
                          {order.customer.email ? (
                            <a
                              href={`mailto:${order.customer.email}`}
                              className="text-foreground/85 hover:text-cyan-glow"
                            >
                              {order.customer.email}
                            </a>
                          ) : (
                            <span className="text-muted-foreground">
                              Not provided
                            </span>
                          )}
                        </dd>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 sm:col-span-2">
                      <MapPin
                        className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
                        aria-hidden
                      />
                      <div className="min-w-0">
                        <dt className="text-[10px] text-muted-foreground">
                          Delivery location
                        </dt>
                        <dd className="text-foreground/85">
                          {order.customer.address ??
                            "No delivery address on file"}
                        </dd>
                      </div>
                    </div>

                    {order.customer.notes ? (
                      <div className="flex items-start gap-2 sm:col-span-2">
                        <StickyNote
                          className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
                          aria-hidden
                        />
                        <div className="min-w-0">
                          <dt className="text-[10px] text-muted-foreground">
                            Customer notes
                          </dt>
                          <dd className="whitespace-pre-line text-foreground/85">
                            {order.customer.notes}
                          </dd>
                        </div>
                      </div>
                    ) : null}
                  </dl>
                </div>
              ) : (
                <p className="text-[12px] leading-relaxed text-muted-foreground">
                  This order has no customer record attached. The contact details
                  the customer used at checkout are not available, so use the
                  order number to find them.
                </p>
              )}

              {order.notes ? (
                <div className="mt-3 border-t border-white/[0.06] pt-3">
                  <p className="text-[10px] tracking-wide text-muted-foreground uppercase">
                    Order note from the customer
                  </p>
                  <p className="mt-1 whitespace-pre-line text-[11.5px] leading-relaxed text-foreground/80">
                    {order.notes}
                  </p>
                </div>
              ) : null}
            </Card>

            <Card
              title="Order history"
              description="Every change, in the order it happened."
            >
              <OrderHistory
                history={order.history}
                audited={order.history_audited}
              />
            </Card>
          </div>

          <div className="space-y-4">
            <Card
              title="Order status"
              description="Move the order through your workflow."
            >
              <OrderStatusForm
                orderId={order.id}
                status={order.status}
                audited={order.capabilities.audit}
              />
            </Card>

            <Card
              title="Payment"
              description="What you checked, and when."
            >
              <PaymentVerificationForm
                orderId={order.id}
                paymentStatus={order.payment_status}
                paymentVerifiedAt={order.payment_verified_at}
                verifiedByName={order.verified_by_name}
                paymentNote={order.payment_note}
                verificationSupported={order.capabilities.verification}
              />
            </Card>

            <Card
              title="WhatsApp"
              description="Send the customer a prepared message."
            >
              <OrderWhatsAppPanel
                customerPhone={order.customer?.phone ?? null}
                input={{
                  businessName: business.name,
                  orderNumber: order.order_number,
                  customerName: order.customer?.name ?? null,
                  status: order.status,
                  paymentStatus: order.payment_status,
                  currency,
                  total: order.total,
                  placedAt: order.placed_at,
                  deliveryLocation: order.customer?.address ?? null,
                  items: order.items.map((item) => ({
                    name: item.product_name,
                    quantity: item.quantity,
                    unitPrice: item.unit_price,
                    lineTotal: item.line_total,
                  })),
                  orderUrl,
                  storefrontUrl,
                  paymentVerifiedAt: order.payment_verified_at,
                }}
              />
            </Card>

            <Card title="Links" description="Shareable addresses for this order.">
              <div className="space-y-2.5">
                <div>
                  <p className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
                    <Link2 className="size-3" aria-hidden />
                    Public order page
                  </p>
                  {orderUrl ? (
                    <a
                      href={orderUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="mt-0.5 inline-flex items-center gap-1 text-[11.5px] break-all text-cyan-glow hover:underline"
                    >
                      {orderUrl}
                      <ExternalLink className="size-3 shrink-0" aria-hidden />
                    </a>
                  ) : (
                    <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                      Not available until the storefront migration is applied.
                    </p>
                  )}
                </div>

                <div>
                  <p className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
                    <MessageCircle className="size-3" aria-hidden />
                    Storefront
                  </p>
                  <a
                    href={storefrontUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-0.5 inline-flex items-center gap-1 text-[11.5px] break-all text-cyan-glow hover:underline"
                  >
                    {storefrontUrl}
                    <ExternalLink className="size-3 shrink-0" aria-hidden />
                  </a>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-white/[0.06] pt-2.5 text-[10.5px] text-muted-foreground">
                  <span>Placed {formatDate(order.placed_at)}</span>
                  <span>Updated {formatDateTime(order.updated_at)}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardFrame>
  );
}

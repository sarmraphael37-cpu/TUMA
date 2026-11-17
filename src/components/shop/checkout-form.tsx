"use client";

import { useActionState, useSyncExternalStore } from "react";
import Image from "next/image";
import { Loader2, MapPin, Phone, ShoppingBag } from "lucide-react";

import { placeOrderAction } from "@/app/(shop)/shop/[slug]/actions";
import {
  getCheckoutToken,
  getServerCheckoutToken,
  subscribeToCheckoutToken,
} from "@/components/shop/checkout-token";
import { useShop } from "@/components/shop/shop-provider";
import { FormAlert } from "@/components/auth/form-alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/format";
import type { FormState } from "@/lib/auth/form-state";

const INITIAL: FormState = { status: "idle" };

/**
 * The checkout form.
 *
 * The cart is read from the browser and sent as a list of product ids and
 * quantities. Prices are never sent — the shop prices the order itself.
 */
export function CheckoutForm({
  slug,
  currency,
  phone,
  whatsapp,
}: {
  slug: string;
  currency: string;
  phone: string;
  whatsapp: string | null;
}) {
  const { entries, subtotal } = useShop();
  const [state, formAction, pending] = useActionState(placeOrderAction, INITIAL);

  const clientToken = useSyncExternalStore(
    subscribeToCheckoutToken,
    () => getCheckoutToken(slug),
    getServerCheckoutToken,
  );

  const cart = JSON.stringify(
    entries.map((entry) => ({
      product_id: entry.productId,
      quantity: entry.quantity,
    })),
  );

  const whatsappHref = whatsapp
    ? `https://wa.me/${whatsapp.replace(/[^\d]/g, "")}`
    : null;

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] px-5 py-8 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl border border-white/[0.08] bg-white/[0.03]">
          <ShoppingBag className="size-5 text-muted-foreground" aria-hidden />
        </span>
        <h2 className="mt-3 font-heading text-[15px] font-semibold">
          Your cart is empty
        </h2>
        <p className="mx-auto mt-1.5 max-w-sm text-[12.5px] leading-relaxed text-muted-foreground">
          Add a product to the cart and come back here to place your order.
        </p>
        <Button
          type="button"
          variant="outline"
          asChild
          className="mt-4 h-9 rounded-xl px-3.5 text-[12px]"
        >
          <a href={`/shop/${slug}`}>Browse the catalogue</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="cart" value={cart} />
        <input type="hidden" name="clientToken" value={clientToken} />

        {state.message ? (
          <FormAlert tone={state.status === "error" ? "error" : "success"}>
            {state.message}
          </FormAlert>
        ) : null}

        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 sm:p-5">
          <h2 className="font-heading text-[14px] font-semibold">
            Where should we deliver?
          </h2>
          <p className="mt-1 text-[11.5px] text-muted-foreground">
            The shop calls you on the number you give to confirm the order.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field
              label="Full name"
              htmlFor="customerName"
              error={state.fieldErrors?.customerName?.[0]}
            >
              <Input
                id="customerName"
                name="customerName"
                required
                maxLength={160}
                autoComplete="name"
                placeholder="Awa Ndiaye"
                className="h-10"
              />
            </Field>

            <Field
              label="Phone number"
              htmlFor="customerPhone"
              error={state.fieldErrors?.customerPhone?.[0]}
            >
              <Input
                id="customerPhone"
                name="customerPhone"
                required
                type="tel"
                maxLength={30}
                autoComplete="tel"
                placeholder="+237 6 77 00 00 05"
                className="h-10"
              />
            </Field>

            <Field
              label="Delivery location"
              htmlFor="deliveryLocation"
              error={state.fieldErrors?.deliveryLocation?.[0]}
              className="sm:col-span-2"
            >
              <Textarea
                id="deliveryLocation"
                name="deliveryLocation"
                required
                rows={2}
                maxLength={160}
                placeholder="Akwa, Douala — opposite the market gate"
                className="min-h-[70px] resize-y"
              />
            </Field>

            <Field
              label="Notes for the shop"
              htmlFor="notes"
              hint="Optional — anything the shop should know"
              error={state.fieldErrors?.notes?.[0]}
              className="sm:col-span-2"
            >
              <Textarea
                id="notes"
                name="notes"
                rows={2}
                maxLength={1000}
                placeholder="Please call before delivering"
                className="min-h-[70px] resize-y"
              />
            </Field>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            disabled={pending}
            className="h-11 rounded-xl px-5 text-[13px]"
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <ShoppingBag className="size-4" aria-hidden />
            )}
            {pending ? "Placing your order…" : "Place the order"}
          </Button>

          <p className="text-[11px] text-muted-foreground">
            You will get an order number straight away.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-[11.5px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Phone className="size-3.5" aria-hidden />
            <a href={`tel:${phone.replace(/\s/g, "")}`} className="hover:text-cyan-glow">
              {phone}
            </a>
          </span>

          {whatsappHref ? (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer noopener"
              className="flex items-center gap-1.5 hover:text-cyan-glow"
            >
              <MapPin className="size-3.5" aria-hidden />
              Chat on WhatsApp
            </a>
          ) : null}
        </div>
      </form>

      <aside className="h-fit rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 sm:p-5">
        <h2 className="font-heading text-[14px] font-semibold">Order summary</h2>

        <ul className="mt-4 space-y-3">
          {entries.map((entry) => (
            <li key={entry.productId} className="flex items-start gap-3">
              <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg border border-white/[0.07] bg-white/[0.03]">
                {entry.image ? (
                  <Image
                    src={entry.image}
                    alt=""
                    width={48}
                    height={48}
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="text-[10.5px] font-medium text-muted-foreground">
                    {entry.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12.5px] font-medium">
                  {entry.name}
                </span>
                <span className="mt-0.5 block text-[11px] text-muted-foreground">
                  {entry.quantity} × {formatCurrency(entry.price, currency)}
                </span>
              </span>

              <span className="text-[12px] font-medium">
                {formatCurrency(entry.price * entry.quantity, currency)}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-4 space-y-1.5 border-t border-white/[0.07] pt-4 text-[12.5px]">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">
              {formatCurrency(subtotal, currency)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Delivery</span>
            <span className="text-muted-foreground">Confirmed by the shop</span>
          </div>
          <div className="flex items-center justify-between pt-1.5">
            <span className="font-medium">Total</span>
            <span className="font-heading text-[16px] font-semibold">
              {formatCurrency(subtotal, currency)}
            </span>
          </div>
        </div>

        <p className="mt-3 text-[10.5px] leading-relaxed text-muted-foreground">
          The shop prices the order when it is placed, so the final total is
          always confirmed before delivery.
        </p>
      </aside>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  error,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-[11.5px] font-medium text-foreground/85"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-[10.5px] text-rose-300">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-[10px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Trash2 } from "lucide-react";

import { QuantityStepper } from "@/components/shop/quantity-stepper";
import { useShop } from "@/components/shop/shop-provider";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatCurrency } from "@/lib/format";

/** The shopping cart drawer. */
export function CartSheet({ currency }: { currency: string }) {
  const { entries, subtotal, cartOpen, closeCart, setQuantity, remove, slug } =
    useShop();

  return (
    <Sheet
      open={cartOpen}
      onOpenChange={(open) => {
        if (!open) {
          closeCart();
        }
      }}
    >
      <SheetContent className="flex w-full flex-col border-white/[0.08] bg-navy-900 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-white/[0.07] px-5 py-4">
          <SheetTitle className="text-[15px]">Your cart</SheetTitle>
          <SheetDescription className="text-[12px] text-muted-foreground">
            {entries.length === 0
              ? "Nothing here yet."
              : `${entries.length} product${entries.length === 1 ? "" : "s"} ready to order.`}
          </SheetDescription>
        </SheetHeader>

        {entries.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <span className="grid size-12 place-items-center rounded-2xl border border-white/[0.08] bg-white/[0.03]">
              <ShoppingBag className="size-5 text-muted-foreground" aria-hidden />
            </span>
            <p className="text-[12.5px] text-muted-foreground">
              Your cart is empty. Browse the catalogue to add something.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={closeCart}
              className="h-9 rounded-xl px-3.5 text-[12px]"
            >
              Continue shopping
            </Button>
          </div>
        ) : (
          <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
            {entries.map((entry) => (
              <div
                key={entry.productId}
                className="flex items-start gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3"
              >
                <Link
                  href={`/shop/${slug}/p/${entry.productId}`}
                  onClick={closeCart}
                  className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-lg border border-white/[0.07] bg-white/[0.03]"
                >
                  {entry.image ? (
                    <Image
                      src={entry.image}
                      alt={entry.name}
                      width={56}
                      height={56}
                      className="size-full object-cover"
                    />
                  ) : (
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {entry.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </Link>

                <div className="min-w-0 flex-1">
                  <Link
                    href={`/shop/${slug}/p/${entry.productId}`}
                    onClick={closeCart}
                    className="block truncate text-[12.5px] font-medium hover:text-cyan-glow"
                  >
                    {entry.name}
                  </Link>
                  <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                    {formatCurrency(entry.price, currency)} each
                  </p>

                  <div className="mt-2 flex items-center justify-between gap-2">
                    <QuantityStepper
                      value={entry.quantity}
                      max={Math.max(entry.maxQuantity, entry.quantity)}
                      onChange={(quantity) =>
                        setQuantity(entry.productId, quantity)
                      }
                      label={`Quantity of ${entry.name}`}
                    />
                    <button
                      type="button"
                      onClick={() => remove(entry.productId)}
                      aria-label={`Remove ${entry.name}`}
                      className="grid size-7 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-rose-400/10 hover:text-rose-300"
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                    </button>
                  </div>
                </div>

                <p className="shrink-0 text-[12px] font-medium">
                  {formatCurrency(entry.price * entry.quantity, currency)}
                </p>
              </div>
            ))}
          </div>
        )}

        <SheetFooter className="flex-col items-stretch gap-3 border-t border-white/[0.07] px-5 py-4">
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-heading text-[15px] font-semibold">
              {formatCurrency(subtotal, currency)}
            </span>
          </div>
          <p className="text-[10.5px] text-muted-foreground">
            Delivery and the final total are confirmed by the shop when your
            order is placed.
          </p>
          <Button
            type="button"
            disabled={entries.length === 0}
            onClick={closeCart}
            asChild
            className="h-10 w-full rounded-xl text-[13px]"
          >
            <Link href={`/shop/${slug}/checkout`}>Continue to checkout</Link>
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

"use client";

import { ShoppingBag } from "lucide-react";

import { useShop } from "@/components/shop/shop-provider";
import { Button } from "@/components/ui/button";

/** The cart button in the storefront header. */
export function CartButton() {
  const { count, openCart } = useShop();

  return (
    <Button
      type="button"
      onClick={openCart}
      className="h-9 rounded-xl px-3 text-[12px]"
      aria-label={`Open the cart (${count} item${count === 1 ? "" : "s"})`}
    >
      <ShoppingBag className="size-3.5" aria-hidden />
      Cart
      {count > 0 ? (
        <span className="ml-1 grid min-w-4 place-items-center rounded-full bg-navy-950/30 px-1 text-[10px] font-semibold">
          {count}
        </span>
      ) : null}
    </Button>
  );
}

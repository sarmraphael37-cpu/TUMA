"use client";

import { useState } from "react";
import { Check, ShoppingBag } from "lucide-react";

import { QuantityStepper } from "@/components/shop/quantity-stepper";
import { useShop } from "@/components/shop/shop-provider";
import { Button } from "@/components/ui/button";

/**
 * Adds a product to the cart.
 *
 * The quantity can be picked before the product is added; the shop still
 * validates the stock when the order is placed.
 */
export function AddToCart({
  productId,
  name,
  price,
  currency,
  image,
  stock,
}: {
  productId: string;
  name: string;
  price: number;
  currency: string;
  image: string | null;
  stock: number;
}) {
  const { add, openCart } = useShop();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const outOfStock = stock <= 0;

  function handleAdd() {
    add({
      productId,
      name,
      price,
      currency,
      image,
      quantity,
      maxQuantity: Math.max(stock, 1),
    });

    setAdded(true);
    openCart();

    window.setTimeout(() => setAdded(false), 1600);
  }

  if (outOfStock) {
    return (
      <p className="rounded-xl border border-rose-400/20 bg-rose-400/[0.07] px-3.5 py-3 text-[12.5px] text-rose-200">
        This product is sold out right now. Ask the shop when it is back.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <QuantityStepper
        value={quantity}
        onChange={setQuantity}
        max={Math.min(stock, 1000)}
        label={`Quantity of ${name}`}
        size="md"
      />

      <Button
        type="button"
        onClick={handleAdd}
        className="h-10 rounded-xl px-4 text-[13px]"
      >
        {added ? (
          <Check className="size-4" aria-hidden />
        ) : (
          <ShoppingBag className="size-4" aria-hidden />
        )}
        {added ? "Added to the cart" : "Add to the cart"}
      </Button>
    </div>
  );
}

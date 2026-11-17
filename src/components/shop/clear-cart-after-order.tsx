"use client";

import { useEffect } from "react";

import { resetCheckoutToken } from "@/components/shop/checkout-token";
import { useShop } from "@/components/shop/shop-provider";

/**
 * Clears the cart once the order is confirmed.
 *
 * The order is already saved in the database, so emptying the browser cart
 * here cannot lose it.
 */
export function ClearCartAfterOrder({ slug }: { slug: string }) {
  const { clear } = useShop();

  useEffect(() => {
    clear();
    resetCheckoutToken(slug);
  }, [clear, slug]);

  return null;
}

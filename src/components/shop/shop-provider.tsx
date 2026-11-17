"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import {
  addToCart,
  cartCount,
  cartSubtotal,
  clearCart,
  getCartSnapshot,
  getServerCartSnapshot,
  removeFromCart,
  setCartQuantity,
  subscribeToCart,
  type CartEntry,
} from "@/components/shop/cart-store";

type ShopContextValue = {
  slug: string;
  entries: CartEntry[];
  count: number;
  subtotal: number;
  add: (entry: CartEntry) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  cartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
};

const ShopContext = createContext<ShopContextValue | null>(null);

/** Provides the cart of one storefront to the page tree. */
export function ShopProvider({
  slug,
  children,
}: {
  slug: string;
  children: ReactNode;
}) {
  const entries = useSyncExternalStore(
    subscribeToCart,
    () => getCartSnapshot(slug),
    getServerCartSnapshot,
  );

  const [cartOpen, setCartOpen] = useState(false);

  const value = useMemo<ShopContextValue>(
    () => ({
      slug,
      entries,
      count: cartCount(entries),
      subtotal: cartSubtotal(entries),
      add: (entry) => addToCart(slug, entry),
      setQuantity: (productId, quantity) =>
        setCartQuantity(slug, productId, quantity),
      remove: (productId) => removeFromCart(slug, productId),
      clear: () => clearCart(slug),
      cartOpen,
      openCart: () => setCartOpen(true),
      closeCart: () => setCartOpen(false),
    }),
    [slug, entries, cartOpen],
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

/** Reads the cart of the current storefront. */
export function useShop() {
  const context = useContext(ShopContext);

  if (!context) {
    throw new Error("useShop must be used inside a ShopProvider.");
  }

  return context;
}

"use client";

/**
 * Shopping cart store.
 *
 * The cart lives in the browser and is keyed by storefront slug, so two shops
 * never share a cart. It is exposed as an external store (and read through
 * `useSyncExternalStore`) so the server and the browser always render the
 * same markup on the first paint.
 */

export type CartEntry = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  currency: string;
  image: string | null;
  maxQuantity: number;
};

type CartState = Record<string, CartEntry[]>;

const STORAGE_PREFIX = "tuma.cart.";

const EMPTY: CartEntry[] = [];

let cache: CartState | null = null;
const listeners = new Set<() => void>();

function storageKey(slug: string) {
  return `${STORAGE_PREFIX}${slug}`;
}

function readStorage(): CartState {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(storageKey("__all__"));
    if (raw) {
      return JSON.parse(raw) as CartState;
    }
  } catch {
    // A corrupted entry must never break the shop.
  }

  return {};
}

function writeStorage(state: CartState) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(storageKey("__all__"), JSON.stringify(state));
  } catch {
    // Storage can be full or blocked — the cart then lives in memory only.
  }
}

function state() {
  if (!cache) {
    cache = readStorage();
  }

  return cache;
}

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

function commit(next: CartState) {
  cache = next;
  writeStorage(next);
  emit();
}

/** Subscribes to cart changes. */
export function subscribeToCart(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The cart of one storefront. */
export function getCartSnapshot(slug: string): CartEntry[] {
  return state()[slug] ?? EMPTY;
}

/** The server always renders an empty cart. */
export function getServerCartSnapshot(): CartEntry[] {
  return EMPTY;
}

/** Adds a product, or increases the quantity of an existing line. */
export function addToCart(slug: string, entry: CartEntry) {
  const current = state();
  const lines = [...(current[slug] ?? [])];
  const index = lines.findIndex((line) => line.productId === entry.productId);

  if (index >= 0) {
    const existing = lines[index];
    const quantity = Math.min(
      existing.quantity + entry.quantity,
      Math.max(entry.maxQuantity, existing.quantity),
    );

    lines[index] = { ...existing, quantity };
  } else {
    lines.push({
      ...entry,
      quantity: Math.min(entry.quantity, Math.max(entry.maxQuantity, 1)),
    });
  }

  commit({ ...current, [slug]: lines });
}

/** Sets the quantity of a line. A quantity of zero removes it. */
export function setCartQuantity(slug: string, productId: string, quantity: number) {
  const current = state();
  const lines = (current[slug] ?? [])
    .map((line) =>
      line.productId === productId
        ? {
            ...line,
            // Never more than what the shop has in stock.
            quantity: Math.max(
              0,
              Math.min(quantity, Math.max(line.maxQuantity, 1)),
            ),
          }
        : line,
    )
    .filter((line) => line.quantity > 0);

  commit({ ...current, [slug]: lines });
}

/** Removes a line from the cart. */
export function removeFromCart(slug: string, productId: string) {
  const current = state();
  const lines = (current[slug] ?? []).filter(
    (line) => line.productId !== productId,
  );

  commit({ ...current, [slug]: lines });
}

/** Empties the cart of a storefront. */
export function clearCart(slug: string) {
  const current = state();
  commit({ ...current, [slug]: [] });
}

/** The number of units in the cart. */
export function cartCount(entries: CartEntry[]) {
  return entries.reduce((total, entry) => total + entry.quantity, 0);
}

/** The sum of the cart, in the storefront currency. */
export function cartSubtotal(entries: CartEntry[]) {
  return entries.reduce(
    (total, entry) => total + entry.price * entry.quantity,
    0,
  );
}

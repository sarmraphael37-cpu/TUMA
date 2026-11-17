"use client";

/**
 * Idempotency token for a checkout session.
 *
 * The token is stored in the session storage, so a reload of the checkout page
 * keeps the same token: submitting twice returns the order that was already
 * created instead of placing a second one. It is reset once the order is
 * confirmed.
 */

const STORAGE_PREFIX = "tuma.checkout.";

const listeners = new Set<() => void>();
const cache: Record<string, string> = {};

function storageKey(slug: string) {
  return `${STORAGE_PREFIX}${slug}`;
}

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

function readOrCreate(slug: string): string {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    const existing = window.sessionStorage.getItem(storageKey(slug));

    if (existing) {
      return existing;
    }

    const created = crypto.randomUUID();
    window.sessionStorage.setItem(storageKey(slug), created);
    return created;
  } catch {
    return crypto.randomUUID();
  }
}

export function subscribeToCheckoutToken(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getCheckoutToken(slug: string): string {
  if (!cache[slug]) {
    cache[slug] = readOrCreate(slug);
  }

  return cache[slug];
}

/** The server renders an empty token; the browser fills it in. */
export function getServerCheckoutToken(): string {
  return "";
}

/** Starts a new checkout session (used after an order was placed). */
export function resetCheckoutToken(slug: string) {
  delete cache[slug];

  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.removeItem(storageKey(slug));
    } catch {
      // Ignore storage failures — the token simply changes next time.
    }
  }

  emit();
}

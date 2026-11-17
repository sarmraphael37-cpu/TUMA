"use client";

import { useSyncExternalStore } from "react";

/**
 * Reads the current `?q=` query from the address bar.
 *
 * `useSearchParams()` cannot be used in the workspace shell: it suspends while
 * the router hydrates, which leaves the whole dashboard boundary pending. This
 * store reads the URL directly and notifies React when it changes.
 */
function subscribe(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  window.addEventListener("focus", onChange);

  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener("focus", onChange);
  };
}

function getSnapshot(): string {
  return new URLSearchParams(window.location.search).get("q") ?? "";
}

function getServerSnapshot(): string {
  return "";
}

export function useCurrentSearchQuery(): string {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

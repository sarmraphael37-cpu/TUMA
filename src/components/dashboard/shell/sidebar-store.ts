"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "tuma:sidebar-collapsed";
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(STORAGE_KEY) === "collapsed";
}

function getServerSnapshot(): boolean {
  return false;
}

/**
 * Collapsed state for the workspace sidebar, persisted in localStorage.
 * Reading it through an external store keeps the server and the client in
 * sync without a state update inside an effect.
 */
export function useSidebarCollapsed() {
  const collapsed = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  function toggle() {
    const next = !getSnapshot();
    window.localStorage.setItem(STORAGE_KEY, next ? "collapsed" : "expanded");
    listeners.forEach((listener) => listener());
  }

  return { collapsed, toggle };
}

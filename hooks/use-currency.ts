"use client";

import * as React from "react";
import { DEFAULT_CURRENCY, getCurrency } from "@/lib/currency";

const STORAGE_KEY = "bitsbobs:currency";

let currentCode: string | null = null;
const listeners = new Set<() => void>();

function getSnapshot(): string {
  if (currentCode === null) {
    try {
      currentCode = localStorage.getItem(STORAGE_KEY) ?? DEFAULT_CURRENCY;
    } catch {
      // Storage blocked (privacy mode, embedded frame): keep the default in memory.
      currentCode = DEFAULT_CURRENCY;
    }
  }
  return currentCode;
}

function getServerSnapshot(): string {
  return DEFAULT_CURRENCY;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setCurrency(next: string) {
  currentCode = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Storage blocked: the choice still applies for this page load.
  }
  listeners.forEach((l) => l());
}

export function useCurrency() {
  const code = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  return { code, currency: getCurrency(code), setCurrency };
}

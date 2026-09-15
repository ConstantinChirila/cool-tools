"use client";

import * as React from "react";
import { DEFAULT_CURRENCY, getCurrency } from "@/lib/currency";

const STORAGE_KEY = "bitsbobs:currency";

let currentCode: string | null = null;
const listeners = new Set<() => void>();

function getSnapshot(): string {
  if (currentCode === null) {
    currentCode = localStorage.getItem(STORAGE_KEY) ?? DEFAULT_CURRENCY;
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
  localStorage.setItem(STORAGE_KEY, next);
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

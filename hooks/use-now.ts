"use client";

import * as React from "react";

/* A once-a-second clock shared by every component that shows live or relative times. */

let nowSnapshot: number | null = null;
const listeners = new Set<() => void>();
let timer: number | undefined;

function tick() {
  const next = Math.floor(Date.now() / 1000) * 1000;
  if (next === nowSnapshot) return;
  nowSnapshot = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) timer = window.setInterval(tick, 250);
  tick();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.clearInterval(timer);
      nowSnapshot = null;
    }
  };
}

/** Current time in ms, floored to the second, or null before hydration. */
export function useNow(): number | null {
  return React.useSyncExternalStore(subscribe, () => nowSnapshot, () => null);
}

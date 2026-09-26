"use client";

import * as React from "react";

/** Chromium-only event, not in lib.dom. */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * `prompt`: the browser handed us a native install prompt (Chromium).
 * `ios`: no install API exists, the user has to go through the Share sheet.
 * `none`: already installed, or a browser that cannot install.
 */
export type InstallMode = "prompt" | "ios" | "none";

let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

// Registered at module load, not in an effect: Chrome fires the event once, early.
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    emit();
  });
}

export function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  // iPadOS reports itself as a Mac; touch points tell them apart.
  return (
    /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1)
  );
}

function getSnapshot(): InstallMode {
  if (isStandalone()) return "none";
  if (deferred) return "prompt";
  return isIos() ? "ios" : "none";
}

function getServerSnapshot(): InstallMode {
  return "none";
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Open the native install dialog. Only meaningful while the mode is `prompt`. */
export async function promptInstall() {
  if (!deferred) return;
  const event = deferred;
  // The event is single use whatever the user picks.
  deferred = null;
  emit();
  await event.prompt();
}

export function useInstallMode(): InstallMode {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

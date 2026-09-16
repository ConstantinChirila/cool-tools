"use client";

import * as React from "react";
import { getTool, type Tool } from "@/lib/tools";

const STORAGE_KEY = "bitsbobs:recent";
const MAX_RECENT = 4;
const EMPTY: readonly string[] = [];

let slugs: readonly string[] | null = null;
const listeners = new Set<() => void>();

function read(): readonly string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((s): s is string => typeof s === "string")
      : EMPTY;
  } catch {
    return EMPTY;
  }
}

function getSnapshot(): readonly string[] {
  if (slugs === null) slugs = read();
  return slugs;
}

function getServerSnapshot(): readonly string[] {
  return EMPTY;
}

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      slugs = read();
      emit();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Move a tool to the front of the recently used list. */
export function recordRecentTool(slug: string) {
  const next = [slug, ...getSnapshot().filter((s) => s !== slug)].slice(0, MAX_RECENT);
  slugs = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable (private mode, quota): keep the in-memory list.
  }
  emit();
}

export function clearRecentTools() {
  slugs = EMPTY;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  emit();
}

/**
 * Recently opened tools, most recent first. Empty on the server and during
 * hydration, then filled from localStorage. Unknown slugs (removed tools)
 * are dropped.
 */
export function useRecentTools(): Tool[] {
  const list = React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return React.useMemo(
    () => list.map(getTool).filter((t): t is Tool => t !== undefined),
    [list],
  );
}

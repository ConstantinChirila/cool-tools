"use client";

import * as React from "react";
import { createStorageStore } from "@/hooks/create-storage-store";
import { getTool, type Tool } from "@/lib/tools";

const MAX_RECENT = 4;
const EMPTY: readonly string[] = [];

const store = createStorageStore<readonly string[]>({
  key: "bitsbobs:recent",
  fallback: EMPTY,
  parse: (raw) => {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string") : EMPTY;
  },
  serialize: (slugs) => JSON.stringify(slugs),
});

/** Move a tool to the front of the recently used list. */
export function recordRecentTool(slug: string) {
  store.set([slug, ...store.getSnapshot().filter((s) => s !== slug)].slice(0, MAX_RECENT));
}

/**
 * Recently opened tools, most recent first. Empty on the server and during
 * hydration, then filled from localStorage. Unknown slugs (removed tools)
 * are dropped.
 */
export function useRecentTools(): Tool[] {
  const list = React.useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  return React.useMemo(
    () => list.map(getTool).filter((t): t is Tool => t !== undefined),
    [list],
  );
}

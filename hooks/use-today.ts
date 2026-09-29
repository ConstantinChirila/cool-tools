"use client";

import * as React from "react";

const subscribe = () => () => {};
const todayKey = () => new Date().toDateString();

/** Today at midnight, or null before hydration so server and client render the same. */
export function useToday(): Date | null {
  const key = React.useSyncExternalStore(subscribe, todayKey, () => null);
  return key === null ? null : new Date(key);
}

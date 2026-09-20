"use client";

import * as React from "react";
import { CountdownResults, nextNewYear } from "@/components/tools/countdown-calculator";
import { useNow } from "@/hooks/use-now";
import { DEFAULT_TIME, calculateCountdown, toLocalDate } from "@/lib/countdown";

/**
 * The countdown results card on its own, driven by props instead of inputs.
 * Used by the shareable card page; the tool page owns the editable version.
 */
export function CountdownCard({
  to,
  at,
  name,
}: {
  /** "YYYY-MM-DD", already validated, or "" to count to the next New Year. */
  to: string;
  /** "HH:MM", already validated. */
  at: string;
  name: string;
}) {
  const now = useNow();
  const resolvedDate = to || (now === null ? "" : nextNewYear(new Date(now)));
  const time = at || DEFAULT_TIME;
  const target = toLocalDate(resolvedDate, time);
  const result = now !== null && target ? calculateCountdown(new Date(now), target) : null;
  const timeZone = now === null ? null : Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <CountdownResults
      result={result}
      target={target}
      name={name}
      timeZone={timeZone}
      requestedTime={time}
      size="lg"
    />
  );
}

import { plural } from "@/lib/currency";

const UNITS: [number, string][] = [
  [365 * 86_400_000, "year"],
  [30 * 86_400_000, "month"],
  [86_400_000, "day"],
  [3_600_000, "hour"],
  [60_000, "minute"],
  [1000, "second"],
];

/** "3 hours", "2 days": the largest whole unit, for relative times. */
export function roughDuration(ms: number): string {
  const size = Math.abs(ms);
  for (const [unit, name] of UNITS) {
    if (size >= unit) {
      const n = Math.floor(size / unit);
      return plural(n, name);
    }
  }
  return "less than a second";
}

/** "in 3 hours" or "2 days ago", relative to `now`. */
export function relativeTo(ms: number, now: number): string {
  return ms <= now ? `${roughDuration(now - ms)} ago` : `in ${roughDuration(ms - now)}`;
}

/** A 365-day year, for simulations that step through it day by day. */

export const DAYS = 365;
export const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;

/** Month (0–11) of each day of the year. */
export const MONTH_OF_DAY: readonly number[] = DAYS_IN_MONTH.flatMap((n, m) => Array.from({ length: n }, () => m));
/** Day of the year each month starts on. */
export const MONTH_START: readonly number[] = DAYS_IN_MONTH.map((_, m) => DAYS_IN_MONTH.slice(0, m).reduce((a, b) => a + b, 0));

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;
export const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"] as const;

/** "12 Jun" for a day of the year. */
export function dayLabel(day: number): string {
  let m = 0;
  while (m < 11 && (MONTH_START[m + 1] ?? DAYS) <= day) m++;
  return `${day - (MONTH_START[m] ?? 0) + 1} ${MONTHS[m]}`;
}

/**
 * Countdown engine: the time between two instants expressed every way people
 * ask for it (a calendar breakdown, totals, sleeps, weekends, working days).
 *
 * All calendar arithmetic runs in the runtime's local time zone, which in the
 * browser is the viewer's, so "days" follow the viewer's midnight and daylight
 * saving changes are absorbed rather than producing 23 or 25 hour "days".
 */

export const MS_PER_SECOND = 1000;
export const MS_PER_MINUTE = 60 * MS_PER_SECOND;
export const MS_PER_HOUR = 60 * MS_PER_MINUTE;
export const MS_PER_DAY = 24 * MS_PER_HOUR;

/** Widest date the tool accepts; keeps the weekday walk bounded. */
export const MIN_YEAR = 1900;
export const MAX_YEAR = 2200;

export interface CalendarBreakdown {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export interface CountdownResult {
  /** True when the target is earlier than now: the figures are "time since". */
  isPast: boolean;
  /** Absolute distance between the two instants. */
  totalMs: number;
  totalSeconds: number;
  totalMinutes: number;
  totalHours: number;
  /** Fractional days, for "1.5 days" style figures. */
  totalDays: number;
  totalWeeks: number;
  /** Whole local calendar days, the number shown on a countdown clock. */
  wholeDays: number;
  /** Remainder after the whole days, for the clock tiles. */
  clock: { hours: number; minutes: number; seconds: number };
  /** Whole weeks plus leftover days. */
  weeksAndDays: { weeks: number; days: number };
  /** Calendar-aware years, months, days, hours, minutes, seconds. */
  calendar: CalendarBreakdown;
  /** Midnights crossed between now and the target. */
  sleeps: number;
  /** Calendar dates after today up to and including the target date that fall Monday to Friday. */
  workingDays: number;
  /** Saturdays and Sundays in that same range. */
  weekendDays: number;
  /** Full Saturday-Sunday pairs in that range. */
  weekends: number;
}

export function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

/** Adds months, clamping the day so 31 Jan + 1 month is 28/29 Feb, not 3 Mar. */
export function addMonthsClamped(date: Date, months: number): Date {
  const result = new Date(date.getTime());
  const day = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() + months);
  result.setDate(Math.min(day, daysInMonth(result.getFullYear(), result.getMonth())));
  return result;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  result.setDate(result.getDate() + days);
  return result;
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Calendar distance from `from` to `to` (which must not be earlier than
 * `from`). Months are stepped with day clamping, days are stepped through
 * local midnights, and only the sub-day remainder is plain millisecond maths.
 */
export function calendarBetween(from: Date, to: Date): CalendarBreakdown {
  if (to.getTime() < from.getTime()) {
    throw new RangeError("calendarBetween: `to` must not be earlier than `from`");
  }

  let months =
    (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
  let cursor = addMonthsClamped(from, months);
  while (months > 0 && cursor.getTime() > to.getTime()) {
    months -= 1;
    cursor = addMonthsClamped(from, months);
  }

  const { days, remainderMs } = stepDays(cursor, to);
  return { years: Math.floor(months / 12), months: months % 12, days, ...splitClock(remainderMs) };
}

/**
 * Largest number of local calendar days that fit between two instants, plus
 * what is left over. Daylight saving makes some local days 23 or 25 hours, so
 * days are stepped through midnights rather than divided by 24 hours.
 */
export function stepDays(from: Date, to: Date): { days: number; remainderMs: number } {
  let days = Math.floor((to.getTime() - from.getTime()) / MS_PER_DAY);
  while (days > 0 && addDays(from, days).getTime() > to.getTime()) days -= 1;
  while (addDays(from, days + 1).getTime() <= to.getTime()) days += 1;
  return { days, remainderMs: to.getTime() - addDays(from, days).getTime() };
}

function splitClock(ms: number): { hours: number; minutes: number; seconds: number } {
  return {
    hours: Math.floor(ms / MS_PER_HOUR),
    minutes: Math.floor((ms % MS_PER_HOUR) / MS_PER_MINUTE),
    seconds: Math.floor((ms % MS_PER_MINUTE) / MS_PER_SECOND),
  };
}

/** Number of local midnights between two instants (0 when on the same date). */
export function midnightsBetween(from: Date, to: Date): number {
  const a = startOfDay(from).getTime();
  const b = startOfDay(to).getTime();
  // Rounded, not floored, so a 23-hour DST day still counts as one day.
  return Math.round((b - a) / MS_PER_DAY);
}

/**
 * How many of the positions 1..n (days after a start weekday) land on
 * `weekday`. Positions are counted from the start day, so position 1 is the
 * day after it.
 */
function countWeekday(startDay: number, n: number, weekday: number): number {
  if (n <= 0) return 0;
  const first = (weekday - startDay + 7) % 7 || 7;
  return first > n ? 0 : Math.floor((n - first) / 7) + 1;
}

/**
 * Counts weekdays, weekend days and full weekends among the calendar dates
 * strictly after `from`'s date up to and including `to`'s date. Arithmetic
 * rather than a day-by-day walk, because it runs on every clock tick.
 */
export function countDayTypes(from: Date, to: Date): {
  workingDays: number;
  weekendDays: number;
  weekends: number;
} {
  const span = midnightsBetween(from, to);
  const startDay = startOfDay(from).getDay();
  const saturdays = countWeekday(startDay, span, 6);
  const sundays = countWeekday(startDay, span, 0);
  return {
    workingDays: span - saturdays - sundays,
    weekendDays: saturdays + sundays,
    // A Saturday makes a full weekend only if its Sunday is also in range,
    // which is every Saturday except one on the final day.
    weekends: countWeekday(startDay, span - 1, 6),
  };
}

export function calculateCountdown(now: Date, target: Date): CountdownResult {
  const isPast = target.getTime() < now.getTime();
  const from = isPast ? target : now;
  const to = isPast ? now : target;

  const totalMs = to.getTime() - from.getTime();
  const totalSeconds = Math.floor(totalMs / MS_PER_SECOND);
  const { days: wholeDays, remainderMs } = stepDays(from, to);
  const { workingDays, weekendDays, weekends } = countDayTypes(from, to);

  return {
    isPast,
    totalMs,
    totalSeconds,
    totalMinutes: Math.floor(totalMs / MS_PER_MINUTE),
    totalHours: Math.floor(totalMs / MS_PER_HOUR),
    totalDays: totalMs / MS_PER_DAY,
    totalWeeks: totalMs / (7 * MS_PER_DAY),
    wholeDays,
    clock: splitClock(remainderMs),
    weeksAndDays: { weeks: Math.floor(wholeDays / 7), days: wholeDays % 7 },
    calendar: calendarBetween(from, to),
    sleeps: midnightsBetween(from, to),
    workingDays,
    weekendDays,
    weekends,
  };
}

/* ---------- Parsing and presets ---------- */

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^(\d{2}):(\d{2})$/;

/** Accepts "YYYY-MM-DD" for a real calendar date inside the supported range. */
export function isValidDateString(value: string): boolean {
  const m = DATE_RE.exec(value);
  if (!m) return false;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (year < MIN_YEAR || year > MAX_YEAR) return false;
  if (month < 1 || month > 12) return false;
  return day >= 1 && day <= daysInMonth(year, month - 1);
}

/** Accepts "HH:MM" on a 24-hour clock. */
export function isValidTimeString(value: string): boolean {
  const m = TIME_RE.exec(value);
  if (!m) return false;
  const hours = Number(m[1]);
  const minutes = Number(m[2]);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

/**
 * Builds a local-time Date from "YYYY-MM-DD" and "HH:MM" strings, or null
 * when either fails validation. A wall-clock time that does not exist on that
 * date (the hour skipped when clocks go forward) is moved later by the
 * runtime; compare `toTimeString(result)` with `time` to detect that.
 */
export function toLocalDate(date: string, time: string): Date | null {
  if (!isValidDateString(date) || !isValidTimeString(time)) return null;
  const d = DATE_RE.exec(date);
  const t = TIME_RE.exec(time);
  if (!d || !t) return null;
  const [, y = "", mo = "", day = ""] = d;
  const [, h = "", mi = ""] = t;
  return new Date(Number(y), Number(mo) - 1, Number(day), Number(h), Number(mi), 0, 0);
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function toDateString(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function toTimeString(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export interface Preset {
  key: string;
  label: string;
  /** Name shown in the hero, e.g. "Christmas". */
  name: string;
  /** Resolves the next occurrence from the current instant. */
  resolve: (now: Date) => { date: string; time: string };
}

function nextAnnual(now: Date, monthIndex: number, day: number): Date {
  const thisYear = new Date(now.getFullYear(), monthIndex, day);
  return startOfDay(thisYear).getTime() > startOfDay(now).getTime()
    ? thisYear
    : new Date(now.getFullYear() + 1, monthIndex, day);
}

function nextWeekday(now: Date, weekday: number): Date {
  const delta = (weekday - now.getDay() + 7) % 7 || 7;
  return addDays(startOfDay(now), delta);
}

export const PRESETS: Preset[] = [
  {
    key: "newyear",
    label: "New Year",
    name: "New Year",
    resolve: (now) => ({ date: toDateString(nextAnnual(now, 0, 1)), time: "00:00" }),
  },
  {
    key: "christmas",
    label: "Christmas",
    name: "Christmas",
    resolve: (now) => ({ date: toDateString(nextAnnual(now, 11, 25)), time: "00:00" }),
  },
  {
    key: "friday",
    label: "Friday 5pm",
    name: "the weekend",
    resolve: (now) => {
      const friday = now.getDay() === 5 && now.getHours() < 17 ? startOfDay(now) : nextWeekday(now, 5);
      return { date: toDateString(friday), time: "17:00" };
    },
  },
  {
    key: "monday",
    label: "Next Monday",
    name: "Monday",
    resolve: (now) => ({ date: toDateString(nextWeekday(now, 1)), time: "09:00" }),
  },
  {
    key: "monthend",
    label: "End of month",
    name: "the end of the month",
    resolve: (now) => ({
      date: toDateString(new Date(now.getFullYear(), now.getMonth(), daysInMonth(now.getFullYear(), now.getMonth()))),
      time: "23:59",
    }),
  },
  {
    key: "hundred",
    label: "100 days",
    name: "100 days from now",
    resolve: (now) => ({ date: toDateString(addDays(now, 100)), time: toTimeString(now) }),
  },
];

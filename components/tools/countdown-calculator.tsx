"use client";

import * as React from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MobileResultBar } from "@/components/calc/mobile-result-bar";
import { Stat } from "@/components/calc/stat";
import { useNow } from "@/hooks/use-now";
import { useUrlState, urlField } from "@/hooks/use-url-state";
import {
  DEFAULT_TIME,
  MAX_YEAR,
  MIN_YEAR,
  NAME_MAX,
  PRESETS,
  calculateCountdown,
  isValidDateString,
  isValidTimeString,
  toDateString,
  toLocalDate,
  toTimeString,
  type CalendarBreakdown,
  type CountdownResult,
} from "@/lib/countdown";
import { formatNumber } from "@/lib/currency";
import { cn } from "@/lib/utils";

const TILE_STYLES = ["bg-yellow tilt-1", "bg-sky tilt-2", "bg-pink tilt-3"];

/* ---------- Formatting ---------- */

function plural(n: number, unit: string): string {
  return `${formatNumber(n, 0)} ${unit}${n === 1 ? "" : "s"}`;
}

function formatCalendar(c: CalendarBreakdown): string {
  const big = [
    c.years > 0 && plural(c.years, "year"),
    c.months > 0 && plural(c.months, "month"),
    c.days > 0 && plural(c.days, "day"),
  ].filter((part): part is string => Boolean(part));
  if (big.length > 0) return big.join(", ");
  const small = [
    c.hours > 0 && plural(c.hours, "hour"),
    c.minutes > 0 && plural(c.minutes, "minute"),
  ].filter((part): part is string => Boolean(part));
  return small.length > 0 ? small.join(", ") : "Under a minute";
}

function formatWeeks({ weeks, days }: { weeks: number; days: number }): string {
  if (weeks === 0) return plural(days, "day");
  return days === 0 ? plural(weeks, "week") : `${plural(weeks, "week")}, ${plural(days, "day")}`;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

const longDate = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const shortDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" });

/** Path of the standalone card page for a given target. */
export function cardHref({ to, at, name }: { to: string; at: string; name: string }): string {
  const params = new URLSearchParams();
  if (to) params.set("to", to);
  if (at && at !== DEFAULT_TIME) params.set("at", at);
  if (name) params.set("name", name);
  const query = params.toString();
  return `/tools/countdown-calculator/card${query ? `?${query}` : ""}`;
}

export function nextNewYear(now: Date): string {
  return toDateString(new Date(now.getFullYear() + 1, 0, 1));
}

/* ---------- Inputs (memoised so the ticking clock never touches a half-typed date) ---------- */

interface InputsProps {
  date: string;
  time: string;
  name: string;
  /** True once the chosen moment is behind us, so the card reads "since" not "to". */
  isPast: boolean;
  onDate: (v: string) => void;
  onTime: (v: string) => void;
  onName: (v: string) => void;
}

const CountdownInputs = React.memo(function CountdownInputs({
  date,
  time,
  name,
  isPast,
  onDate,
  onTime,
  onName,
}: InputsProps) {
  const applyPreset = (key: string) => {
    const preset = PRESETS.find((p) => p.key === key);
    if (!preset) return;
    const next = preset.resolve(new Date());
    onDate(next.date);
    onTime(next.time);
    onName(preset.name);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{isPast ? "Counting up from" : "Counting down to"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <div className="space-y-1.5">
            <Label htmlFor="countdown-date" className="text-[15px] font-bold">
              Date
            </Label>
            <Input
              id="countdown-date"
              type="date"
              value={date}
              min={`${MIN_YEAR}-01-01`}
              max={`${MAX_YEAR}-12-31`}
              onChange={(e) => onDate(e.target.value)}
              className="h-10 rounded-xl border-foreground font-mono text-sm font-bold text-numeric"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="countdown-time" className="text-[15px] font-bold">
              Time
            </Label>
            <Input
              id="countdown-time"
              type="time"
              value={time}
              onChange={(e) => onTime(e.target.value)}
              className="h-10 rounded-xl border-foreground font-mono text-sm font-bold text-numeric sm:w-32"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="countdown-name" className="text-[15px] font-bold">
            What&apos;s the occasion?
          </Label>
          <Input
            id="countdown-name"
            type="text"
            value={name}
            maxLength={NAME_MAX}
            placeholder="Holiday, wedding, exam results, launch day"
            autoComplete="off"
            onChange={(e) => onName(e.target.value)}
            className="h-10 rounded-xl border-foreground text-sm font-bold"
          />
          <p className="text-xs font-semibold text-muted-foreground">
            Optional. It goes in the heading and in the link when you share it.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-[15px] font-bold">Quick picks</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.key}
                type="button"
                onClick={() => applyPreset(preset.key)}
                className="h-9 rounded-full border-2 border-foreground bg-card px-3.5 text-sm font-bold transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

/* ---------- Results ---------- */

function ClockTile({ value, unit, large }: { value: number; unit: string; large?: boolean }) {
  return (
    <div className={cn("rounded-2xl border-[2.5px] border-foreground bg-card px-1 py-3 text-center sm:py-4", large && "sm:py-6")}>
      <p className={cn("font-heading text-3xl font-black tracking-tighter text-numeric sm:text-5xl", large && "sm:text-7xl")}>
        {unit === "days" ? formatNumber(value, 0) : pad(value)}
      </p>
      <p className="mt-1 text-[11px] font-bold tracking-wide text-muted-foreground uppercase sm:text-xs">
        {value === 1 ? unit.slice(0, -1) : unit}
      </p>
    </div>
  );
}

export function CountdownResults({
  result,
  target,
  name,
  timeZone,
  requestedTime,
  shareHref,
  size = "default",
}: {
  result: CountdownResult | null;
  target: Date | null;
  name: string;
  timeZone: string | null;
  /** The HH:MM the user asked for, to flag when the date has no such time. */
  requestedTime: string;
  /** When set, a button in the hero opens the standalone, read-only card page. */
  shareHref?: string;
  /** "lg" is the standalone card page: bigger clock and tiles. */
  size?: "default" | "lg";
}) {
  const occasion = name.trim();
  const subject = occasion || (target ? shortDate.format(target) : "then");
  const heading = result ? `${result.isPast ? "Since" : "Until"} ${subject}` : "Until then";
  const clock = result?.clock ?? { hours: 0, minutes: 0, seconds: 0 };
  const days = result?.wholeDays ?? 0;
  const arrived = result !== null && result.isPast && result.totalSeconds < 60;
  const shiftedTime = target !== null && toTimeString(target) !== requestedTime;

  const tiles = result
    ? [
        { key: "sleeps", value: result.sleeps, unit: "sleep", note: result.isPast ? "Midnights since" : "Midnights to go" },
        { key: "weekends", value: result.weekends, unit: "weekend", note: "Full Saturday and Sunday pairs" },
        { key: "working", value: result.workingDays, unit: "working day", note: "Mon to Fri, holidays not removed" },
      ]
    : [];

  const large = size === "lg";

  return (
    <Card>
      <CardContent className={cn("space-y-5 pt-5", large && "sm:space-y-6 sm:pt-6")}>
        <div className={cn("rounded-2xl border-[2.5px] border-foreground bg-lilac p-4 sm:p-5", large && "sm:p-6")}>
          <div className="flex items-start justify-between gap-3">
            <p
              className={cn("min-w-0 truncate font-heading text-lg font-extrabold sm:text-xl", large && "sm:text-2xl")}
              aria-live="polite"
            >
              {arrived ? `It's here${occasion ? `: ${occasion}` : ""}!` : heading}
            </p>
            {shareHref && (
              <Link
                href={shareHref}
                title="Open this card on its own page, ready to share"
                className="sticker-sm inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-card px-3 text-xs font-bold transition-transform hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              >
                <ExternalLink className="size-3.5" strokeWidth={2.5} />
                Card page
              </Link>
            )}
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2 sm:gap-3" aria-label="Countdown clock">
            <ClockTile value={days} unit="days" large={large} />
            <ClockTile value={clock.hours} unit="hours" large={large} />
            <ClockTile value={clock.minutes} unit="minutes" large={large} />
            <ClockTile value={clock.seconds} unit="seconds" large={large} />
          </div>
          <p className="mt-3 text-sm font-semibold text-foreground/75">
            {target ? (
              <>
                {longDate.format(target)} at {toTimeString(target)}
                {timeZone ? ` (${timeZone.replace(/_/g, " ")})` : ""}
                {shiftedTime
                  ? `. ${requestedTime} does not exist on that date where you are (the clocks go forward), so the next real minute is used.`
                  : ""}
              </>
            ) : (
              "Loading your local time"
            )}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
          <Stat label="On the calendar" value={result ? formatCalendar(result.calendar) : "—"} />
          <Stat label="In weeks" value={result ? formatWeeks(result.weeksAndDays) : "—"} />
          <Stat label="Falls on a" value={target ? longDate.formatToParts(target).find((p) => p.type === "weekday")?.value ?? "—" : "—"} />
          <Stat label="Total hours" value={result ? formatNumber(result.totalHours, 0) : "—"} />
          <Stat label="Total minutes" value={result ? formatNumber(result.totalMinutes, 0) : "—"} />
          <Stat label="Total seconds" value={result ? formatNumber(result.totalSeconds, 0) : "—"} />
        </div>

        {tiles.length > 0 && (
          <div className="grid gap-4 border-t border-foreground/15 pt-5 sm:grid-cols-3">
            {tiles.map((tile, i) => (
              <div key={tile.key} className={cn("sticker rounded-2xl p-4", large && "sm:p-5", TILE_STYLES[i % TILE_STYLES.length])}>
                <p className={cn("font-heading text-4xl font-black tracking-tighter text-numeric", large && "sm:text-5xl")}>
                  {formatNumber(tile.value, 0)}
                </p>
                <p className="mt-1 text-sm font-bold">{tile.value === 1 ? tile.unit : `${tile.unit}s`}</p>
                <p className="mt-1 text-xs font-semibold text-foreground/70">{tile.note}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------- Tool ---------- */

export function CountdownCalculator() {
  const now = useNow();
  // Inputs hold whatever the native controls emit, including the partial
  // values a date field produces while a year is being typed; validation
  // happens when the target is derived, so typing is never snapped back.
  // `null` means "not set yet", distinct from a cleared field.
  const [date, setDateRaw] = React.useState<string | null>(null);
  const [time, setTimeRaw] = React.useState(DEFAULT_TIME);
  const [name, setNameRaw] = React.useState("");

  // Stable setters (plain state setters never change), so the memoised
  // inputs card only re-renders when a value actually changes.
  const setDate = React.useCallback((v: string) => setDateRaw(v.slice(0, 10)), []);
  const setTime = React.useCallback((v: string) => setTimeRaw(v.slice(0, 5)), []);
  const setName = React.useCallback((v: string) => setNameRaw(v.slice(0, NAME_MAX)), []);

  const validDate = date !== null && isValidDateString(date) ? date : "";
  const validTime = isValidTimeString(time) ? time : DEFAULT_TIME;

  useUrlState({
    to: urlField(validDate, setDate, ""),
    at: urlField(validTime, setTime, DEFAULT_TIME),
    name: urlField(name, setName, ""),
  });

  // The default target (next New Year) depends on the clock, so it stays
  // blank until hydration; that keeps the server and first client render equal.
  const defaultDate = now === null ? "" : nextNewYear(new Date(now));
  const resolvedDate = validDate || defaultDate;
  const target = toLocalDate(resolvedDate, validTime);
  const result = now !== null && target ? calculateCountdown(new Date(now), target) : null;
  const timeZone = now === null ? null : Intl.DateTimeFormat().resolvedOptions().timeZone;

  const barLabel = result?.isPast ? "Days since" : "Days to go";
  const barValue = result ? plural(result.wholeDays, "day") : "—";
  const shareHref = cardHref({ to: resolvedDate, at: validTime, name: name.trim() });

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[6fr_5fr] lg:items-start">
        <CountdownResults
          result={result}
          target={target}
          name={name}
          timeZone={timeZone}
          requestedTime={validTime}
          shareHref={shareHref}
        />
        <CountdownInputs
          date={date ?? defaultDate}
          time={time}
          name={name}
          isPast={result?.isPast ?? false}
          onDate={setDate}
          onTime={setTime}
          onName={setName}
        />
      </div>
      <MobileResultBar label={barLabel} value={barValue} />
    </>
  );
}

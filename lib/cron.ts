import { fail, ok, type Result } from "@/lib/result";

/*
 * Standard five-field crontab expressions (minute hour day-of-month month
 * day-of-week), as read by Vixie/ISC cron, cronie and most schedulers that
 * copy them. Seconds, years and Quartz's L/W/#/? extensions are rejected
 * with a hint rather than guessed at.
 */

export type FieldKey = "minute" | "hour" | "dom" | "month" | "dow";

export interface FieldSpec {
  key: FieldKey;
  label: string;
  min: number;
  max: number;
  /** Three-letter names accepted in place of numbers, indexed from `min`. */
  names?: readonly string[];
}

export const MONTH_NAMES = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"] as const;
export const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;

export const FIELDS: readonly FieldSpec[] = [
  { key: "minute", label: "Minute", min: 0, max: 59 },
  { key: "hour", label: "Hour", min: 0, max: 23 },
  { key: "dom", label: "Day of month", min: 1, max: 31 },
  { key: "month", label: "Month", min: 1, max: 12, names: MONTH_NAMES },
  { key: "dow", label: "Day of week", min: 0, max: 6, names: DAY_NAMES },
];

export const FIELD_BY_KEY = Object.fromEntries(FIELDS.map((f) => [f.key, f])) as Record<FieldKey, FieldSpec>;

/** One comma-separated piece of a field, kept structured so the builder and the describer can read it back. */
export type Part =
  | { kind: "any"; step?: number }
  | { kind: "value"; value: number }
  | { kind: "range"; from: number; to: number; step?: number };

export interface ParsedField {
  /** The token as written, names and all. */
  raw: string;
  /** Written starting with `*`: cron's "unrestricted" flag, which decides how day-of-month and day-of-week combine. */
  star: boolean;
  parts: Part[];
  /** Every matching value, sorted and unique. Day-of-week 7 is folded into 0. */
  values: number[];
}

export interface CronSchedule {
  /** The five tokens joined by single spaces (nicknames expanded). */
  expression: string;
  fields: Record<FieldKey, ParsedField>;
}

export const NICKNAMES: Record<string, string> = {
  "@yearly": "0 0 1 1 *",
  "@annually": "0 0 1 1 *",
  "@monthly": "0 0 1 * *",
  "@weekly": "0 0 * * 0",
  "@daily": "0 0 * * *",
  "@midnight": "0 0 * * *",
  "@hourly": "0 * * * *",
};

/* ---------- Parsing ---------- */

function parseValue(text: string, spec: FieldSpec): Result<number> {
  if (/^\d+$/.test(text)) {
    const n = Number(text);
    // Both 0 and 7 mean Sunday.
    if (spec.key === "dow" && n === 7) return ok(0);
    if (n < spec.min || n > spec.max) {
      return fail(`${spec.label} must be ${spec.min}-${spec.max}, got ${n}`);
    }
    return ok(n);
  }
  if (spec.names) {
    const i = spec.names.indexOf(text.toUpperCase() as never);
    if (i >= 0) return ok(spec.min + i);
    return fail(`"${text}" is not a ${spec.label.toLowerCase()} name (try ${spec.names[0]}-${spec.names[spec.names.length - 1]})`);
  }
  return fail(`"${text}" is not a number for ${spec.label.toLowerCase()}`);
}

function parseStep(text: string | undefined, spec: FieldSpec): Result<number | undefined> {
  if (text === undefined) return ok(undefined);
  if (!/^\d+$/.test(text) || Number(text) === 0) return fail(`Step in ${spec.label.toLowerCase()} must be a whole number of 1 or more, got "/${text}"`);
  return ok(Number(text));
}

function parsePart(text: string, spec: FieldSpec): Result<Part> {
  if (text === "") return fail(`${spec.label} has an empty entry (a stray comma?)`);
  const [body, stepText, extra] = text.split("/");
  if (extra !== undefined || body === undefined) return fail(`"${text}" has more than one "/"`);
  const step = parseStep(stepText, spec);
  if (!step.ok) return step;

  if (body === "*") return ok(step.value === undefined ? { kind: "any" } : { kind: "any", step: step.value });

  const dash = body.indexOf("-");
  if (dash >= 0) {
    const from = parseValue(body.slice(0, dash), spec);
    if (!from.ok) return from;
    const to = parseValue(body.slice(dash + 1), spec);
    if (!to.ok) return to;
    // Sunday written as 7 at the end of a range (e.g. 5-7) means Saturday to Sunday, so keep it as 7 there.
    const toValue = spec.key === "dow" && body.slice(dash + 1) === "7" ? 7 : to.value;
    if (from.value > toValue) return fail(`Range "${body}" in ${spec.label.toLowerCase()} runs backwards`);
    return ok(step.value === undefined ? { kind: "range", from: from.value, to: toValue } : { kind: "range", from: from.value, to: toValue, step: step.value });
  }

  const value = parseValue(body, spec);
  if (!value.ok) return value;
  // Vixie cron reads "5/15" as "5 to the end, every 15".
  if (step.value !== undefined) return ok({ kind: "range", from: value.value, to: spec.max, step: step.value });
  return ok({ kind: "value", value: value.value });
}

function expand(parts: Part[], spec: FieldSpec): number[] {
  const set = new Set<number>();
  for (const part of parts) {
    if (part.kind === "value") {
      set.add(part.value);
      continue;
    }
    const from = part.kind === "any" ? spec.min : part.from;
    const to = part.kind === "any" ? spec.max : part.to;
    const step = part.step ?? 1;
    for (let v = from; v <= to; v += step) set.add(spec.key === "dow" && v === 7 ? 0 : v);
  }
  return [...set].sort((a, b) => a - b);
}

export function parseField(raw: string, spec: FieldSpec): Result<ParsedField> {
  if (raw === "?") return fail(`"?" is Quartz syntax; use "*" for ${spec.label.toLowerCase()}`);
  if (/[LW#]/i.test(raw.replace(/[A-Za-z]{3}/g, ""))) {
    return fail(`"${raw}" uses L, W or # which only Quartz understands; standard cron has no equivalent`);
  }
  const parts: Part[] = [];
  for (const piece of raw.split(",")) {
    const part = parsePart(piece, spec);
    if (!part.ok) return part;
    parts.push(part.value);
  }
  return ok({ raw, star: raw.startsWith("*"), parts, values: expand(parts, spec) });
}

export function parseCron(input: string): Result<CronSchedule> {
  const trimmed = input.trim();
  if (trimmed === "") return fail("Type a cron expression, or pick a preset");
  if (trimmed.startsWith("@")) {
    const lower = trimmed.toLowerCase();
    if (lower === "@reboot") return fail("@reboot runs once when the machine starts, so it has no schedule to show");
    const expanded = NICKNAMES[lower];
    if (!expanded) return fail(`Unknown nickname "${trimmed}" (known: ${Object.keys(NICKNAMES).join(", ")})`);
    return parseCron(expanded);
  }
  const tokens = trimmed.split(/\s+/);
  if (tokens.length !== 5) {
    const hint =
      tokens.length === 6 || tokens.length === 7
        ? "; six or seven fields is the Quartz / seconds format, which this tool doesn't cover"
        : "";
    return fail(`Expected 5 fields (minute hour day month weekday), got ${tokens.length}${hint}`);
  }
  const fields = {} as Record<FieldKey, ParsedField>;
  for (let i = 0; i < FIELDS.length; i++) {
    const spec = FIELDS[i]!;
    const parsed = parseField(tokens[i]!, spec);
    if (!parsed.ok) return parsed;
    fields[spec.key] = parsed.value;
  }
  return ok({ expression: tokens.join(" "), fields });
}

/* ---------- Builder helpers ---------- */

export type FieldMode = "any" | "specific" | "step" | "range" | "custom";

/** Which builder control a field fits, or "custom" when it mixes forms only the text box can edit. */
export function fieldMode(field: ParsedField): FieldMode {
  const [first] = field.parts;
  if (!first) return "custom";
  if (field.parts.length === 1) {
    if (first.kind === "any") return first.step === undefined ? "any" : "step";
    if (first.kind === "range") return first.step === undefined ? "range" : "custom";
  }
  if (field.parts.every((p) => p.kind === "value")) return "specific";
  return "custom";
}

/** The token for a builder choice. Specific values are written as numbers; names are only for reading. */
export function fieldToken(spec: FieldSpec, mode: Exclude<FieldMode, "custom">, config: { values?: number[]; step?: number; from?: number; to?: number }): string {
  switch (mode) {
    case "any":
      return "*";
    case "step":
      return `*/${Math.max(1, Math.round(config.step ?? 1))}`;
    case "range": {
      const from = Math.min(Math.max(config.from ?? spec.min, spec.min), spec.max);
      const to = Math.min(Math.max(config.to ?? spec.max, from), spec.max);
      return `${from}-${to}`;
    }
    case "specific": {
      const values = [...new Set(config.values ?? [])].filter((v) => v >= spec.min && v <= spec.max).sort((a, b) => a - b);
      return values.length === 0 ? "*" : values.join(",");
    }
  }
}

export function replaceField(expression: string, key: FieldKey, token: string): string {
  const tokens = expression.trim().split(/\s+/);
  const index = FIELDS.findIndex((f) => f.key === key);
  tokens[index] = token;
  return tokens.join(" ");
}

/* ---------- Describing ---------- */

function list(items: string[], joiner = "and"): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} ${joiner} ${items[items.length - 1]}`;
}

function ordinal(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

function every(n: number, unit: string): string {
  return n === 1 ? `every ${unit}` : `every ${ordinal(n)} ${unit}`;
}

const DAY_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTH_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function dayName(v: number): string {
  return DAY_FULL[v % 7] ?? String(v);
}

function monthName(v: number): string {
  return MONTH_FULL[v - 1] ?? String(v);
}

const pad2 = (n: number) => String(n).padStart(2, "0");

/**
 * A part as a phrase, with `show` turning a value into words ("Monday",
 * "January", "1st") and `unit` naming the field for "every Nth unit".
 */
function describePart(part: Part, spec: FieldSpec, show: (v: number) => string, unit: string): string {
  if (part.kind === "value") return show(part.value);
  if (part.kind === "any") return part.step === undefined ? `every ${unit}` : every(part.step, unit);
  const span = `${show(part.from)} through ${show(part.to)}`;
  if (part.step === undefined) return span;
  return `${every(part.step, unit)} from ${span}`;
}

function describeParts(field: ParsedField, spec: FieldSpec, show: (v: number) => string, unit: string): string {
  return list(field.parts.map((p) => describePart(p, spec, show, unit)));
}

function describeTime(minute: ParsedField, hour: ParsedField): string {
  const minuteMode = fieldMode(minute);
  const hourMode = fieldMode(hour);
  const minuteSpec = FIELD_BY_KEY.minute;
  const hourSpec = FIELD_BY_KEY.hour;

  // Clock times: both fields are lists of values and one of them is a single value.
  if (minuteMode === "specific" && hourMode === "specific" && (minute.values.length === 1 || hour.values.length === 1)) {
    const times = hour.values.flatMap((h) => minute.values.map((m) => `${pad2(h)}:${pad2(m)}`));
    return `At ${list(times)}`;
  }

  if (minuteMode === "any") {
    if (hourMode === "any") return "Every minute";
    return `Every minute ${describeHours(hour, hourSpec)}`;
  }

  if (minuteMode === "step") {
    const step = minute.parts[0]?.kind === "any" ? (minute.parts[0].step ?? 1) : 1;
    const head = step === 1 ? "Every minute" : `Every ${step} minutes`;
    return hourMode === "any" ? head : `${head} ${describeHours(hour, hourSpec)}`;
  }

  const minutes = describeParts(minute, minuteSpec, String, "minute");
  const head = minuteMode === "range" ? `Every minute from ${minutes}` : `At minute ${minutes}`;
  if (hourMode === "any") return `${head} past every hour`;
  return `${head} ${describeHours(hour, hourSpec)}`;
}

function describeHours(hour: ParsedField, spec: FieldSpec): string {
  const mode = fieldMode(hour);
  if (mode === "specific") {
    return hour.values.length === 1 ? `past hour ${hour.values[0]}` : `past hours ${list(hour.values.map(String))}`;
  }
  if (mode === "range") {
    const range = hour.parts[0];
    if (range?.kind === "range") return `between ${pad2(range.from)}:00 and ${pad2(range.to)}:59`;
  }
  if (mode === "step") {
    const step = hour.parts[0]?.kind === "any" ? (hour.parts[0].step ?? 1) : 1;
    return step === 1 ? "past every hour" : `past every ${ordinal(step)} hour`;
  }
  return `past ${describeParts(hour, spec, (h) => `hour ${h}`, "hour")}`;
}

function describeDom(dom: ParsedField, spec: FieldSpec): string {
  if (fieldMode(dom) === "step") {
    const step = dom.parts[0]?.kind === "any" ? (dom.parts[0].step ?? 1) : 1;
    return `${every(step, "day")} of the month`;
  }
  return `on the ${describeParts(dom, spec, ordinal, "day")} of the month`;
}

function describeDow(dow: ParsedField, spec: FieldSpec): string {
  if (fieldMode(dow) === "step") {
    const step = dow.parts[0]?.kind === "any" ? (dow.parts[0].step ?? 1) : 1;
    return `${every(step, "day")} of the week`;
  }
  return `on ${describeParts(dow, spec, dayName, "day of the week")}`;
}

function describeMonth(month: ParsedField, spec: FieldSpec): string {
  if (fieldMode(month) === "step") {
    const step = month.parts[0]?.kind === "any" ? (month.parts[0].step ?? 1) : 1;
    return every(step, "month");
  }
  return `in ${describeParts(month, spec, monthName, "month")}`;
}

/** A bare `*`: the field says nothing at all. */
const isPlainAny = (field: ParsedField): boolean =>
  field.parts.length === 1 && field.parts[0]?.kind === "any" && field.parts[0].step === undefined;

/**
 * Whether day-of-month and day-of-week both have to match. Vixie cron ANDs
 * them when either is written with a leading `*`, and ORs them otherwise.
 */
export function daysCombineWithAnd(schedule: CronSchedule): boolean {
  return schedule.fields.dom.star || schedule.fields.dow.star;
}

/** The schedule in plain English, e.g. "At 09:30 on Monday through Friday in January". */
export function describeCron(schedule: CronSchedule): string {
  const { minute, hour, dom, month, dow } = schedule.fields;
  const pieces = [describeTime(minute, hour)];

  const domText = isPlainAny(dom) ? null : describeDom(dom, FIELD_BY_KEY.dom);
  const dowText = isPlainAny(dow) ? null : describeDow(dow, FIELD_BY_KEY.dow);
  if (domText && dowText) pieces.push(`${domText} ${daysCombineWithAnd(schedule) ? "and" : "or"} ${dowText}`);
  else if (domText) pieces.push(domText);
  else if (dowText) pieces.push(dowText);

  if (!isPlainAny(month)) pieces.push(describeMonth(month, FIELD_BY_KEY.month));
  return pieces.join(" ");
}

/** Short phrase for one field, for the builder's section summaries. */
export function describeField(field: ParsedField, key: FieldKey): string {
  const spec = FIELD_BY_KEY[key];
  switch (key) {
    case "minute":
      return fieldMode(field) === "any" ? "Every minute" : fieldMode(field) === "specific" ? `Minute ${list(field.values.map(String))}` : cap(describeParts(field, spec, String, "minute"));
    case "hour":
      return fieldMode(field) === "any" ? "Every hour" : fieldMode(field) === "specific" ? `Hour ${list(field.values.map(String))}` : cap(describeParts(field, spec, String, "hour"));
    case "dom":
      return fieldMode(field) === "any" ? "Every day" : cap(describeDom(field, spec).replace(/^on the /, "The "));
    case "month":
      return fieldMode(field) === "any" ? "Every month" : cap(describeMonth(field, spec).replace(/^in /, ""));
    case "dow":
      return fieldMode(field) === "any" ? "Every day of the week" : cap(describeDow(field, spec).replace(/^on /, ""));
  }
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/* ---------- Next runs ---------- */

const MINUTE = 60_000;

interface Wall {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let f = formatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    });
    formatters.set(timeZone, f);
  }
  return f;
}

/** Wall-clock parts of an instant in a zone. */
function wallOf(ms: number, timeZone: string): Wall {
  const parts = formatterFor(timeZone).formatToParts(new Date(ms));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour") % 24, minute: get("minute") };
}

/** A wall time laid out on the UTC timeline, so Date's UTC getters read it back. */
function wallToFake(w: Wall): number {
  return Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute);
}

/** The zone's offset from UTC at an instant, in ms (positive east of Greenwich). */
function offsetAt(ms: number, timeZone: string): number {
  return wallToFake(wallOf(ms, timeZone)) - Math.floor(ms / MINUTE) * MINUTE;
}

/**
 * The instant at which a zone's clocks show `fake` (a wall time on the UTC
 * timeline), or null when that wall time is skipped by a clocks-forward
 * change. In the repeated hour after clocks go back, the first occurrence.
 */
function fakeToInstant(fake: number, timeZone: string): number | null {
  const candidates = new Set<number>();
  const first = fake - offsetAt(fake, timeZone);
  candidates.add(first);
  candidates.add(fake - offsetAt(first, timeZone));
  // An offset from either side of a transition catches both halves of a repeated hour.
  candidates.add(fake - offsetAt(fake - 3 * 60 * MINUTE, timeZone));
  candidates.add(fake - offsetAt(fake + 3 * 60 * MINUTE, timeZone));
  const valid = [...candidates].filter((ms) => wallToFake(wallOf(ms, timeZone)) === fake).sort((a, b) => a - b);
  return valid[0] ?? null;
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    formatterFor(timeZone);
    return true;
  } catch {
    return false;
  }
}

function dayMatches(schedule: CronSchedule, dom: number, dow: number): boolean {
  const domField = schedule.fields.dom;
  const dowField = schedule.fields.dow;
  const domOk = domField.values.includes(dom);
  const dowOk = dowField.values.includes(dow);
  return daysCombineWithAnd(schedule) ? domOk && dowOk : domOk || dowOk;
}

/** How far ahead to look before giving up (e.g. "0 0 31 2 *" never fires). */
const HORIZON_YEARS = 8;
const MAX_STEPS = 500_000;

/**
 * The next `count` instants (ms since epoch) strictly after `fromMs` at which
 * the schedule fires, reading the fields as wall-clock time in `timeZone`.
 * Fewer are returned when nothing matches within eight years.
 */
export function nextRuns(schedule: CronSchedule, fromMs: number, count: number, timeZone: string): number[] {
  const runs: number[] = [];
  const { minute, hour, month } = schedule.fields;
  const start = wallToFake(wallOf(Math.floor(fromMs / MINUTE) * MINUTE, timeZone)) + MINUTE;
  const horizon = start + HORIZON_YEARS * 366 * 24 * 60 * MINUTE;
  let t = start;
  let steps = 0;

  while (runs.length < count && t < horizon && steps++ < MAX_STEPS) {
    const d = new Date(t);
    const y = d.getUTCFullYear();
    const mo = d.getUTCMonth();
    const day = d.getUTCDate();
    if (!month.values.includes(mo + 1)) {
      t = Date.UTC(y, mo + 1, 1);
      continue;
    }
    if (!dayMatches(schedule, day, d.getUTCDay())) {
      t = Date.UTC(y, mo, day + 1);
      continue;
    }
    if (!hour.values.includes(d.getUTCHours())) {
      t = Date.UTC(y, mo, day, d.getUTCHours() + 1);
      continue;
    }
    if (!minute.values.includes(d.getUTCMinutes())) {
      t += MINUTE;
      continue;
    }
    const instant = fakeToInstant(t, timeZone);
    if (instant !== null && instant > fromMs) runs.push(instant);
    t += MINUTE;
  }
  return runs;
}

/** Presets offered in the UI, in the order shown. */
export const PRESETS: readonly { label: string; expression: string }[] = [
  { label: "Every minute", expression: "* * * * *" },
  { label: "Every 5 minutes", expression: "*/5 * * * *" },
  { label: "Hourly", expression: "0 * * * *" },
  { label: "Daily at midnight", expression: "0 0 * * *" },
  { label: "Weekdays at 9am", expression: "0 9 * * 1-5" },
  { label: "Weekly on Sunday", expression: "0 0 * * 0" },
  { label: "Monthly on the 1st", expression: "0 0 1 * *" },
  { label: "Yearly on 1 Jan", expression: "0 0 1 1 *" },
];

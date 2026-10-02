"use client";

import * as React from "react";
import { Calendar, CalendarDays, Check, Clock, Copy, Hash, Timer } from "lucide-react";
import { Callout } from "@/components/calc/callout";
import { PillButton, TogglePill } from "@/components/calc/pill-button";
import { Section, useSectionState } from "@/components/calc/section";
import { Segmented } from "@/components/calc/segmented";
import { SliderField } from "@/components/calc/slider-field";
import { MobileResultBar } from "@/components/calc/mobile-result-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCopy } from "@/hooks/use-copy";
import { useNow } from "@/hooks/use-now";
import { useUrlState, urlField } from "@/hooks/use-url-state";
import {
  FIELDS,
  PRESETS,
  daysCombineWithAnd,
  describeCron,
  describeField,
  fieldMode,
  fieldToken,
  isValidTimeZone,
  nextRuns,
  parseCron,
  replaceField,
  type CronSchedule,
  type FieldKey,
  type FieldMode,
  type FieldSpec,
  type ParsedField,
} from "@/lib/cron";
import { relativeTo } from "@/lib/duration";
import { cn } from "@/lib/utils";

const DEFAULT_EXPRESSION = "30 9 * * 1-5";
const RUN_COUNT = 5;

const FIELD_ICONS: Record<FieldKey, React.ComponentType<{ className?: string }>> = {
  minute: Timer,
  hour: Clock,
  dom: Hash,
  month: Calendar,
  dow: CalendarDays,
};

const FIELD_TINT: Record<FieldKey, string> = {
  minute: "bg-yellow",
  hour: "bg-pink",
  dom: "bg-mint",
  month: "bg-sky",
  dow: "bg-lilac",
};

const MODE_OPTIONS: { value: Exclude<FieldMode, "custom">; label: string }[] = [
  { value: "any", label: "Every" },
  { value: "specific", label: "Pick" },
  { value: "step", label: "Every N" },
  { value: "range", label: "Range" },
];

/** Zones offered in the picker, besides the visitor's own and UTC. */
const TIME_ZONES = [
  "Europe/London",
  "Europe/Dublin",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Madrid",
  "Europe/Rome",
  "Europe/Amsterdam",
  "Europe/Stockholm",
  "Europe/Warsaw",
  "Europe/Bucharest",
  "Europe/Athens",
  "Europe/Istanbul",
  "Europe/Moscow",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Sao_Paulo",
  "America/Mexico_City",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Hong_Kong",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Australia/Sydney",
  "Australia/Perth",
  "Pacific/Auckland",
  "Africa/Johannesburg",
  "Africa/Lagos",
  "Africa/Cairo",
];

const subscribeNever = () => () => {};
const readLocalZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

/** The visitor's IANA zone, or null before hydration so the server and client agree. */
function useLocalTimeZone(): string | null {
  return React.useSyncExternalStore(subscribeNever, readLocalZone, () => null);
}

const zoneLabel = (zone: string) => zone.replace(/_/g, " ").replace(/^.*\//, "");

function shortName(value: number, spec: FieldSpec): string {
  const name = spec.names?.[value - spec.min];
  return name ? name.charAt(0) + name.slice(1).toLowerCase() : String(value);
}

function CopyButton({ text }: { text: string }) {
  const { state, copy } = useCopy();
  return (
    <PillButton onClick={() => copy(text)} aria-live="polite" className="h-8 px-3 text-[13px]">
      {state === "copied" ? <Check className="size-3.5" strokeWidth={2.5} /> : <Copy className="size-3.5" strokeWidth={2.5} />}
      {state === "copied" ? "Copied" : state === "failed" ? "Could not copy" : "Copy"}
    </PillButton>
  );
}

/** The five tokens as coloured chips, each labelled with its field; clicking opens that field's section. */
function TokenChips({ schedule, onPick }: { schedule: CronSchedule; onPick: (key: FieldKey) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {FIELDS.map((spec) => (
        <button
          key={spec.key}
          type="button"
          onClick={() => onPick(spec.key)}
          className={cn(
            "flex min-w-14 flex-col items-center rounded-xl border-2 border-foreground px-2.5 py-1.5 transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
            FIELD_TINT[spec.key],
          )}
        >
          <span className="font-mono text-base font-bold">{schedule.fields[spec.key].raw}</span>
          <span className="text-[11px] font-bold text-foreground/70">{spec.label.toLowerCase()}</span>
        </button>
      ))}
    </div>
  );
}

function ValueGrid({ spec, field, onChange }: { spec: FieldSpec; field: ParsedField; onChange: (values: number[]) => void }) {
  const selected = new Set(field.values);
  const all: number[] = [];
  for (let v = spec.min; v <= spec.max; v++) all.push(v);
  const toggle = (v: number) => {
    const next = new Set(selected);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    onChange([...next]);
  };
  const named = spec.names !== undefined;
  return (
    <div className={cn("grid gap-1.5", named ? "grid-cols-4 sm:grid-cols-6" : spec.max > 31 ? "grid-cols-10" : "grid-cols-8")}>
      {all.map((v) => {
        const on = selected.has(v);
        return (
          <button
            key={v}
            type="button"
            aria-pressed={on}
            onClick={() => toggle(v)}
            className={cn(
              "h-8 rounded-lg border-2 border-foreground text-[13px] font-bold tabular-nums transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
              on ? "bg-foreground text-background" : "bg-card hover:bg-secondary",
            )}
          >
            {shortName(v, spec)}
          </button>
        );
      })}
    </div>
  );
}

function BoundSelect({ id, label, spec, value, onChange }: { id: string; label: string; spec: FieldSpec; value: number; onChange: (v: number) => void }) {
  const all: number[] = [];
  for (let v = spec.min; v <= spec.max; v++) all.push(v);
  return (
    <div className="flex items-center gap-2">
      <Label htmlFor={id} className="text-sm text-muted-foreground">
        {label}
      </Label>
      <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
        <SelectTrigger id={id} size="sm" className="w-fit font-medium">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {all.map((v) => (
            <SelectItem key={v} value={String(v)}>
              {shortName(v, spec)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function FieldEditor({ spec, field, onToken }: { spec: FieldSpec; field: ParsedField; onToken: (token: string) => void }) {
  const mode = fieldMode(field);
  const part = field.parts[0];
  const step = part?.kind === "any" ? (part.step ?? 1) : part?.kind === "range" ? (part.step ?? 1) : 1;
  const from = part?.kind === "range" ? part.from : (field.values[0] ?? spec.min);
  const to = part?.kind === "range" ? part.to : (field.values[field.values.length - 1] ?? spec.max);
  const unit = spec.key === "dom" ? "day" : spec.key === "dow" ? "weekday" : spec.label.toLowerCase();

  const setMode = (next: Exclude<FieldMode, "custom">) => {
    if (next === mode) return;
    const defaults = {
      any: {},
      // Carry the current values over so a switch to Pick keeps what the field already meant.
      specific: { values: mode === "any" ? [spec.min] : field.values },
      step: { step: spec.key === "minute" ? 15 : spec.key === "hour" ? 6 : 2 },
      range: { from: spec.key === "hour" ? 9 : spec.min, to: spec.key === "hour" ? 17 : spec.key === "dow" ? 5 : spec.max },
    } as const;
    onToken(fieldToken(spec, next, defaults[next]));
  };

  return (
    <>
      <Segmented
        label={`${spec.label} mode`}
        size="sm"
        value={mode === "custom" ? "any" : mode}
        onChange={setMode}
        options={MODE_OPTIONS}
        className={cn(mode === "custom" && "opacity-60")}
      />
      {mode === "custom" && (
        <p className="text-xs font-semibold text-muted-foreground">
          <span className="font-mono">{field.raw}</span> mixes lists, ranges and steps, which the buttons can&apos;t express. Edit it in the expression box, or pick a mode above to replace it.
        </p>
      )}
      {mode === "any" && (
        <p className="text-xs font-semibold text-muted-foreground">
          <span className="font-mono">*</span>: no restriction on the {unit}.
        </p>
      )}
      {mode === "specific" && <ValueGrid spec={spec} field={field} onChange={(values) => onToken(fieldToken(spec, "specific", { values }))} />}
      {mode === "step" && (
        <>
          <SliderField
            id={`cron-${spec.key}-step`}
            label={`Every N ${unit}s`}
            value={step}
            onChange={(v) => onToken(fieldToken(spec, "step", { step: v }))}
            min={1}
            max={spec.max - spec.min + 1}
            step={1}
            decimals={0}
          />
          <p className="text-xs font-semibold text-muted-foreground">
            <span className="font-mono">*/{step}</span> counts from {shortName(spec.min, spec)}
            {(spec.max - spec.min + 1) % step !== 0 ? ", so the last gap in each cycle is shorter." : "."}
          </p>
        </>
      )}
      {mode === "range" && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <BoundSelect id={`cron-${spec.key}-from`} label="From" spec={spec} value={from} onChange={(v) => onToken(fieldToken(spec, "range", { from: v, to: Math.max(v, to) }))} />
          <BoundSelect id={`cron-${spec.key}-to`} label="to" spec={spec} value={to} onChange={(v) => onToken(fieldToken(spec, "range", { from: Math.min(from, v), to: v }))} />
        </div>
      )}
    </>
  );
}

function RunList({ schedule, timeZone }: { schedule: CronSchedule; timeZone: string }) {
  const now = useNow();
  // Runs only change once a minute; a stable key stops the once-a-second tick recomputing them.
  const minute = now === null ? null : Math.floor(now / 60_000) * 60_000;
  const runs = React.useMemo(() => (minute === null ? null : nextRuns(schedule, minute - 1, RUN_COUNT, timeZone)), [schedule, minute, timeZone]);
  const format = React.useMemo(
    () => new Intl.DateTimeFormat("en-GB", { timeZone, weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }),
    [timeZone],
  );

  if (runs === null || now === null) {
    return <p className="text-sm font-semibold text-muted-foreground">Working out the next runs…</p>;
  }
  if (runs.length === 0) {
    return (
      <Callout tone="warn">
        Nothing in the next eight years matches this. Check the day of the month against the months chosen (31 April, 30 February and the like never come round).
      </Callout>
    );
  }
  return (
    <ol className="divide-y divide-foreground/15 rounded-2xl border-2 border-foreground">
      {runs.map((ms, i) => (
        <li key={ms} className="flex items-baseline justify-between gap-3 px-3.5 py-2.5">
          <span className={cn("font-mono text-sm font-bold tabular-nums", i === 0 ? "" : "text-foreground/80")}>{format.format(ms)}</span>
          <span className="text-xs font-semibold text-muted-foreground">{relativeTo(ms, now)}</span>
        </li>
      ))}
    </ol>
  );
}

export function CronBuilder() {
  const [expression, setExpression] = React.useState(DEFAULT_EXPRESSION);
  const [zoneChoice, setZoneChoice] = React.useState("local");
  const sections = useSectionState();
  const localZone = useLocalTimeZone();

  useUrlState({
    cron: urlField(expression, setExpression, DEFAULT_EXPRESSION),
    tz: urlField(zoneChoice, setZoneChoice, "local"),
  });

  const parsed = parseCron(expression);
  const schedule = parsed.ok ? parsed.value : null;
  // The last good schedule keeps the builder usable while the text box is mid-edit.
  const [lastGood, setLastGood] = React.useState<CronSchedule | null>(null);
  if (schedule && schedule.expression !== lastGood?.expression) setLastGood(schedule);
  const shown = schedule ?? lastGood;

  const timeZone = zoneChoice === "local" ? (localZone ?? "UTC") : isValidTimeZone(zoneChoice) ? zoneChoice : "UTC";
  const zones = React.useMemo(() => {
    const set = new Set(["UTC", ...TIME_ZONES]);
    if (localZone) set.delete(localZone);
    return [...set];
  }, [localZone]);

  const setField = (key: FieldKey, token: string) => {
    if (!shown) return;
    setExpression(replaceField(shown.expression, key, token));
  };
  const openField = (key: FieldKey) => {
    if (!sections.isOpen(key)) sections.toggle(key);
    document.getElementById(`cron-section-${key}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const description = schedule ? describeCron(schedule) : null;
  const bothDays = schedule ? !schedule.fields.dom.star && !schedule.fields.dow.star : false;
  const andDays = schedule ? daysCombineWithAnd(schedule) && schedule.fields.dom.parts.some((p) => p.kind === "any" && p.step !== undefined) && !schedule.fields.dow.star : false;

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[5fr_6fr] lg:items-start">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Expression</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  id="cron-expression"
                  aria-label="Cron expression"
                  value={expression}
                  onChange={(e) => setExpression(e.target.value)}
                  spellCheck={false}
                  autoComplete="off"
                  autoCapitalize="off"
                  aria-invalid={!parsed.ok}
                  className="h-12 border-foreground font-mono text-lg tracking-wide md:pointer-fine:text-lg"
                />
                <CopyButton text={expression} />
              </div>
              {!parsed.ok && (
                <p role="alert" className="text-sm font-bold text-destructive">
                  {parsed.error}
                </p>
              )}
              {shown && <TokenChips schedule={shown} onPick={openField} />}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">Presets</p>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <TogglePill key={p.expression} pressed={schedule?.expression === p.expression} onPressedChange={() => setExpression(p.expression)} className="h-8 px-3 text-[13px]">
                    {p.label}
                  </TogglePill>
                ))}
              </div>
            </div>

            {shown && (
              <div className="space-y-3">
                <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">Build it field by field</p>
                {FIELDS.map((spec) => {
                  const field = shown.fields[spec.key];
                  return (
                    <div key={spec.key} id={`cron-section-${spec.key}`}>
                      <Section
                        icon={FIELD_ICONS[spec.key]}
                        title={spec.label}
                        summary={describeField(field, spec.key)}
                        active={fieldMode(field) !== "any"}
                        open={sections.isOpen(spec.key)}
                        onToggle={() => sections.toggle(spec.key)}
                      >
                        <FieldEditor spec={spec} field={field} onToken={(token) => setField(spec.key, token)} />
                      </Section>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6 lg:sticky lg:top-20">
          <Card>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-1.5">
                <p className="text-base font-bold">This runs</p>
                <p className={cn("font-heading font-black tracking-tight", (description?.length ?? 0) > 60 ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl")}>
                  {description ?? "…"}
                </p>
                {!parsed.ok && <p className="text-sm font-semibold text-muted-foreground">Fix the expression to see its schedule.</p>}
              </div>

              {bothDays && (
                <Callout>
                  Day of month and day of week are both set, so cron runs when <strong>either</strong> matches, not both. To mean &ldquo;the first Monday&rdquo; you need a script that checks the date.
                </Callout>
              )}
              {andDays && (
                <Callout>
                  Because day of month starts with <span className="font-mono">*</span>, both day fields must match: cron only ORs them when neither is written with a star.
                </Callout>
              )}

              {schedule && (
                <div className="space-y-3 border-t border-foreground/15 pt-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[15px] font-bold">Next {RUN_COUNT} runs</p>
                    <Select value={zoneChoice} onValueChange={setZoneChoice}>
                      <SelectTrigger size="sm" className="w-fit max-w-56 font-medium" aria-label="Time zone">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent align="end" className="max-h-80">
                        <SelectItem value="local">{localZone ? `${zoneLabel(localZone)} (yours)` : "Your time zone"}</SelectItem>
                        {zones.map((z) => (
                          <SelectItem key={z} value={z}>
                            {z === "UTC" ? "UTC" : zoneLabel(z)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <RunList schedule={schedule} timeZone={timeZone} />
                  <p className="text-xs font-semibold text-muted-foreground">
                    Shown in {timeZone === "UTC" ? "UTC" : timeZone.replace(/_/g, " ")}. Cron reads the fields in the server&apos;s own time zone, so pick the zone the machine runs in.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <MobileResultBar label="Schedule" value={schedule ? schedule.expression : "Invalid"} />
    </>
  );
}

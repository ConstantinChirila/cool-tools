"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CurrencySelect } from "@/components/calc/currency-select";
import { MobileResultBar } from "@/components/calc/mobile-result-bar";
import { NumberField } from "@/components/calc/number-field";
import { Segmented } from "@/components/calc/segmented";
import { SliderField } from "@/components/calc/slider-field";
import { SwitchField } from "@/components/calc/switch-field";
import { HeroStat, Stat } from "@/components/calc/stat";
import { useCurrency } from "@/hooks/use-currency";
import { useUrlState, urlField } from "@/hooks/use-url-state";
import {
  EQUIVALENTS,
  calculateCommuteCost,
  calculateCommuteTime,
  compareHybrid,
  equivalentCount,
  type CostMode,
} from "@/lib/commute";
import { DEFAULT_CURRENCY, currencies, formatMoney, formatNumber } from "@/lib/currency";
import { cn } from "@/lib/utils";

const DAY_OPTIONS = [1, 2, 3, 4, 5, 6, 7];
const HORIZONS = ["5", "10", "20", "40"] as const;
type Horizon = (typeof HORIZONS)[number];
const TILTS = ["tilt-1", "tilt-2", "tilt-3"];

/** "7h 30m" for short spans, whole hours for long ones. */
function formatHours(hours: number): string {
  if (!Number.isFinite(hours)) return "—";
  if (hours >= 100) return `${formatNumber(Math.round(hours), 0)} hrs`;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 60) return `${h + 1}h`;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function formatDays(days: number): string {
  const rounded = days >= 100 ? Math.round(days) : Number(days.toFixed(1));
  return `${formatNumber(rounded, 1)} ${rounded === 1 ? "day" : "days"}`;
}

function PillRow<T extends number>({
  label,
  value,
  options,
  onChange,
  format,
}: {
  label: string;
  value: T;
  options: T[];
  onChange: (v: T) => void;
  format?: (v: T) => string;
}) {
  return (
    <div className="space-y-3">
      <p className="text-[15px] font-bold">{label}</p>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            role="radio"
            aria-checked={opt === value}
            onClick={() => onChange(opt)}
            className={cn(
              "h-9 min-w-9 flex-1 rounded-full border-2 px-2 text-sm font-bold transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
              opt === value
                ? "border-foreground bg-foreground text-background"
                : "border-foreground bg-card text-foreground hover:bg-secondary",
            )}
          >
            {format ? format(opt) : opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export function CommuteCalculator() {
  const { code, currency, setCurrency } = useCurrency();
  const [outbound, setOutbound] = React.useState(45);
  const [differentReturn, setDifferentReturn] = React.useState(false);
  const [returnMinutes, setReturnMinutes] = React.useState(45);
  const [daysPerWeek, setDaysPerWeek] = React.useState(5);
  const [daysOff, setDaysOff] = React.useState(28);
  const [wfhDays, setWfhDays] = React.useState(0);
  const [costOn, setCostOn] = React.useState(false);
  const [costMode, setCostMode] = React.useState<CostMode>("perDay");
  const [perDay, setPerDay] = React.useState(0);
  const [monthly, setMonthly] = React.useState(0);
  const [horizon, setHorizon] = React.useState<Horizon>("10");

  useUrlState({
    out: urlField(outbound, setOutbound, 45),
    diff: urlField(differentReturn, setDifferentReturn, false),
    back: urlField(returnMinutes, setReturnMinutes, 45),
    days: urlField(daysPerWeek, setDaysPerWeek, 5),
    off: urlField(daysOff, setDaysOff, 28),
    wfh: urlField(wfhDays, setWfhDays, 0),
    cost: urlField(costOn, setCostOn, false),
    mode: urlField(costMode, setCostMode, "perDay" as CostMode, ["perDay", "monthly"]),
    perday: urlField(perDay, setPerDay, 0),
    monthly: urlField(monthly, setMonthly, 0),
    years: urlField(horizon, setHorizon, "10" as Horizon, HORIZONS),
    currency: urlField(code, setCurrency, DEFAULT_CURRENCY, currencies.map((c) => c.code)),
  });

  const inputs = React.useMemo(
    () => ({
      outboundMinutes: outbound,
      returnMinutes: differentReturn ? returnMinutes : outbound,
      daysPerWeek,
      daysOffPerYear: daysOff,
    }),
    [outbound, differentReturn, returnMinutes, daysPerWeek, daysOff],
  );
  const costInputs = React.useMemo(
    () => (costOn ? { mode: costMode, perDay, monthly } : undefined),
    [costOn, costMode, perDay, monthly],
  );

  const time = React.useMemo(() => calculateCommuteTime(inputs), [inputs]);
  const cost = React.useMemo(
    () => (costInputs ? calculateCommuteCost(costInputs, time.commutingDaysPerYear) : null),
    [costInputs, time.commutingDaysPerYear],
  );
  const effectiveWfh = Math.min(wfhDays, daysPerWeek);
  const hybrid = React.useMemo(
    () => (effectiveWfh > 0 ? compareHybrid(inputs, effectiveWfh, costInputs) : null),
    [inputs, effectiveWfh, costInputs],
  );

  const years = Number(horizon);
  const money = React.useCallback(
    (v: number, decimals = 0) => formatMoney(v, code, { decimals }),
    [code],
  );
  const heroValue = formatHours(time.hoursPerYear);
  const showCost = cost !== null && cost.perYear > 0;

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[5fr_6fr] lg:items-start">
        {/* Inputs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your commute</CardTitle>
          </CardHeader>
          <CardContent className="space-y-7">
            <SliderField
              id="commute-outbound"
              label={differentReturn ? "Getting there" : "One way, door to door"}
              value={outbound}
              onChange={setOutbound}
              min={1}
              max={240}
              step={1}
              suffix="min"
              decimals={0}
            />
            <SwitchField
              id="commute-different-return"
              label="Different on the way back"
              hint="Traffic, a slower train, or a detour"
              checked={differentReturn}
              onCheckedChange={setDifferentReturn}
            />
            {differentReturn && (
              <SliderField
                id="commute-return"
                label="Getting home"
                value={returnMinutes}
                onChange={setReturnMinutes}
                min={1}
                max={240}
                step={1}
                suffix="min"
                decimals={0}
              />
            )}
            <PillRow
              label="Days a week you travel in"
              value={daysPerWeek}
              options={DAY_OPTIONS}
              onChange={(d) => {
                setDaysPerWeek(d);
                if (wfhDays > d) setWfhDays(d);
              }}
            />
            <SliderField
              id="commute-days-off"
              label="Days off a year"
              value={daysOff}
              onChange={setDaysOff}
              min={0}
              max={60}
              step={1}
              suffix="days"
              decimals={0}
            />
            <p className="-mt-4 text-xs font-semibold text-muted-foreground">
              Annual leave plus bank holidays. The UK statutory minimum is 28 for a 5-day week.
            </p>

            <div className="space-y-5 border-t border-foreground/15 pt-6">
              <PillRow
                label="What if you worked from home some days?"
                value={effectiveWfh}
                options={Array.from({ length: daysPerWeek + 1 }, (_, i) => i)}
                onChange={setWfhDays}
                format={(d) => (d === 0 ? "None" : `${d}`)}
              />
            </div>

            <div className="space-y-5 border-t border-foreground/15 pt-6">
              <SwitchField
                id="commute-cost-toggle"
                label="Add what it costs"
                hint="Fares, fuel, parking or a season ticket"
                checked={costOn}
                onCheckedChange={setCostOn}
              />
              {costOn && (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Segmented
                      label="How you pay"
                      value={costMode}
                      onChange={setCostMode}
                      size="sm"
                      options={[
                        { value: "perDay", label: "Per day" },
                        { value: "monthly", label: "Monthly pass" },
                      ]}
                      className="w-fit"
                    />
                    <CurrencySelect value={code} onChange={setCurrency} />
                  </div>
                  {costMode === "perDay" ? (
                    <NumberField
                      id="commute-per-day"
                      label="Cost per commuting day"
                      value={perDay}
                      onChange={setPerDay}
                      prefix={currency.symbol}
                      decimals={2}
                      hint="Return fare, fuel and parking for one day in"
                    />
                  ) : (
                    <NumberField
                      id="commute-monthly"
                      label="Monthly pass or season ticket"
                      value={monthly}
                      onChange={setMonthly}
                      prefix={currency.symbol}
                      decimals={2}
                      hint="Charged whether or not you travel, so working from home does not reduce it"
                    />
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="lg:sticky lg:top-20">
          <Card>
            <CardContent className="space-y-5 pt-5">
              <HeroStat
                label="Time spent commuting a year"
                value={heroValue}
                hint={`That's ${formatDays(time.fullDays)} around the clock, or ${formatDays(time.workingDays)} at work`}
              />
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-foreground/15 pt-4">
                <Stat label="Each day" value={formatHours(time.dailyMinutes / 60)} hint="Round trip" />
                <Stat label="Each week" value={formatHours(time.hoursPerWeek)} />
                <Stat label="Each month" value={formatHours(time.hoursPerMonth)} hint="Averaged over the year" />
                <Stat
                  label="Trips a year"
                  value={formatNumber(Math.round(time.commutingDaysPerYear), 0)}
                  hint="After days off"
                />
                {showCost && cost && (
                  <>
                    <Stat label="Cost a year" value={money(cost.perYear)} />
                    <Stat
                      label={costMode === "monthly" ? "Cost per trip" : "Cost a month"}
                      value={money(costMode === "monthly" ? cost.perTrip : cost.perMonth, 2)}
                      hint={costMode === "monthly" ? "Your pass spread over the trips you make" : undefined}
                    />
                  </>
                )}
              </div>
              <div className="space-y-2 border-t border-foreground/15 pt-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[15px] font-bold">Keep this up for</p>
                  <Segmented
                    label="Years"
                    value={horizon}
                    onChange={setHorizon}
                    size="sm"
                    options={HORIZONS.map((h) => ({ value: h, label: `${h} yrs` }))}
                    className="w-fit"
                  />
                </div>
                <p className="font-heading text-2xl font-extrabold tracking-tight text-numeric">
                  {formatDays(time.fullDays * years)}
                  <span className="text-base font-bold text-muted-foreground">
                    {" "}
                    of your life ({formatHours(time.hoursPerYear * years)})
                    {showCost && cost ? `, ${money(cost.perYear * years)}` : ""}
                  </span>
                </p>
              </div>
              {hybrid && (
                <div className="rounded-xl border-[2.5px] border-foreground bg-mint p-4">
                  <p className="text-[15px] font-bold">
                    Working from home {hybrid.wfhDaysPerWeek} {hybrid.wfhDaysPerWeek === 1 ? "day" : "days"} a week
                  </p>
                  <p className="mt-0.5 font-heading text-2xl font-black tracking-tight text-numeric">
                    Gives back {formatHours(hybrid.hoursSavedPerYear)} a year
                  </p>
                  <p className="mt-1.5 text-sm font-semibold">
                    That&apos;s {formatDays(hybrid.fullDaysSaved)} around the clock, leaving{" "}
                    {formatHours(hybrid.time.hoursPerYear)} of commuting
                    {hybrid.wfhDaysPerWeek === daysPerWeek ? " (none at all)" : ""}.
                    {showCost && costMode === "perDay" && hybrid.costSavedPerYear > 0
                      ? ` You would also keep ${money(hybrid.costSavedPerYear)} a year.`
                      : ""}
                    {showCost && costMode === "monthly"
                      ? " A monthly pass costs the same however often you use it, so the cost stays put."
                      : ""}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">A year of commuting is roughly</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {EQUIVALENTS.map((eq, i) => {
              const count = equivalentCount(time.hoursPerYear, eq);
              const shown = count >= 10 ? Math.round(count) : Number(count.toFixed(1));
              return (
                <div
                  key={eq.key}
                  className={cn(
                    "sticker rounded-2xl p-5",
                    TILTS[i % TILTS.length],
                    i === 0 ? "bg-yellow" : i === 1 ? "bg-lilac" : "bg-sky",
                  )}
                >
                  <p className="font-heading text-4xl font-black tracking-tighter text-numeric">
                    {formatNumber(shown, 1)}
                  </p>
                  <p className="mt-1 text-sm font-bold">{shown === 1 ? eq.singular : eq.plural}</p>
                  <p className="mt-1 text-xs font-semibold text-foreground/70">{eq.note}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <MobileResultBar label="Commuting a year" value={heroValue} />
    </>
  );
}

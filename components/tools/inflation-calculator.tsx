"use client";

import { ArrowLeftRight } from "lucide-react";
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Callout } from "@/components/calc/callout";
import { MobileResultBar } from "@/components/calc/mobile-result-bar";
import { NumericInput } from "@/components/calc/numeric-input";
import { PillButton, togglePillClass } from "@/components/calc/pill-button";
import { Segmented } from "@/components/calc/segmented";
import { SliderField } from "@/components/calc/slider-field";
import { HeroStat, Stat } from "@/components/calc/stat";
import { YearlyChartCard } from "@/components/charts/yearly-chart-card";
import { MONEY_RANGE, useUrlState, urlField } from "@/hooks/use-url-state";
import { formatGbp, formatGbpCompact as axis, formatNumber, formatPercent } from "@/lib/currency";
import { INFLATION_DATA } from "@/lib/inflation-data";
import {
  LATEST,
  LATEST_YEAR,
  MEASURES,
  MEASURE_INFO,
  clampYear,
  convert,
  firstYear,
  latestRate,
  longRunCpiRate,
  payCheck,
  project,
  yearLabel,
  type Conversion,
  type Measure,
} from "@/lib/inflation";
import { cn } from "@/lib/utils";

type Mode = "past" | "pay" | "future";
const MODES = ["past", "pay", "future"] as const satisfies readonly Mode[];
const MODE_OPTIONS: { value: Mode; label: string }[] = [
  { value: "past", label: "Then vs now" },
  { value: "pay", label: "My pay" },
  { value: "future", label: "Future" },
];
const MEASURE_OPTIONS = MEASURES.map((value) => ({ value, label: MEASURE_INFO[value].label }));

const YEAR_RANGE = { min: firstYear("rpi"), max: LATEST_YEAR };
const DEFAULTS = {
  amount: 100,
  from: 2000,
  thenPay: 30_000,
  nowPay: 35_000,
  payFrom: LATEST_YEAR - 5,
  years: 10,
  rate: 2,
};

/** Pennies for small sums that have them, whole pounds once they stop mattering. */
const money = (v: number) => formatGbp(v, Math.abs(v) < 1_000 && !Number.isInteger(v) ? 2 : 0);
const pct = (v: number) => formatPercent(v, 1);
/** A price rise as a percentage, or as a multiple once it passes 1,000%. */
const rise = (v: number) => (v < 10 ? pct(v) : `${formatNumber(1 + v, 0)}×`);
const ratePct = (v: number) => Math.round(v * 1000) / 10;

export function InflationCalculator() {
  const [mode, setMode] = React.useState<Mode>("past");
  const [measure, setMeasure] = React.useState<Measure>("cpi");
  const [amount, setAmount] = React.useState(DEFAULTS.amount);
  const [from, setFrom] = React.useState(DEFAULTS.from);
  const [to, setTo] = React.useState(LATEST_YEAR);
  const [thenPay, setThenPay] = React.useState(DEFAULTS.thenPay);
  const [nowPay, setNowPay] = React.useState(DEFAULTS.nowPay);
  const [payFrom, setPayFrom] = React.useState(DEFAULTS.payFrom);
  const [years, setYears] = React.useState(DEFAULTS.years);
  const [rate, setRate] = React.useState(DEFAULTS.rate);

  useUrlState({
    mode: urlField(mode, (v: string) => setMode(v as Mode), "past", MODES),
    measure: urlField(measure, (v: string) => setMeasure(v as Measure), "cpi", MEASURES),
    amount: urlField(amount, setAmount, DEFAULTS.amount, undefined, MONEY_RANGE),
    from: urlField(from, setFrom, DEFAULTS.from, undefined, YEAR_RANGE),
    to: urlField(to, setTo, LATEST_YEAR, undefined, YEAR_RANGE),
    then: urlField(thenPay, setThenPay, DEFAULTS.thenPay, undefined, MONEY_RANGE),
    now: urlField(nowPay, setNowPay, DEFAULTS.nowPay, undefined, MONEY_RANGE),
    since: urlField(payFrom, setPayFrom, DEFAULTS.payFrom, undefined, YEAR_RANGE),
    years: urlField(years, setYears, DEFAULTS.years, undefined, { min: 1, max: 50 }),
    rate: urlField(rate, setRate, DEFAULTS.rate, undefined, { min: 0, max: 20 }),
  });

  // Years outside what the measure covers are pulled in here rather than in
  // state, so flipping back to RPI restores what was typed.
  const fromYear = clampYear(measure, from);
  const toYear = clampYear(measure, to);
  const sinceYear = clampYear(measure, payFrom);

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[5fr_6fr] lg:items-start">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="text-base">What to compare</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Segmented label="Calculator" value={mode} onChange={setMode} options={MODE_OPTIONS} />

            {mode === "past" && (
              <>
                <MoneyField id="inf-amount" label="Amount" value={amount} onChange={setAmount} />
                <div className="flex items-end gap-2">
                  <YearField id="inf-from" label="In" value={fromYear} onChange={setFrom} measure={measure} />
                  <PillButton
                    aria-label="Swap the years"
                    className="mb-0.5 shrink-0 px-2.5"
                    onClick={() => {
                      setFrom(toYear);
                      setTo(fromYear);
                    }}
                  >
                    <ArrowLeftRight className="size-4" strokeWidth={2.5} />
                  </PillButton>
                  <YearField id="inf-to" label="Is worth, in" value={toYear} onChange={setTo} measure={measure} />
                </div>
              </>
            )}

            {mode === "pay" && (
              <>
                <YearField id="inf-since" label="Back in" value={sinceYear} onChange={setPayFrom} measure={measure} />
                <MoneyField id="inf-then" label={`Pay in ${yearLabel(sinceYear)}`} value={thenPay} onChange={setThenPay} />
                <MoneyField id="inf-now" label="Pay now" value={nowPay} onChange={setNowPay} />
                <p className="text-xs font-semibold text-muted-foreground">
                  Use the same kind of figure for both: yearly salary before tax, or hourly rate.
                </p>
              </>
            )}

            {mode === "future" && (
              <>
                <MoneyField id="inf-future-amount" label="Costs today" value={amount} onChange={setAmount} />
                <SliderField
                  id="inf-years"
                  label="Years from now"
                  value={years}
                  onChange={setYears}
                  min={1}
                  max={50}
                  suffix="yrs"
                  decimals={0}
                />
                <div className="space-y-3">
                  <SliderField
                    id="inf-rate"
                    label="Inflation each year"
                    value={rate}
                    onChange={setRate}
                    min={0}
                    max={15}
                    inputMax={20}
                    step={0.1}
                    suffix="%"
                    decimals={1}
                  />
                  <RatePresets rate={rate} onChange={setRate} />
                </div>
              </>
            )}

            {mode !== "future" && (
              <div className="space-y-2.5">
                <p className="text-[15px] font-bold">Price index</p>
                <Segmented label="Price index" size="sm" value={measure} onChange={setMeasure} options={MEASURE_OPTIONS} />
                <p className="text-xs font-semibold text-muted-foreground">
                  {measure === "cpi"
                    ? `The Bank of England's target measure, with figures from ${firstYear("cpi")}. For older prices switch to RPI, which goes back to ${firstYear("rpi")}.`
                    : `The ONS long-run price series, from ${firstYear("rpi")}. It runs higher than CPI in recent decades.`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {mode === "past" && <PastResults amount={amount} from={fromYear} to={toYear} measure={measure} />}
        {mode === "pay" && <PayResults thenPay={thenPay} nowPay={nowPay} from={sinceYear} measure={measure} />}
        {mode === "future" && <FutureResults amount={amount} years={years} rate={rate} />}
      </div>

      {mode === "past" && <HistoryChart conversion={convert({ amount, from: fromYear, to: toYear, measure })} title={`${money(amount)} from ${yearLabel(fromYear)}, year by year`} />}
      {mode === "pay" && (
        <HistoryChart
          conversion={convert({ amount: thenPay, from: sinceYear, to: LATEST_YEAR, measure })}
          title="Pay needed to keep up, year by year"
        />
      )}
      {mode === "future" && <FutureChart amount={amount} years={years} rate={rate} />}
    </>
  );
}

function MoneyField({ id, label, value, onChange }: { id: string; label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-[15px] font-bold">
        {label}
      </Label>
      <NumericInput id={id} value={value} onChange={onChange} max={MONEY_RANGE.max} prefix="£" grouped inputClassName="w-full" />
    </div>
  );
}

function YearField({
  id,
  label,
  value,
  onChange,
  measure,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
  measure: Measure;
}) {
  return (
    <div className="min-w-0 flex-1 space-y-1.5">
      <Label htmlFor={id} className="text-[15px] font-bold">
        {label}
      </Label>
      <NumericInput
        id={id}
        value={value}
        onChange={onChange}
        min={firstYear(measure)}
        max={LATEST_YEAR}
        decimals={0}
        inputClassName="w-full"
      />
    </div>
  );
}

function RatePresets({ rate, onChange }: { rate: number; onChange: (v: number) => void }) {
  const presets = [
    { label: "2% target", value: 2 },
    { label: `Latest CPI ${ratePct(latestRate("cpi"))}%`, value: ratePct(latestRate("cpi")) },
    { label: `Average since ${firstYear("cpi")} ${ratePct(longRunCpiRate())}%`, value: ratePct(longRunCpiRate()) },
  ];
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Quick rates">
      {presets.map((p) => (
        <button key={p.label} type="button" aria-pressed={rate === p.value} onClick={() => onChange(p.value)} className={togglePillClass(rate === p.value, "h-8 px-3 text-[13px]")}>
          {p.label}
        </button>
      ))}
    </div>
  );
}

function SourceNote({ measure, years }: { measure: Measure; years: number[] }) {
  const partial = LATEST.partial && years.includes(LATEST_YEAR);
  return (
    <p className="text-xs font-semibold text-muted-foreground">
      {MEASURE_INFO[measure].name}, ONS annual averages
      {partial ? `; ${LATEST_YEAR} is ${LATEST.month} only, the latest month published` : ""}. Data from the ONS release of{" "}
      {formatDate(INFLATION_DATA.released)}.
    </p>
  );
}

function formatDate(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

function PastResults({ amount, from, to, measure }: { amount: number; from: number; to: number; measure: Measure }) {
  const r = convert({ amount, from, to, measure });
  const later = Math.max(from, to);
  const earlier = Math.min(from, to);
  const same = from === to;
  // What the amount in the later year's money would have bought in the earlier year.
  const shrunk = convert({ amount, from: later, to: earlier, measure }).value;

  return (
    <div className="space-y-6 lg:sticky lg:top-20">
      <Card>
        <CardContent className="space-y-6 pt-6">
          <HeroStat
            label={`${money(amount)} in ${yearLabel(from)} is worth`}
            value={money(r.value)}
            hint={same ? "Pick two different years" : `in ${yearLabel(to)} prices`}
          />
          {!same && (
            <>
              <div className="grid grid-cols-2 gap-4 border-t border-foreground/15 pt-5">
                <Stat label="Prices rose" value={rise(r.totalRise)} hint={`from ${yearLabel(earlier)} to ${yearLabel(later)}`} />
                <Stat label="Average inflation" value={pct(r.averageRate)} hint="a year" />
              </div>
              <Callout>
                {shrunk >= amount / 10
                  ? `${money(amount)} in ${yearLabel(later)} buys what ${money(shrunk)} did in ${yearLabel(earlier)}.`
                  : `Money has lost ${pct(1 - shrunk / amount)} of its buying power since ${yearLabel(earlier)}.`}
                {r.peak && r.rows.length > 2 && ` The worst year in between was ${yearLabel(r.peak.year)}, at ${pct(r.peak.rate)}.`}
              </Callout>
            </>
          )}
          {measure === "rpi" && <RpiNote early={earlier < 1947} />}
          <SourceNote measure={measure} years={[from, to]} />
        </CardContent>
      </Card>
      <MobileResultBar label={`In ${yearLabel(to)} money`} value={money(r.value)} />
    </div>
  );
}

function RpiNote({ early }: { early: boolean }) {
  return (
    <Callout>
      The ONS no longer treats RPI as a good measure of inflation: its formula runs higher than CPI. It is still what student loans
      and some pensions use, and the only index that goes back this far.
      {early && " Before 1947 the ONS builds the series from older price records, so treat those years as a rough guide."}
    </Callout>
  );
}

function PayResults({ thenPay, nowPay, from, measure }: { thenPay: number; nowPay: number; from: number; measure: Measure }) {
  const r = payCheck({ thenPay, nowPay, from, to: LATEST_YEAR, measure });
  const kept = Math.abs(r.realChange) < 0.0005;
  const up = r.realChange > 0;
  const now = yearLabel(LATEST_YEAR);

  return (
    <div className="space-y-6 lg:sticky lg:top-20">
      <Card>
        <CardContent className="space-y-6 pt-6">
          <HeroStat label={`To keep up since ${yearLabel(from)}, you'd need`} value={money(r.needed)} hint={`${money(thenPay)} in ${now} prices`} />
          <div
            className={cn(
              "rounded-2xl border-[2.5px] border-foreground px-4 py-3",
              kept ? "bg-card" : up ? "bg-mint" : "bg-pink",
            )}
          >
            <p className="text-[15px] font-bold">
              {kept ? "Your pay has kept pace with prices" : up ? "Real-terms pay rise" : "Real-terms pay cut"}
            </p>
            {!kept && (
              <p className="font-heading text-3xl font-extrabold tracking-tight text-numeric">
                {up ? "+" : "−"}
                {pct(Math.abs(r.realChange))}
              </p>
            )}
            <p className="text-xs font-semibold">
              {kept
                ? "Pay now buys about what it did."
                : up
                  ? `You're ${money(r.gap)} ahead of prices.`
                  : `You're ${money(-r.gap)} short of where prices went.`}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 border-t border-foreground/15 pt-5">
            <Stat label="Cash rise" value={pct(r.cashChange)} hint="before inflation" />
            <Stat label="Prices rose" value={rise(r.conversion.totalRise)} hint={`since ${yearLabel(from)}`} />
          </div>
          <p className="text-xs font-semibold text-muted-foreground">
            Compares pay before tax. Tax thresholds that stay frozen while pay rises mean take-home pay can fall behind even when gross
            pay keeps up.
          </p>
          {measure === "rpi" && <RpiNote early={from < 1947} />}
          <SourceNote measure={measure} years={[from, LATEST_YEAR]} />
        </CardContent>
      </Card>
      <MobileResultBar label="Needed to keep up" value={money(r.needed)} />
    </div>
  );
}

function FutureResults({ amount, years, rate }: { amount: number; years: number; rate: number }) {
  const r = project({ amount, years, rate: rate / 100 });
  return (
    <div className="space-y-6 lg:sticky lg:top-20">
      <Card>
        <CardContent className="space-y-6 pt-6">
          <HeroStat label={`${money(amount)} of shopping today will cost`} value={money(r.cost)} hint={`in ${years} years, at ${rate}% a year`} />
          <div className="grid grid-cols-2 gap-4 border-t border-foreground/15 pt-5">
            <Stat label={`${money(amount)} kept as cash buys`} value={money(r.buyingPower)} hint="in today's money" />
            <Stat label="Buying power lost" value={pct(amount > 0 ? 1 - r.buyingPower / amount : 0)} />
          </div>
          <p className="text-xs font-semibold text-muted-foreground">
            A steady rate is a simplification: real inflation moves around year to year. The Bank of England aims for 2% CPI.
          </p>
        </CardContent>
      </Card>
      <MobileResultBar label={`In ${years} years`} value={money(r.cost)} />
    </div>
  );
}

function HistoryChart({ conversion, title }: { conversion: Conversion; title: string }) {
  const { rows } = conversion;
  if (rows.length < 2) return null;
  return (
    <YearlyChartCard
      title={title}
      series={[{ name: "Value", color: "var(--chart-1)", values: rows.map((r) => r.value), area: true }]}
      formatValue={money}
      formatAxis={axis}
      xLabel={(i) => yearLabel(rows[i]?.year ?? 0)}
      xTick={(i) => String(rows[i]?.year ?? "")}
      extraRow={(i) => {
        const rate = rows[i]?.rate;
        return rate == null ? null : { name: "Inflation", value: pct(rate) };
      }}
      rows={rows}
      columns={[
        { label: "Inflation", value: (r) => (r.rate == null ? "" : pct(r.rate)) },
        { label: "Index", value: (r) => String(r.index) },
        { label: "Value", value: (r) => money(r.value) },
      ]}
    />
  );
}

function FutureChart({ amount, years, rate }: { amount: number; years: number; rate: number }) {
  const r = project({ amount, years, rate: rate / 100 });
  return (
    <YearlyChartCard
      title="Prices and buying power over time"
      series={[
        { name: "Cost", color: "var(--chart-1)", values: r.rows.map((row) => row.cost), area: true },
        { name: "Cash buys", color: "var(--chart-neutral)", values: r.rows.map((row) => row.buyingPower) },
      ]}
      formatValue={money}
      formatAxis={axis}
      rows={r.rows}
      columns={[
        { label: "Cost", value: (row) => money(row.cost) },
        { label: "Cash buys", value: (row) => money(row.buyingPower) },
      ]}
    />
  );
}

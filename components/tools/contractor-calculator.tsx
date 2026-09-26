"use client";

import * as React from "react";
import { Briefcase, PiggyBank, Receipt, Umbrella } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Callout } from "@/components/calc/callout";
import { MobileResultBar } from "@/components/calc/mobile-result-bar";
import { NumberField } from "@/components/calc/number-field";
import { PillButton } from "@/components/calc/pill-button";
import { Section, useSectionState } from "@/components/calc/section";
import { Segmented } from "@/components/calc/segmented";
import { SliderField } from "@/components/calc/slider-field";
import { HeroStat, Stat } from "@/components/calc/stat";
import { SwitchField } from "@/components/calc/switch-field";
import { GrowthChart } from "@/components/charts/growth-chart";
import { MONEY_RANGE, PERCENT_RANGE, useUrlState, urlField, type NumberRange } from "@/hooks/use-url-state";
import {
  MAX_DAY_RATE,
  ROUTE_INFO,
  ROUTES,
  SCENARIOS,
  compareRoutes,
  dayRateCurve,
  salaryEquivalent,
  scenarioValue,
  workingDays,
  type BreakEven,
  type CompareBasis,
  type ContractRoute,
  type ContractorInput,
  type Line,
  type RouteComparison,
  type Scenario,
  type ScenarioResult,
} from "@/lib/contractor";
import { formatMoney } from "@/lib/currency";
import { DEFAULT_TAX_YEAR, TAX_YEARS, type TaxYear } from "@/lib/uk-tax";
import { cn } from "@/lib/utils";

const DEFAULT_INPUT: ContractorInput = {
  taxYear: DEFAULT_TAX_YEAR,
  scotland: false,
  dayRate: 500,
  daysPerWeek: 5,
  holidayDays: 25,
  bankHolidays: 8,
  sickDays: 5,
  benchDays: 10,
  expenses: 1_000,
  ltdCosts: 1_500,
  soleTraderCosts: 600,
  directorSalary: 12_570,
  umbrellaMargin: 25,
  apprenticeshipLevy: true,
  // Only used once you stop matching the job's pension.
  contractorPension: 7_000,
  permSalary: 70_000,
  permBonus: 0,
  permEmployeePension: 5,
  permEmployerPension: 5,
  permSacrifice: false,
  permBenefits: 0,
};

const DAY_RATE_RANGE: NumberRange = { min: 0, max: 5_000 };
const DAYS_RANGE: NumberRange = { min: 0, max: 365 };
const DAYS_PER_WEEK = [
  { value: "3", label: "3 days" },
  { value: "4", label: "4 days" },
  { value: "5", label: "5 days" },
];
const BASIS_OPTIONS: { value: CompareBasis; label: string }[] = [
  { value: "cash", label: "Take-home" },
  { value: "package", label: "Take-home + pension" },
];
const VIEW_OPTIONS = SCENARIOS.map((value) => ({ value, label: ROUTE_INFO[value].short }));

const COLORS: Record<Scenario, string> = {
  perm: "var(--foreground)",
  ltd: "var(--chart-1)",
  umbrella: "var(--chart-4)",
  soleTrader: "var(--chart-2)",
};

const money = (v: number, decimals = 0) => formatMoney(v, "GBP", { decimals });
const signed = (v: number) => `${v >= 0 ? "+" : "−"}${money(Math.abs(v))}`;
const dayRateGap = (v: number) =>
  v === 0 ? "exactly your rate" : `${money(Math.abs(v))} ${v > 0 ? "under" : "over"} your rate`;
const axis = (v: number) => (v >= 1000 ? `£${Math.round(v / 1000)}k` : `£${v}`);

export function ContractorCalculator() {
  const [input, setInput] = React.useState<ContractorInput>(DEFAULT_INPUT);
  const [basis, setBasis] = React.useState<CompareBasis>("package");
  const [view, setView] = React.useState<Scenario>("ltd");
  // Until you type your own figure, the contractor pension follows the job's, so the pots stay level.
  const [matchPension, setMatchPension] = React.useState(true);

  const update = <K extends keyof ContractorInput>(key: K, value: ContractorInput[K]) =>
    setInput((prev) => ({ ...prev, [key]: value }));

  const num = (key: NumericKey, urlKey: string, range: NumberRange) => ({
    [urlKey]: urlField(input[key], (v: number) => update(key, v), DEFAULT_INPUT[key], undefined, range),
  });

  useUrlState({
    ...num("dayRate", "rate", DAY_RATE_RANGE),
    ...num("daysPerWeek", "dpw", { min: 3, max: 5 }),
    ...num("holidayDays", "hol", DAYS_RANGE),
    ...num("bankHolidays", "bank", DAYS_RANGE),
    ...num("sickDays", "sick", DAYS_RANGE),
    ...num("benchDays", "bench", DAYS_RANGE),
    ...num("expenses", "exp", MONEY_RANGE),
    ...num("ltdCosts", "ltdCosts", MONEY_RANGE),
    ...num("soleTraderCosts", "soleCosts", MONEY_RANGE),
    ...num("directorSalary", "dirSalary", MONEY_RANGE),
    ...num("umbrellaMargin", "margin", MONEY_RANGE),
    ...num("contractorPension", "pension", MONEY_RANGE),
    ...num("permSalary", "salary", MONEY_RANGE),
    ...num("permBonus", "bonus", MONEY_RANGE),
    ...num("permEmployeePension", "eePension", PERCENT_RANGE),
    ...num("permEmployerPension", "erPension", PERCENT_RANGE),
    ...num("permBenefits", "benefits", MONEY_RANGE),
    levy: urlField(input.apprenticeshipLevy, (v: boolean) => update("apprenticeshipLevy", v), true),
    sacrifice: urlField(input.permSacrifice, (v: boolean) => update("permSacrifice", v), false),
    scotland: urlField(input.scotland, (v: boolean) => update("scotland", v), false),
    year: urlField(input.taxYear, (v: string) => update("taxYear", v as TaxYear), DEFAULT_INPUT.taxYear, Object.keys(TAX_YEARS)),
    compare: urlField(basis, (v: string) => setBasis(v as CompareBasis), "package", BASIS_OPTIONS.map((o) => o.value)),
    view: urlField(view, (v: string) => setView(v as Scenario), "ltd", SCENARIOS),
    matchPension: urlField(matchPension, setMatchPension, true),
  });

  const comparison = compareRoutes(input, basis, matchPension);
  const { effective, results, best, gap } = comparison;

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[5fr_6fr] lg:items-start">
        <ContractorInputs
          input={effective}
          update={update}
          matchPension={matchPension}
          onMatchPensionChange={setMatchPension}
        />
        <ContractorResults comparison={comparison} basis={basis} onBasisChange={setBasis} />
      </div>
      <Breakdown input={effective} results={results} basis={basis} view={view} onViewChange={setView} />
      <DayRateChart input={effective} basis={basis} />
      <MobileResultBar
        label={ROUTE_INFO[best].short}
        value={`${signed(gap)} vs job`}
      />
    </>
  );
}

/** The ContractorInput fields that hold numbers, so the URL binding needs no casts. */
type NumericKey = { [K in keyof ContractorInput]: ContractorInput[K] extends number ? K : never }[keyof ContractorInput];

type Update = <K extends keyof ContractorInput>(key: K, value: ContractorInput[K]) => void;

function ContractorInputs({
  input,
  update,
  matchPension,
  onMatchPensionChange,
}: {
  input: ContractorInput;
  update: Update;
  matchPension: boolean;
  onMatchPensionChange: (match: boolean) => void;
}) {
  const sections = useSectionState([]);
  const days = workingDays(input);

  const permSummary =
    [
      `${input.permEmployeePension}% + ${input.permEmployerPension}% pension`,
      input.permSacrifice && "sacrifice",
      input.permBonus > 0 && `${money(input.permBonus)} bonus`,
      input.permBenefits > 0 && `${money(input.permBenefits)} benefits`,
    ]
      .filter(Boolean)
      .join(" · ");

  return (
    <Card className="min-w-0">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Your contract</CardTitle>
        <Select value={input.taxYear} onValueChange={(v) => update("taxYear", v as TaxYear)}>
          <SelectTrigger size="sm" aria-label="Tax year" className="w-fit font-medium">
            <span className="text-muted-foreground">Tax year</span>
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            {(Object.keys(TAX_YEARS) as TaxYear[]).map((ty) => (
              <SelectItem key={ty} value={ty}>
                {TAX_YEARS[ty].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="space-y-6">
        <SliderField
          id="day-rate"
          label="Day rate, before VAT"
          value={input.dayRate}
          onChange={(v) => update("dayRate", v)}
          min={0}
          max={1_500}
          step={5}
          sliderStep={25}
          prefix="£"
          grouped
        />

        <div className="space-y-4">
          <Segmented
            label="Days a week"
            value={String(input.daysPerWeek)}
            onChange={(v) => update("daysPerWeek", Number(v))}
            options={DAYS_PER_WEEK}
          />
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              id="holidays"
              label="Holidays"
              value={input.holidayDays}
              onChange={(v) => update("holidayDays", v)}
              max={DAYS_RANGE.max}
              decimals={0}
              suffix="days"
            />
            <NumberField
              id="bank-holidays"
              label="Bank holidays"
              value={input.bankHolidays}
              onChange={(v) => update("bankHolidays", v)}
              max={DAYS_RANGE.max}
              decimals={0}
              suffix="days"
            />
            <NumberField
              id="sick-days"
              label="Sick and training"
              value={input.sickDays}
              onChange={(v) => update("sickDays", v)}
              max={DAYS_RANGE.max}
              decimals={0}
              suffix="days"
            />
            <NumberField
              id="bench-days"
              label="Between contracts"
              value={input.benchDays}
              onChange={(v) => update("benchDays", v)}
              max={DAYS_RANGE.max}
              decimals={0}
              suffix="days"
            />
          </div>
          <p className="rounded-xl bg-secondary px-3.5 py-2.5 text-sm font-semibold">
            {days.weekdays} weekdays − {days.daysOff} days off ={" "}
            <span className="font-bold">{days.billable} paid days</span>
            <span className="text-muted-foreground"> · {money(input.dayRate * days.billable)} a year</span>
          </p>
        </div>

        <SliderField
          id="perm-salary"
          label="Permanent salary to compare"
          value={input.permSalary}
          onChange={(v) => update("permSalary", v)}
          min={0}
          max={250_000}
          step={500}
          sliderStep={1_000}
          prefix="£"
          grouped
        />

        <SwitchField
          id="scotland"
          label="I live in Scotland"
          hint="Scottish bands on salary and umbrella pay; dividends use UK rates"
          checked={input.scotland}
          onCheckedChange={(v) => update("scotland", v)}
        />

        <div className="space-y-2.5">
          <Section
            icon={Briefcase}
            title="Permanent package"
            summary={permSummary}
            active={input.permBonus > 0 || input.permBenefits > 0 || input.permSacrifice}
            open={sections.isOpen("perm")}
            onToggle={() => sections.toggle("perm")}
          >
            <div className="grid grid-cols-2 gap-3">
              <NumberField
                id="perm-ee-pension"
                label="Your pension"
                value={input.permEmployeePension}
                onChange={(v) => update("permEmployeePension", v)}
                max={100}
                decimals={1}
                suffix="%"
              />
              <NumberField
                id="perm-er-pension"
                label="Employer pension"
                value={input.permEmployerPension}
                onChange={(v) => update("permEmployerPension", v)}
                max={100}
                decimals={1}
                suffix="%"
              />
              <NumberField
                id="perm-bonus"
                label="Yearly bonus"
                value={input.permBonus}
                onChange={(v) => update("permBonus", v)}
                max={MONEY_RANGE.max}
                prefix="£"
                grouped
              />
              <NumberField
                id="perm-benefits"
                label="Benefits worth"
                value={input.permBenefits}
                onChange={(v) => update("permBenefits", v)}
                max={MONEY_RANGE.max}
                prefix="£"
                grouped
              />
            </div>
            <p className="text-xs font-semibold text-muted-foreground">
              Benefits are what perks like private medical, life cover or a gym are worth to you a year.
              They count in the comparison when it includes pension. Paid holiday and sick pay are already
              covered by the days off above.
            </p>
            <SwitchField
              id="perm-sacrifice"
              label="Pension by salary sacrifice"
              hint="Saves NI on your contribution as well as tax"
              checked={input.permSacrifice}
              onCheckedChange={(v) => update("permSacrifice", v)}
            />
          </Section>

          <Section
            icon={PiggyBank}
            title="Pension while contracting"
            summary={
              input.contractorPension > 0
                ? `${money(input.contractorPension)} a year${matchPension ? ", same as your job" : ""}`
                : "No pension"
            }
            active={input.contractorPension > 0}
            open={sections.isOpen("pension")}
            onToggle={() => sections.toggle("pension")}
          >
            <NumberField
              id="contractor-pension"
              label="Paid in each year"
              value={input.contractorPension}
              onChange={(v) => {
                // Blur commits even when nothing changed: only a new figure stops the matching.
                if (v === input.contractorPension) return;
                onMatchPensionChange(false);
                update("contractorPension", v);
              }}
              max={MONEY_RANGE.max}
              prefix="£"
              grouped
            />
            <div className="flex flex-wrap items-center gap-2">
              <PillButton onClick={() => onMatchPensionChange(true)} disabled={matchPension}>
                Match your job
              </PillButton>
              <PillButton
                onClick={() => {
                  onMatchPensionChange(false);
                  update("contractorPension", 0);
                }}
                disabled={input.contractorPension === 0}
              >
                None
              </PillButton>
            </div>
            <p className="text-xs font-semibold text-muted-foreground">
              The gross amount reaching your pot. A limited company pays it before corporation tax, an
              umbrella by salary sacrifice, and a sole trader personally with tax relief.
            </p>
          </Section>

          <Section
            icon={Receipt}
            title="Business costs"
            summary={`${money(input.expenses)} expenses · ${money(input.directorSalary)} director's salary`}
            active={false}
            open={sections.isOpen("costs")}
            onToggle={() => sections.toggle("costs")}
          >
            <div className="grid grid-cols-2 gap-3">
              <NumberField
                id="expenses"
                label="Expenses"
                value={input.expenses}
                onChange={(v) => update("expenses", v)}
                max={MONEY_RANGE.max}
                prefix="£"
                grouped
                hint="Kit, insurance, training"
              />
              <NumberField
                id="director-salary"
                label="Director's salary"
                value={input.directorSalary}
                onChange={(v) => update("directorSalary", v)}
                max={MONEY_RANGE.max}
                prefix="£"
                grouped
                hint="£12,570 is usual"
              />
              <NumberField
                id="ltd-costs"
                label="Company running costs"
                value={input.ltdCosts}
                onChange={(v) => update("ltdCosts", v)}
                max={MONEY_RANGE.max}
                prefix="£"
                grouped
                hint="Accountant, bank, admin"
              />
              <NumberField
                id="sole-costs"
                label="Sole trader accountant"
                value={input.soleTraderCosts}
                onChange={(v) => update("soleTraderCosts", v)}
                max={MONEY_RANGE.max}
                prefix="£"
                grouped
                hint="Or £0 if you file yourself"
              />
            </div>
          </Section>

          <Section
            icon={Umbrella}
            title="Umbrella fees"
            summary={`${money(input.umbrellaMargin)} a week${input.apprenticeshipLevy ? " + 0.5% levy" : ""}`}
            active={false}
            open={sections.isOpen("umbrella")}
            onToggle={() => sections.toggle("umbrella")}
          >
            <NumberField
              id="umbrella-margin"
              label="Umbrella margin per week"
              value={input.umbrellaMargin}
              onChange={(v) => update("umbrellaMargin", v)}
              max={1_000}
              prefix="£"
            />
            <SwitchField
              id="levy"
              label="Apprenticeship levy passed on"
              hint="Most umbrellas take 0.5% of pay from your rate"
              checked={input.apprenticeshipLevy}
              onCheckedChange={(v) => update("apprenticeshipLevy", v)}
            />
          </Section>
        </div>
      </CardContent>
    </Card>
  );
}

function ContractorResults({
  comparison: { effective: input, hasIncome, results, permValue, best, gap, breakEven, soleBeatsLtd },
  basis,
  onBasisChange,
}: {
  comparison: RouteComparison;
  basis: CompareBasis;
  onBasisChange: (b: CompareBasis) => void;
}) {
  const bestValue = scenarioValue(results[best], basis);

  return (
    <div className="order-first min-w-0 space-y-6 lg:order-none lg:sticky lg:top-20">
      <Card className="min-w-0 bg-yellow">
        <CardContent className="space-y-6 pt-6">
          <Segmented label="Compare on" value={basis} onChange={onBasisChange} options={BASIS_OPTIONS} />

          <HeroStat
            label={`Best contracting route: ${ROUTE_INFO[best].label.toLowerCase()}`}
            value={money(bestValue)}
            hint={
              hasIncome
                ? `a year${basis === "package" ? " with pension" : " in your pocket"} · ${
                    gap >= 0 ? `${money(gap)} more` : `${money(-gap)} less`
                  } than your job`
                : "Enter a day rate and some paid days"
            }
          />

          <div className="grid gap-2.5 sm:grid-cols-2">
            {SCENARIOS.map((s) => (
              <ScenarioTile
                key={s}
                scenario={s}
                result={results[s]}
                basis={basis}
                permValue={permValue}
                best={s === best}
              />
            ))}
          </div>

          <div className="space-y-3 border-t border-foreground/15 pt-5">
            <p className="text-[15px] font-bold">Day rate to match your job</p>
            <div className="grid grid-cols-3 gap-4">
              {ROUTES.map((r) => (
                <BreakEvenStat key={r} route={r} breakEven={breakEven[r]} dayRate={input.dayRate} />
              ))}
            </div>
          </div>

          <Callout>
            Limited company figures assume the contract is outside IR35. Inside IR35 you are taxed much
            like an employee, so the umbrella column is the one to read.
          </Callout>
          {soleBeatsLtd && (
            <Callout>
              Here a sole trader keeps more than a limited company, because every pound of profit is paid
              out: corporation tax plus dividend tax
              {input.taxYear === "2026-27" ? " (up 2 points from April 2026)" : ""} costs more than income tax
              and Class 4 NI. A company comes out ahead when you leave profit
              in it, or pay more into the pension from it.
            </Callout>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function BreakEvenStat({ route, breakEven, dayRate }: { route: ContractRoute; breakEven: BreakEven; dayRate: number }) {
  const label = ROUTE_INFO[route].short;
  switch (breakEven.kind) {
    case "noDays":
      return <Stat label={label} value="n/a" hint="no paid days" />;
    case "outOfRange":
      return <Stat label={label} value={`${money(MAX_DAY_RATE)}+`} hint="more than any day rate here" />;
    case "rate": {
      const rate = Math.ceil(breakEven.dayRate);
      return <Stat label={label} value={money(rate)} hint={dayRateGap(dayRate - rate)} />;
    }
  }
}

function ScenarioTile({
  scenario,
  result,
  basis,
  permValue,
  best,
}: {
  scenario: Scenario;
  result: ScenarioResult;
  basis: CompareBasis;
  permValue: number;
  best: boolean;
}) {
  const value = scenarioValue(result, basis);
  const diff = value - permValue;
  const extras = result.pension + result.benefits;
  return (
    <div className={cn("rounded-2xl border-[2.5px] border-foreground px-3.5 py-3", scenario === "perm" ? "bg-card/60" : "bg-card")}>
      <p className="flex items-center justify-between gap-2 text-[15px] font-bold">
        <span className="flex items-center gap-2">
          <span className="size-2.5 shrink-0 rounded-full" style={{ background: COLORS[scenario] }} aria-hidden />
          {ROUTE_INFO[scenario].short}
        </span>
        {best && (
          <span className="rounded-full bg-foreground px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-background">
            Best
          </span>
        )}
      </p>
      <p className="mt-1 font-heading text-2xl font-extrabold tracking-tight text-numeric">{money(value)}</p>
      <dl className="mt-1 space-y-0.5 text-sm font-semibold">
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Monthly take-home</dt>
          <dd className="font-mono font-bold text-numeric">{money(result.takeHome / 12)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">{result.benefits > 0 ? "Pension + benefits" : "Pension"}</dt>
          <dd className="font-mono font-bold text-numeric">{money(extras)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">{scenario === "perm" ? "Tax and NI" : "vs your job"}</dt>
          <dd className="font-mono font-bold text-numeric">
            {scenario === "perm" ? money(result.tax) : signed(diff)}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function Breakdown({
  input,
  results,
  basis,
  view,
  onViewChange,
}: {
  input: ContractorInput;
  results: Record<Scenario, ScenarioResult>;
  basis: CompareBasis;
  view: Scenario;
  onViewChange: (s: Scenario) => void;
}) {
  const result = results[view];
  const equivalent = view === "perm" ? null : salaryEquivalent(input, scenarioValue(result, basis), basis);
  const lost = result.gross > 0 ? result.tax / result.gross : 0;

  return (
    <Card className="mt-6 min-w-0">
      <CardHeader>
        <CardTitle className="text-base">Where the money goes</CardTitle>
      </CardHeader>
      <CardContent className="min-w-0 space-y-4">
        <Segmented label="Route" size="sm" value={view} onChange={onViewChange} options={VIEW_OPTIONS} />
        <p className="text-sm font-semibold text-muted-foreground">
          {ROUTE_INFO[view].hint}. Tax, NI{view === "ltd" ? ", corporation tax" : ""}
          {view === "umbrella" ? " and employer costs" : ""} take {Math.round(lost * 100)}% of{" "}
          {view === "perm" ? "your gross pay" : "the contract income"}.
          {equivalent !== null && (
            <>
              {" "}
              Worth the same as a <span className="font-bold text-foreground">{money(equivalent)}</span>
              {" "}salary with your job&apos;s pension{basis === "package" ? " and benefits" : ""}.
            </>
          )}
        </p>
        <div className="overflow-x-auto rounded-2xl border-[2.5px] border-foreground">
          <table className="w-full min-w-[420px] font-mono text-sm font-bold text-numeric">
            <tbody>
              {result.lines.map((line, i) => (
                <Row key={i} line={line} />
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs font-semibold leading-relaxed text-muted-foreground">
          Annual figures for {TAX_YEARS[input.taxYear].label}, before VAT, with no student loan. The limited
          company pays out all of its profit and has no other employees, so it cannot claim the Employment
          Allowance.
        </p>
      </CardContent>
    </Card>
  );
}

function Row({ line }: { line: Line }) {
  if (line.kind === "heading") {
    return (
      <tr className="border-b border-foreground/10 bg-secondary/60">
        <td colSpan={2} className="px-4 pt-3 pb-1.5 font-sans text-xs font-bold uppercase tracking-wide text-muted-foreground">
          {line.label}
        </td>
      </tr>
    );
  }
  const strong = line.kind === "total" || line.kind === "subtotal";
  const value =
    line.kind === "cost"
      ? `${line.value < 0 ? "−" : ""}${money(Math.abs(line.value), 2)}`
      : line.kind === "note"
        ? `+${money(line.value, 2)}`
        : money(line.value, 2);
  return (
    <tr
      className={cn(
        "border-b border-foreground/10 last:border-0",
        line.kind === "total" && "bg-yellow",
        line.kind === "subtotal" && "bg-secondary",
        line.kind === "note" && "text-muted-foreground",
      )}
    >
      <td className={cn("px-4 py-2.5 font-sans", strong ? "font-bold" : "font-semibold")}>{line.label}</td>
      <td className="px-4 py-2.5 text-right whitespace-nowrap">{value}</td>
    </tr>
  );
}

function DayRateChart({ input, basis }: { input: ContractorInput; basis: CompareBasis }) {
  const maxRate = Math.max(1_000, Math.ceil((input.dayRate * 2) / 100) * 100);
  const curve = dayRateCurve(input, basis, maxRate, 40);

  return (
    <Card className="mt-6 min-w-0">
      <CardHeader>
        <CardTitle className="text-base">
          {basis === "package" ? "Take-home plus pension" : "Take-home"} by day rate
        </CardTitle>
      </CardHeader>
      <CardContent className="min-w-0">
        <GrowthChart
          series={SCENARIOS.map((s) => ({
            name: ROUTE_INFO[s].short,
            color: COLORS[s],
            values: curve.series[s],
          }))}
          xLabel={(i) => `${money(curve.rates[i] ?? 0)} a day`}
          xTick={(i) => money(curve.rates[i] ?? 0)}
          formatValue={(v) => money(v)}
          formatAxis={axis}
        />
        <p className="mt-3 text-xs font-semibold text-muted-foreground">
          Where a contracting line crosses the flat permanent line is that route&apos;s break-even day rate,
          with {workingDays(input).billable} paid days a year.
        </p>
      </CardContent>
    </Card>
  );
}

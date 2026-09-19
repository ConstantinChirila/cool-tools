"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, GraduationCap, PiggyBank, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Callout } from "@/components/calc/callout";
import { MobileResultBar } from "@/components/calc/mobile-result-bar";
import { Section } from "@/components/calc/section";
import { Segmented } from "@/components/calc/segmented";
import { SliderField } from "@/components/calc/slider-field";
import { HeroStat, Stat } from "@/components/calc/stat";
import { SwitchField } from "@/components/calc/switch-field";
import { SplitBar } from "@/components/charts/split-bar";
import { useUrlState, urlField, type NumberRange } from "@/hooks/use-url-state";
import { formatMoney } from "@/lib/currency";
import { BONUS_FREQUENCIES, compareSacrifice, type BonusInput, type BonusPayFrequency } from "@/lib/uk-bonus";
import {
  DEFAULT_TAX_YEAR,
  PERIOD_INFO,
  STUDENT_PLAN_INFO,
  STUDENT_PLANS,
  TAX_YEARS,
  type PensionType,
  type StudentPlan,
  type TaxYear,
  type UkSalaryInput,
} from "@/lib/uk-tax";
import { cn } from "@/lib/utils";

const DEFAULT_INPUT: BonusInput = {
  taxYear: DEFAULT_TAX_YEAR,
  salary: 40_000,
  bonus: 5_000,
  frequency: "month",
  scotland: false,
  taxCode: "",
  studentPlan: "none",
  postgradLoan: false,
  pensionType: "netpay",
  // Off by default: a pension on the salary moves where the higher rate starts, which
  // reads as a wrong answer to anyone expecting 40% from £50,270.
  pensionPct: 0,
  pensionOnBonus: false,
  sacrificePct: 0,
  director: false,
  noNi: false,
};

/** "auto" is left out: qualifying earnings would quietly take a slice of the bonus. */
const PENSION_OPTIONS: { value: PensionType; label: string }[] = [
  { value: "netpay", label: "Net pay" },
  { value: "sacrifice", label: "Sacrifice" },
  { value: "personal", label: "Relief at source" },
];

const MONEY: NumberRange = { min: 0, max: 10_000_000 };
const PERCENT: NumberRange = { min: 0, max: 100 };

const money = (v: number, decimals = 0) => formatMoney(v, "GBP", { decimals });
const pct = (v: number, decimals = 0) => `${(v * 100).toFixed(decimals)}%`;

/** One side of the cash-or-pension comparison. */
function Outcome({
  title,
  cash,
  pot,
  current,
}: {
  title: string;
  cash: number;
  pot: number;
  current: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border-[2.5px] border-foreground px-3.5 py-3",
        current ? "bg-card" : "bg-card/50",
      )}
    >
      <p className="flex items-center justify-between gap-2 text-[15px] font-bold">
        {title}
        {current && (
          <span className="rounded-full bg-foreground px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-background">
            Now
          </span>
        )}
      </p>
      <dl className="mt-1.5 space-y-0.5 text-sm font-semibold">
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Pocket</dt>
          <dd className="font-mono font-bold text-numeric">{money(cash)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Pension</dt>
          <dd className="font-mono font-bold text-numeric">{money(pot)}</dd>
        </div>
      </dl>
    </div>
  );
}

export function BonusTaxCalculator() {
  const [input, setInput] = React.useState<BonusInput>(DEFAULT_INPUT);
  const [open, setOpen] = React.useState<Set<string>>(() => new Set(["sacrifice"]));

  const update = <K extends keyof BonusInput>(key: K, value: BonusInput[K]) =>
    setInput((prev) => ({ ...prev, [key]: value }));
  const toggleSection = (key: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  useUrlState({
    salary: urlField(input.salary, (v: number) => update("salary", v), DEFAULT_INPUT.salary, undefined, MONEY),
    bonus: urlField(input.bonus, (v: number) => update("bonus", v), DEFAULT_INPUT.bonus, undefined, MONEY),
    year: urlField(input.taxYear, (v: string) => update("taxYear", v as TaxYear), DEFAULT_INPUT.taxYear, Object.keys(TAX_YEARS)),
    paid: urlField(
      input.frequency,
      (v: string) => update("frequency", v as BonusPayFrequency),
      DEFAULT_INPUT.frequency,
      BONUS_FREQUENCIES.map((f) => f.value),
    ),
    scotland: urlField(input.scotland, (v: boolean) => update("scotland", v), false),
    code: urlField(input.taxCode, (v: string) => update("taxCode", v), ""),
    loan: urlField(
      input.studentPlan,
      (v: string) => update("studentPlan", v as StudentPlan),
      DEFAULT_INPUT.studentPlan,
      STUDENT_PLANS.map((p) => p.value),
    ),
    postgrad: urlField(input.postgradLoan, (v: boolean) => update("postgradLoan", v), false),
    pension: urlField(
      input.pensionType,
      (v: string) => update("pensionType", v as PensionType),
      DEFAULT_INPUT.pensionType,
      PENSION_OPTIONS.map((p) => p.value),
    ),
    pensionPct: urlField(input.pensionPct, (v: number) => update("pensionPct", v), DEFAULT_INPUT.pensionPct, undefined, PERCENT),
    pensionOnBonus: urlField(input.pensionOnBonus, (v: boolean) => update("pensionOnBonus", v), false),
    sacrifice: urlField(input.sacrificePct, (v: number) => update("sacrificePct", v), 0, undefined, PERCENT),
    director: urlField(input.director, (v: boolean) => update("director", v), false),
    noNi: urlField(input.noNi, (v: boolean) => update("noNi", v), false),
  });

  const { result, allCash, allPension, pensionPerPound } = React.useMemo(() => compareSacrifice(input), [input]);

  const year = TAX_YEARS[input.taxYear];
  const period = PERIOD_INFO[input.frequency];

  const pensionSummary =
    input.pensionPct > 0
      ? `${input.pensionPct}% of salary${input.pensionOnBonus ? " and bonus" : ""}`
      : "No regular pension";
  const loanSummary =
    [input.studentPlan !== "none" && STUDENT_PLAN_INFO[input.studentPlan].label, input.postgradLoan && "Postgrad"]
      .filter(Boolean)
      .join(" · ") || "No student loan";
  const otherSummary =
    [
      period.label,
      input.taxCode.trim() && `Code ${input.taxCode.trim().toUpperCase()}`,
      input.director && "Director",
      input.noNi && "No NI",
    ]
      .filter(Boolean)
      .join(" · ");

  // The salary calculator's URL keys are its input field names: keep this tied to them.
  const salaryParams = {
    taxYear: input.taxYear,
    salary: String(input.salary),
    salaryPeriod: "year",
    bonus: String(Math.round(result.cashBonus)),
    scotland: input.scotland ? "1" : "0",
    taxCode: input.taxCode,
    studentPlan: input.studentPlan,
    postgradLoan: input.postgradLoan ? "1" : "0",
    pensionType: input.pensionType,
    pensionValue: String(input.pensionPct),
    pensionOnExtras: input.pensionOnBonus ? "1" : "0",
    noNi: input.noNi ? "1" : "0",
  } satisfies Partial<Record<keyof UkSalaryInput, string>>;
  const salaryLink = `/tools/uk-salary-calculator?${new URLSearchParams(salaryParams)}`;

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[5fr_6fr] lg:items-start">
        {/* ------------------------------------------------ Inputs */}
        <Card className="min-w-0">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Your bonus</CardTitle>
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
              id="bonus"
              label="Bonus before tax"
              value={input.bonus}
              onChange={(v) => update("bonus", v)}
              min={0}
              max={50_000}
              step={100}
              sliderStep={250}
              prefix="£"
              grouped
            />
            <SliderField
              id="salary"
              label="Annual salary, without the bonus"
              value={input.salary}
              onChange={(v) => update("salary", v)}
              min={0}
              max={200_000}
              step={500}
              sliderStep={1000}
              prefix="£"
              grouped
            />

            <SwitchField
              id="scotland"
              label="I live in Scotland"
              hint={result.withBonus.scotlandFromCode ? "Scottish rates set by tax code" : "Uses the Scottish income tax bands"}
              checked={input.scotland}
              onCheckedChange={(v) => update("scotland", v)}
            />

            <div className="space-y-2.5">
              <Section
                icon={PiggyBank}
                title="Put some of it in your pension"
                summary={
                  input.sacrificePct > 0
                    ? `${input.sacrificePct}% sacrificed: ${money(result.sacrificed)} to your pension`
                    : "All of it paid as cash"
                }
                active={input.sacrificePct > 0}
                open={open.has("sacrifice")}
                onToggle={() => toggleSection("sacrifice")}
              >
                <SliderField
                  id="sacrifice"
                  label="Share of the bonus to sacrifice"
                  value={input.sacrificePct}
                  onChange={(v) => update("sacrificePct", v)}
                  min={0}
                  max={100}
                  step={1}
                  sliderStep={5}
                  suffix="%"
                />
                <p className="text-xs font-semibold text-muted-foreground">
                  Bonus sacrifice swaps part of the bonus for an employer pension contribution before it is
                  paid, so that part escapes income tax, NI and student loan. Your employer has to offer it,
                  and you must agree it before the bonus is awarded.
                </p>
              </Section>

              <Section
                icon={PiggyBank}
                title="Regular pension"
                summary={pensionSummary}
                active={input.pensionPct > 0}
                open={open.has("pension")}
                onToggle={() => toggleSection("pension")}
              >
                <SliderField
                  id="pension-pct"
                  label="Your contribution"
                  value={input.pensionPct}
                  onChange={(v) => update("pensionPct", v)}
                  min={0}
                  max={40}
                  step={0.5}
                  sliderStep={0.5}
                  suffix="%"
                  decimals={1}
                />
                <p className="text-xs font-semibold text-muted-foreground">
                  A pension taken from your salary lowers your taxable pay, so the bonus reaches the higher
                  rate at a higher salary than the usual threshold.
                </p>
                <Segmented
                  label="How it is taken"
                  size="sm"
                  value={input.pensionType}
                  onChange={(v) => update("pensionType", v)}
                  options={PENSION_OPTIONS}
                />
                <SwitchField
                  id="pension-on-bonus"
                  label="Taken from the bonus too"
                  hint="Many schemes only count basic salary: check your contract or a past bonus payslip"
                  checked={input.pensionOnBonus}
                  onCheckedChange={(v) => update("pensionOnBonus", v)}
                />
              </Section>

              <Section
                icon={GraduationCap}
                title="Student loan"
                summary={loanSummary}
                active={input.studentPlan !== "none" || input.postgradLoan}
                open={open.has("loan")}
                onToggle={() => toggleSection("loan")}
              >
                <div className="space-y-1.5">
                  <Label htmlFor="student-plan" className="text-[15px] font-bold">
                    Repayment plan
                  </Label>
                  <Select value={input.studentPlan} onValueChange={(v) => update("studentPlan", v as StudentPlan)}>
                    <SelectTrigger id="student-plan" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STUDENT_PLANS.map((plan) => (
                        <SelectItem key={plan.value} value={plan.value}>
                          {plan.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {STUDENT_PLAN_INFO[input.studentPlan].hint && (
                    <p className="text-xs font-semibold text-muted-foreground">
                      {STUDENT_PLAN_INFO[input.studentPlan].hint}
                    </p>
                  )}
                </div>
                <SwitchField
                  id="postgrad"
                  label="Postgraduate loan"
                  hint={`${pct(year.postgradRate)} above the postgraduate threshold, on top of any plan`}
                  checked={input.postgradLoan}
                  onCheckedChange={(v) => update("postgradLoan", v)}
                />
              </Section>

              <Section
                icon={SlidersHorizontal}
                title="Pay frequency, tax code and NI"
                summary={otherSummary}
                active={input.frequency !== "month" || Boolean(input.taxCode.trim()) || input.director || input.noNi}
                open={open.has("other")}
                onToggle={() => toggleSection("other")}
              >
                <div className="space-y-1.5">
                  <Segmented
                    label="How often you are paid"
                    size="sm"
                    value={input.frequency}
                    onChange={(v) => update("frequency", v)}
                    options={BONUS_FREQUENCIES}
                  />
                  <p className="text-xs font-semibold text-muted-foreground">
                    NI and student loans are worked out on the single pay period the bonus lands in.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tax-code" className="text-[15px] font-bold">
                    Tax code
                  </Label>
                  <Input
                    id="tax-code"
                    value={input.taxCode}
                    onChange={(e) => update("taxCode", e.target.value)}
                    placeholder="1257L"
                    autoComplete="off"
                    spellCheck={false}
                    className="h-10 font-mono font-bold uppercase placeholder:normal-case placeholder:text-muted-foreground/50"
                  />
                  <p className="text-xs font-semibold text-muted-foreground">
                    {result.withBonus.allowanceNote || "Leave blank for the standard allowance"}
                  </p>
                </div>
                <SwitchField
                  id="director"
                  label="I am a company director"
                  hint="Directors' NI is assessed over the whole year, not the pay period"
                  checked={input.director}
                  onCheckedChange={(v) => update("director", v)}
                />
                <SwitchField
                  id="no-ni"
                  label="Over State Pension age"
                  hint="No employee National Insurance"
                  checked={input.noNi}
                  onCheckedChange={(v) => update("noNi", v)}
                />
              </Section>
            </div>
          </CardContent>
        </Card>

        {/* ------------------------------------------------ Results */}
        <div className="order-first min-w-0 space-y-6 lg:order-none lg:sticky lg:top-20">
          <Card className="min-w-0 bg-mint">
            <CardContent className="space-y-6 pt-6">
              <HeroStat
                label="You keep"
                value={money(result.takeHome)}
                hint={
                  result.bonus > 0
                    ? `of your ${money(result.bonus)} bonus · ${pct(result.keepRate)} in your pocket${
                        result.pensionPot > 0 ? ` · ${money(result.pensionPot)} to your pension` : ""
                      }`
                    : "Enter a bonus to see what is left after tax"
                }
              />

              <div className="flex flex-wrap gap-1.5">
                <Badge variant="secondary">{year.label}</Badge>
                <Badge variant="secondary">
                  {result.withBonus.scotland ? "Scottish rates" : "England, Wales and NI rates"}
                </Badge>
                <Badge variant="secondary">Paid {period.label.toLowerCase()}</Badge>
                {input.studentPlan !== "none" && (
                  <Badge variant="secondary">{STUDENT_PLAN_INFO[input.studentPlan].label}</Badge>
                )}
                {input.postgradLoan && <Badge variant="secondary">Postgrad loan</Badge>}
                {input.director && <Badge variant="secondary">Director</Badge>}
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-foreground/15 pt-5 sm:grid-cols-4">
                <Stat label="Income tax" value={money(result.incomeTax)} />
                <Stat
                  label="National Insurance"
                  value={money(result.nationalInsurance)}
                  hint={input.director ? "annual basis" : "on the bonus pay period"}
                />
                <Stat label="Student loans" value={money(result.loans)} />
                <Stat label="Lost to deductions" value={pct(result.deductionRate)} hint="of the cash bonus" />
              </div>

              <SplitBar
                segments={[
                  { name: "You keep", value: Math.max(result.takeHome, 0), color: "var(--chart-2)" },
                  { name: "Income tax", value: result.incomeTax, color: "var(--chart-1)" },
                  { name: "National Insurance", value: result.nationalInsurance, color: "var(--chart-4)" },
                  { name: "Student loans", value: result.loans, color: "var(--chart-5)" },
                  { name: "Pension", value: result.pensionPot, color: "var(--chart-3)" },
                ].filter((s) => s.value > 0)}
                format={(v) => money(v)}
              />

              {result.bonus > 0 && (
                <div className="space-y-2.5 border-t border-foreground/15 pt-5">
                  <p className="text-[15px] font-bold">Cash or pension?</p>
                  <div className={cn("grid gap-2.5", input.sacrificePct > 0 && input.sacrificePct < 100 ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
                    <Outcome
                      title="All as cash"
                      cash={allCash.takeHome}
                      pot={allCash.pensionPot}
                      current={input.sacrificePct === 0}
                    />
                    {input.sacrificePct > 0 && input.sacrificePct < 100 && (
                      <Outcome
                        title={`${input.sacrificePct}% to pension`}
                        cash={result.takeHome}
                        pot={result.pensionPot}
                        current
                      />
                    )}
                    <Outcome
                      title="All to pension"
                      cash={allPension.takeHome}
                      pot={allPension.pensionPot}
                      current={input.sacrificePct === 100}
                    />
                  </div>
                  <p className="text-xs font-semibold leading-relaxed text-foreground/75">
                    {pensionPerPound > 0
                      ? `Each £1 of take-home you give up puts ${money(pensionPerPound, 2)} in your pension. `
                      : `Sacrificing the whole bonus would turn ${money(allCash.takeHome)} of take-home into ${money(allPension.pensionPot)} of pension. `}
                    Your employer also saves {money(allPension.employerNiSaved)} of their own NI on a full
                    sacrifice, and some add it to the pot. Pension money is locked until at least age 55
                    (57 from 2028) and is taxed when you draw it.
                  </p>
                </div>
              )}

              {result.allowanceLost > 0 && (
                <Callout tone="warn">
                  {result.without.tapered
                    ? `Your salary is already over ${money(year.taperThreshold)}, so this bonus costs a further ${money(result.allowanceLost)} of tax-free personal allowance. `
                    : `This bonus takes you over ${money(year.taperThreshold)}, so you lose ${money(result.allowanceLost)} of tax-free personal allowance. `}
                  Between {money(year.taperThreshold)} and {money(result.taperEnd)} each extra £1 is
                  effectively taxed at 60% ({result.withBonus.scotland ? "more in Scotland" : "62% with NI"}).{" "}
                  {result.without.tapered
                    ? "Whatever you sacrifice into your pension escapes that rate."
                    : "Sacrificing enough into your pension to stay under the threshold avoids it."}
                </Callout>
              )}
              {result.crossedInto && result.allowanceLost === 0 && (
                <Callout>
                  Part of this bonus falls in the {result.crossedInto.toLowerCase()} band, which your salary
                  alone does not reach. The band breakdown below shows how much.
                </Callout>
              )}
              {result.niSavedVsAnnual > 0 && (
                <Callout>
                  NI is charged on the {period.noun} the bonus is paid, where most of it sits above the upper
                  limit at {pct(year.ni.upperRate)}. That makes it {money(result.nationalInsurance)}, not the{" "}
                  {money(result.annualBasisNi)} you get by treating the bonus as extra annual salary.
                </Callout>
              )}
              {result.loanTriggeredByBonus && (
                <Callout tone="warn">
                  Your salary is under the student loan threshold, but repayments are worked out on each pay
                  period alone, so the bonus {period.noun} triggers {money(result.studentLoan)}. If your income
                  for the whole year stays under the annual threshold you can claim it back from the Student
                  Loans Company after the tax year ends.
                </Callout>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ------------------------------------------------ Detail */}
      <Card className="mt-6 min-w-0">
        <CardHeader>
          <CardTitle className="text-base">Where the bonus goes</CardTitle>
        </CardHeader>
        <CardContent className="min-w-0 space-y-4">
          <div className="overflow-x-auto rounded-2xl border-[2.5px] border-foreground">
            <table className="w-full min-w-[420px] font-mono text-sm font-bold text-numeric">
              <tbody>
                <Row label="Bonus before tax" value={money(result.bonus, 2)} strong />
                {result.sacrificed > 0 && (
                  <Row label="Sacrificed into your pension" value={`−${money(result.sacrificed, 2)}`} />
                )}
                {result.taxBands.map((band) => (
                  <Row
                    key={band.name}
                    label={`Income tax: ${money(band.amount)} at ${pct(band.rate)} (${band.name.toLowerCase()})`}
                    value={`−${money(band.tax, 2)}`}
                  />
                ))}
                {result.allowanceLost > 0 && (
                  <Row
                    label={`of which, tax on ${money(result.allowanceLost)} of lost personal allowance`}
                    value="included above"
                    muted
                  />
                )}
                <Row label="National Insurance" value={`−${money(result.nationalInsurance, 2)}`} />
                {result.studentLoan > 0 && <Row label="Student loan" value={`−${money(result.studentLoan, 2)}`} />}
                {result.postgradLoan > 0 && <Row label="Postgraduate loan" value={`−${money(result.postgradLoan, 2)}`} />}
                {result.pension > 0 && <Row label="Regular pension contribution" value={`−${money(result.pension, 2)}`} />}
                <Row label="You keep" value={money(result.takeHome, 2)} strong />
              </tbody>
            </table>
          </div>
          <p className="text-xs font-semibold leading-relaxed text-muted-foreground">
            Income tax is the difference between your year with and without the bonus, which is what PAYE
            collects overall. The bonus payslip itself can show more or less tax than this, because a
            cumulative tax code spreads allowances across the year; it evens out by the end of the tax year.
          </p>
          <Link
            href={salaryLink}
            className="inline-flex h-10 items-center gap-1.5 rounded-full border-[2.5px] border-foreground bg-card px-4 text-sm font-bold transition-transform hover:-translate-y-0.5"
          >
            See your full year in the UK Salary Calculator
            <ArrowRight className="size-4" strokeWidth={2.5} />
          </Link>
        </CardContent>
      </Card>

      <MobileResultBar label="You keep" value={money(result.takeHome)} />
    </>
  );
}

function Row({
  label,
  value,
  strong,
  muted,
}: {
  label: string;
  value: string;
  strong?: boolean;
  muted?: boolean;
}) {
  return (
    <tr
      className={cn(
        "border-b border-foreground/10 last:border-0",
        strong && "bg-secondary",
        muted && "text-muted-foreground",
      )}
    >
      <td className="px-4 py-2.5 font-sans">{label}</td>
      <td className="px-4 py-2.5 text-right whitespace-nowrap">{value}</td>
    </tr>
  );
}

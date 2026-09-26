"use client";

import * as React from "react";
import {
  CalendarClock,
  Car,
  GraduationCap,
  HeartHandshake,
  PiggyBank,
  Sparkles,
} from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Callout } from "@/components/calc/callout";
import { MobileResultBar } from "@/components/calc/mobile-result-bar";
import { NumberField } from "@/components/calc/number-field";
import { Section, useSectionState } from "@/components/calc/section";
import { Segmented } from "@/components/calc/segmented";
import { SliderField } from "@/components/calc/slider-field";
import { StudentLoanFields } from "@/components/calc/student-loan-fields";
import { TaxYearSelect } from "@/components/calc/tax-year-select";
import { HeroStat, Stat } from "@/components/calc/stat";
import { SwitchField } from "@/components/calc/switch-field";
import { GrowthChart } from "@/components/charts/growth-chart";
import { SplitBar } from "@/components/charts/split-bar";
import { MONEY_RANGE as MONEY, useUrlState, urlField, type NumberRange, type UrlField } from "@/hooks/use-url-state";
import { formatGbp as money, formatMoney, formatPercent } from "@/lib/currency";
import {
  calculateUkSalary,
  DEFAULT_TAX_YEAR,
  PENSION_TYPE_INFO,
  PENSION_TYPES,
  PERIOD_INFO,
  periodsPerYear,
  salaryCurve,
  STUDENT_PLAN_INFO,
  STUDENT_PLANS,
  TAX_YEARS,
  type MarriageAllowance,
  type PayPeriod,
  type PensionMethod,
  type PensionType,
  type UkSalaryInput,
} from "@/lib/uk-tax";
import { cn } from "@/lib/utils";

type InputPeriod = Extract<PayPeriod, "year" | "month" | "week" | "day" | "hour">;

const INPUT_PERIODS: { value: InputPeriod; label: string }[] = [
  { value: "year", label: "Year" },
  { value: "month", label: "Month" },
  { value: "week", label: "Week" },
  { value: "day", label: "Day" },
  { value: "hour", label: "Hour" },
];

const VIEW_PERIODS: { value: PayPeriod; label: string }[] = [
  { value: "year", label: "Year" },
  { value: "month", label: "Month" },
  { value: "week", label: "Week" },
  { value: "day", label: "Day" },
  { value: "hour", label: "Hour" },
];

const SALARY_RANGE: Record<InputPeriod, { max: number; step: number; sliderStep: number; decimals: number }> = {
  year: { max: 300_000, step: 100, sliderStep: 500, decimals: 0 },
  month: { max: 25_000, step: 10, sliderStep: 50, decimals: 0 },
  week: { max: 6_000, step: 1, sliderStep: 10, decimals: 0 },
  day: { max: 1_500, step: 1, sliderStep: 5, decimals: 0 },
  hour: { max: 150, step: 0.01, sliderStep: 0.25, decimals: 2 },
};

const TABLE_PERIODS: PayPeriod[] = ["year", "month", "week", "day", "hour"];

const DEFAULT_INPUT: UkSalaryInput = {
  taxYear: DEFAULT_TAX_YEAR,
  salary: 40_000,
  salaryPeriod: "year",
  hoursPerWeek: 37.5,
  daysPerWeek: 5,
  scotland: false,
  taxCode: "",
  noNi: false,
  blind: false,
  marriage: "none",
  studentPlan: "none",
  postgradLoan: false,
  pensionType: "auto",
  pensionMethod: "percent",
  pensionValue: 5,
  pensionOnExtras: false,
  employerPensionPct: 3,
  bonus: 0,
  overtimeHours: 0,
  overtimeMultiplier: 1.5,
  cashAllowance: 0,
  taxableBenefits: 0,
  childcareVouchers: 0,
  childcarePre2011: false,
  salarySacrifice: 0,
  preTaxDeduction: 0,
  postTaxDeduction: 0,
};

const pct = (v: number, decimals = 1) => formatPercent(v, decimals);

/* ------------------------------------------------------------------ */
/* URL state                                                            */
/* ------------------------------------------------------------------ */

/** Allowed URL values for the string-union fields of UkSalaryInput. */
const ALLOWED_VALUES: Partial<Record<keyof UkSalaryInput, readonly string[]>> = {
  taxYear: Object.keys(TAX_YEARS),
  salaryPeriod: INPUT_PERIODS.map((p) => p.value),
  marriage: ["none", "receive", "transfer"],
  studentPlan: STUDENT_PLANS.map((p) => p.value),
  pensionType: PENSION_TYPES.map((p) => p.value),
  pensionMethod: ["percent", "amount"],
};

/** Clamp ranges for the numeric fields of UkSalaryInput when read from the URL. */
const NUMBER_RANGES: Partial<Record<keyof UkSalaryInput, NumberRange>> = {
  salary: MONEY,
  hoursPerWeek: { min: 1, max: 100 },
  daysPerWeek: { min: 1, max: 7 },
  pensionValue: MONEY,
  employerPensionPct: { min: 0, max: 100 },
  bonus: MONEY,
  overtimeHours: { min: 0, max: 80 },
  overtimeMultiplier: { min: 1, max: 5 },
  cashAllowance: MONEY,
  taxableBenefits: MONEY,
  childcareVouchers: MONEY,
  salarySacrifice: MONEY,
  preTaxDeduction: MONEY,
  postTaxDeduction: MONEY,
};

/**
 * Binds one UkSalaryInput field to the URL. urlField's generic can't prove
 * that a dynamic key's value type satisfies Primitive, even though every
 * UkSalaryInput field actually is a string, number or boolean, so the casts
 * below are the contained escape hatch for that.
 */
function bindInputField<K extends keyof UkSalaryInput>(
  key: K,
  input: UkSalaryInput,
  update: <K2 extends keyof UkSalaryInput>(key: K2, value: UkSalaryInput[K2]) => void,
): UrlField {
  const value = input[key] as string | number | boolean;
  const def = DEFAULT_INPUT[key] as string | number | boolean;
  const set = (v: string | number | boolean) => update(key, v as UkSalaryInput[K]);
  return urlField(value, set, def, ALLOWED_VALUES[key], NUMBER_RANGES[key]);
}

/* ------------------------------------------------------------------ */
/* Main component                                                       */
/* ------------------------------------------------------------------ */

export function UkSalaryCalculator() {
  const [input, setInput] = React.useState<UkSalaryInput>(DEFAULT_INPUT);
  const [view, setView] = React.useState<PayPeriod>("month");
  const sections = useSectionState(["pension"]);

  const update = React.useCallback(
    <K extends keyof UkSalaryInput>(key: K, value: UkSalaryInput[K]) =>
      setInput((prev) => ({ ...prev, [key]: value })),
    [],
  );

  useUrlState({
    ...Object.fromEntries(
      (Object.keys(DEFAULT_INPUT) as (keyof UkSalaryInput)[]).map((key) => [
        key,
        bindInputField(key, input, update),
      ]),
    ),
    view: urlField(
      view,
      setView,
      "month",
      VIEW_PERIODS.map((p) => p.value),
    ),
  });

  const result = React.useMemo(() => calculateUkSalary(input), [input]);
  const year = TAX_YEARS[input.taxYear];

  const curve = React.useMemo(() => {
    const top = Math.max(150_000, Math.ceil((result.salary * 1.6) / 25_000) * 25_000);
    return salaryCurve(input, top, 40);
  }, [input, result.salary]);

  const per = periodsPerYear(view, input.hoursPerWeek, input.daysPerWeek);
  const perLabel = PERIOD_INFO[view];
  const inView = (annual: number) => money(annual / per, view === "year" ? 0 : 2);

  const changeSalaryPeriod = (next: InputPeriod) => {
    const annual = result.salary;
    const factor = periodsPerYear(next, input.hoursPerWeek, input.daysPerWeek);
    const converted = Number((annual / factor).toFixed(SALARY_RANGE[next].decimals));
    setInput((prev) => ({ ...prev, salaryPeriod: next, salary: converted }));
  };

  const range = SALARY_RANGE[input.salaryPeriod as InputPeriod];

  /* Section summaries */
  const pensionSummary =
    result.pensionGross > 0
      ? `${input.pensionMethod === "percent" ? `${input.pensionValue}%` : money(input.pensionValue)} · ${PENSION_TYPE_INFO[input.pensionType].label}${input.employerPensionPct > 0 ? ` · employer ${input.employerPensionPct}%` : ""}`
      : "No pension contributions";
  const loanSummary = [
    input.studentPlan !== "none" && STUDENT_PLAN_INFO[input.studentPlan].label,
    input.postgradLoan && "Postgraduate loan",
  ]
    .filter(Boolean)
    .join(" + ") || "No student loan";
  const extrasSummary = [
    result.bonus > 0 && `${money(result.bonus)} bonus`,
    result.overtime > 0 && `${input.overtimeHours}h/wk overtime at ${input.overtimeMultiplier}×`,
  ]
    .filter(Boolean)
    .join(" · ") || "No bonus or overtime";
  const benefitsSummary = [
    result.cashAllowance > 0 && `${money(result.cashAllowance)} cash allowance`,
    input.taxableBenefits > 0 && `${money(input.taxableBenefits)} benefits`,
    input.childcareVouchers > 0 && `${money(input.childcareVouchers)}/mo childcare`,
    input.salarySacrifice > 0 && `${money(input.salarySacrifice)} sacrifice`,
  ]
    .filter(Boolean)
    .join(" · ") || "None";
  const allowancesSummary = [
    input.blind && "Blind Person's Allowance",
    input.marriage === "receive" && "Receiving Marriage Allowance",
    input.marriage === "transfer" && "Transferring Marriage Allowance",
    input.noNi && "No NI",
  ]
    .filter(Boolean)
    .join(" · ") || "Standard allowances";
  const patternSummary = [
    `${input.hoursPerWeek}h × ${input.daysPerWeek} days`,
    input.preTaxDeduction > 0 && `${money(input.preTaxDeduction)}/mo pre-tax`,
    input.postTaxDeduction > 0 && `${money(input.postTaxDeduction)}/mo post-tax`,
  ]
    .filter(Boolean)
    .join(" · ");

  const otherDeductions =
    result.childcareVouchers + result.salarySacrifice + result.preTaxDeduction + result.postTaxDeduction;

  const inTaper = !result.scotland && result.marginalRate >= 0.6 && result.allowance > 0 && result.tapered;

  const breakdownRows: { label: string; value: number; kind?: "muted" | "deduct" | "total" }[] = [
    { label: "Gross income", value: result.gross },
    { label: "Personal allowance", value: result.allowance, kind: "muted" },
    { label: "Taxable income", value: result.taxableIncome, kind: "muted" },
    { label: "Income tax", value: result.incomeTax, kind: "deduct" },
    { label: "National Insurance", value: result.nationalInsurance, kind: "deduct" },
    ...(result.pensionDeducted > 0
      ? [{ label: "Pension", value: result.pensionDeducted, kind: "deduct" as const }]
      : []),
    ...(result.studentLoan > 0
      ? [{ label: "Student loan", value: result.studentLoan, kind: "deduct" as const }]
      : []),
    ...(result.postgradLoan > 0
      ? [{ label: "Postgraduate loan", value: result.postgradLoan, kind: "deduct" as const }]
      : []),
    ...(result.childcareVouchers > 0
      ? [{ label: "Childcare vouchers", value: result.childcareVouchers, kind: "deduct" as const }]
      : []),
    ...(result.salarySacrifice > 0
      ? [{ label: "Salary sacrifice", value: result.salarySacrifice, kind: "deduct" as const }]
      : []),
    ...(result.preTaxDeduction > 0
      ? [{ label: "Pre-tax deductions", value: result.preTaxDeduction, kind: "deduct" as const }]
      : []),
    ...(result.postTaxDeduction > 0
      ? [{ label: "Post-tax deductions", value: result.postTaxDeduction, kind: "deduct" as const }]
      : []),
    { label: "Take-home pay", value: result.takeHome, kind: "total" },
  ];

  const ni = year.ni;

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[5fr_6fr] lg:items-start">
        {/* ------------------------------------------------ Inputs */}
        <Card className="min-w-0">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Your salary</CardTitle>
            <TaxYearSelect value={input.taxYear} onChange={(v) => update("taxYear", v)} />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <SliderField
                key={input.salaryPeriod}
                id="salary"
                label={`Salary per ${perLabelFor(input.salaryPeriod)}`}
                value={input.salary}
                onChange={(v) => update("salary", v)}
                min={0}
                max={range.max}
                step={range.step}
                sliderStep={range.sliderStep}
                prefix="£"
                grouped
                decimals={range.decimals}
              />
              <Segmented
                label="Salary period"
                size="sm"
                value={input.salaryPeriod as InputPeriod}
                onChange={changeSalaryPeriod}
                options={INPUT_PERIODS}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="tax-code" className="text-sm font-bold text-muted-foreground">
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
                <p className="text-xs font-bold text-muted-foreground/70">
                  {result.allowanceNote || "Leave blank for the standard allowance"}
                </p>
              </div>
              <div className="space-y-1.5 sm:self-end">
                <SwitchField
                  id="scotland"
                  label="I live in Scotland"
                  checked={input.scotland}
                  onCheckedChange={(v) => update("scotland", v)}
                  className="h-10 rounded-2xl border-[2.5px] border-foreground bg-card px-3"
                />
                <p className="text-xs font-bold text-muted-foreground/70">
                  {result.scotlandFromCode ? "Scottish rates set by tax code" : "Uses the Scottish income tax bands"}
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              <Section
                icon={PiggyBank}
                title="Pension"
                summary={pensionSummary}
                active={result.pensionGross > 0}
                open={sections.isOpen("pension")}
                onToggle={() => sections.toggle("pension")}
              >
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold text-muted-foreground">Scheme type</Label>
                  <Select
                    value={input.pensionType}
                    onValueChange={(v) => update("pensionType", v as PensionType)}
                  >
                    <SelectTrigger aria-label="Pension scheme type" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PENSION_TYPES.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs font-bold text-muted-foreground/70">
                    {PENSION_TYPE_INFO[input.pensionType].hint}
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                  <NumberField
                    id="pension-value"
                    label="Your contribution"
                    value={input.pensionValue}
                    onChange={(v) => update("pensionValue", v)}
                    max={input.pensionMethod === "percent" ? 100 : undefined}
                    prefix={input.pensionMethod === "amount" ? "£" : undefined}
                    suffix={input.pensionMethod === "percent" ? "%" : "/yr"}
                    grouped={input.pensionMethod === "amount"}
                    decimals={input.pensionMethod === "percent" ? 2 : 0}
                  />
                  <div className="space-y-1.5">
                    <Label className="text-sm font-bold text-muted-foreground">Entered as</Label>
                    <Segmented
                      label="Pension contribution method"
                      value={input.pensionMethod}
                      onChange={(v: PensionMethod) =>
                        // The value means something different in each method, so
                        // carry the equivalent across rather than reuse the number.
                        setInput((prev) => ({
                          ...prev,
                          pensionMethod: v,
                          pensionValue:
                            v === "percent" ? DEFAULT_INPUT.pensionValue : Math.round(result.pensionGross),
                        }))
                      }
                      options={[
                        { value: "percent", label: "%" },
                        { value: "amount", label: "£" },
                      ]}
                      size="sm"
                      className="w-24"
                    />
                  </div>
                </div>
                <NumberField
                  id="employer-pension"
                  label="Employer contribution"
                  value={input.employerPensionPct}
                  onChange={(v) => update("employerPensionPct", v)}
                  max={100}
                  suffix="%"
                  hint="Auto-enrolment minimum is 3%. Doesn't change your take-home, shown in employer cost."
                />
                {input.pensionType !== "auto" && (
                  <SwitchField
                    id="pension-extras"
                    label="Include bonus and overtime"
                    hint="Apply the percentage to bonus and overtime too"
                    checked={input.pensionOnExtras}
                    onCheckedChange={(v) => update("pensionOnExtras", v)}
                  />
                )}
              </Section>

              <Section
                icon={GraduationCap}
                title="Student loan"
                summary={loanSummary}
                active={input.studentPlan !== "none" || input.postgradLoan}
                open={sections.isOpen("loan")}
                onToggle={() => sections.toggle("loan")}
              >
                <StudentLoanFields
                  taxYear={input.taxYear}
                  studentPlan={input.studentPlan}
                  postgradLoan={input.postgradLoan}
                  onPlanChange={(v) => update("studentPlan", v)}
                  onPostgradChange={(v) => update("postgradLoan", v)}
                />
              </Section>

              <Section
                icon={Sparkles}
                title="Bonus and overtime"
                summary={extrasSummary}
                active={result.bonus > 0 || result.overtime > 0}
                open={sections.isOpen("extras")}
                onToggle={() => sections.toggle("extras")}
              >
                <NumberField
                  id="bonus"
                  label="Annual bonus"
                  value={input.bonus}
                  onChange={(v) => update("bonus", v)}
                  prefix="£"
                  grouped
                  decimals={0}
                  hint="Taxed as ordinary income across the year. NI is estimated on an annual basis; a one-off bonus is usually charged more NI in the month it is paid."
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <NumberField
                    id="overtime-hours"
                    label="Overtime per week"
                    value={input.overtimeHours}
                    onChange={(v) => update("overtimeHours", v)}
                    max={80}
                    suffix="hrs"
                    decimals={1}
                  />
                  <NumberField
                    id="overtime-rate"
                    label="Overtime rate"
                    value={input.overtimeMultiplier}
                    onChange={(v) => update("overtimeMultiplier", v)}
                    max={5}
                    suffix="× hourly"
                    decimals={2}
                  />
                </div>
                {result.overtime > 0 && (
                  <p className="text-xs font-bold text-muted-foreground/70">
                    Hourly rate {money(result.hourlyRate, 2)}, overtime adds {money(result.overtime)} a year
                  </p>
                )}
              </Section>

              <Section
                icon={Car}
                title="Benefits and salary sacrifice"
                summary={benefitsSummary}
                active={
                  result.cashAllowance > 0 ||
                  input.taxableBenefits > 0 ||
                  input.childcareVouchers > 0 ||
                  input.salarySacrifice > 0
                }
                open={sections.isOpen("benefits")}
                onToggle={() => sections.toggle("benefits")}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <NumberField
                    id="cash-allowance"
                    label="Cash allowance"
                    value={input.cashAllowance}
                    onChange={(v) => update("cashAllowance", v)}
                    prefix="£"
                    suffix="/yr"
                    grouped
                    decimals={0}
                    hint="Car allowance etc. Paid and taxed like salary."
                  />
                  <NumberField
                    id="taxable-benefits"
                    label="Taxable benefits"
                    value={input.taxableBenefits}
                    onChange={(v) => update("taxableBenefits", v)}
                    prefix="£"
                    suffix="/yr"
                    grouped
                    decimals={0}
                    hint="Company car, medical: taxed but no NI for you."
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <NumberField
                    id="childcare"
                    label="Childcare vouchers"
                    value={input.childcareVouchers}
                    onChange={(v) => update("childcareVouchers", v)}
                    prefix="£"
                    suffix="/mo"
                    grouped
                    decimals={0}
                    hint="Tax and NI free up to £243, £124 or £110 a month by rate band."
                  />
                  <NumberField
                    id="sacrifice"
                    label="Other salary sacrifice"
                    value={input.salarySacrifice}
                    onChange={(v) => update("salarySacrifice", v)}
                    prefix="£"
                    suffix="/yr"
                    grouped
                    decimals={0}
                    hint="Cycle to work, EV lease: exempt from tax and NI."
                  />
                </div>
                {input.childcareVouchers > 0 && (
                  <SwitchField
                    id="childcare-pre2011"
                    label="Joined the voucher scheme before 6 April 2011"
                    hint="Keeps the £243 a month exemption whatever your rate band"
                    checked={input.childcarePre2011}
                    onCheckedChange={(v) => update("childcarePre2011", v)}
                  />
                )}
              </Section>

              <Section
                icon={HeartHandshake}
                title="Allowances"
                summary={allowancesSummary}
                active={input.blind || input.marriage !== "none" || input.noNi}
                open={sections.isOpen("allowances")}
                onToggle={() => sections.toggle("allowances")}
              >
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold text-muted-foreground">Marriage Allowance</Label>
                  <Select
                    value={input.marriage}
                    onValueChange={(v) => update("marriage", v as MarriageAllowance)}
                  >
                    <SelectTrigger aria-label="Marriage Allowance" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not claiming</SelectItem>
                      <SelectItem value="receive">My partner transfers £1,260 to me</SelectItem>
                      <SelectItem value="transfer">I transfer £1,260 to my partner</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs font-bold text-muted-foreground/70">
                    The lower earner (below the personal allowance) can pass 10% of it to a basic-rate partner.
                  </p>
                </div>
                <SwitchField
                  id="blind"
                  label="Blind Person's Allowance"
                  hint={`Adds ${money(year.blindAllowance)} to your tax-free allowance`}
                  checked={input.blind}
                  onCheckedChange={(v) => update("blind", v)}
                />
                <SwitchField
                  id="no-ni"
                  label="Over State Pension age"
                  hint="No employee National Insurance"
                  checked={input.noNi}
                  onCheckedChange={(v) => update("noNi", v)}
                />
              </Section>

              <Section
                icon={CalendarClock}
                title="Working pattern and deductions"
                summary={patternSummary}
                active={input.preTaxDeduction > 0 || input.postTaxDeduction > 0}
                open={sections.isOpen("pattern")}
                onToggle={() => sections.toggle("pattern")}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <NumberField
                    id="hours"
                    label="Hours per week"
                    value={input.hoursPerWeek}
                    onChange={(v) => update("hoursPerWeek", Math.max(v, 1))}
                    min={1}
                    max={100}
                    suffix="hrs"
                    decimals={1}
                    hint="Sets your hourly rate and overtime"
                  />
                  <NumberField
                    id="days"
                    label="Days per week"
                    value={input.daysPerWeek}
                    onChange={(v) => update("daysPerWeek", Math.min(Math.max(v, 1), 7))}
                    min={1}
                    max={7}
                    suffix="days"
                    decimals={1}
                    hint="Sets your daily rate"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <NumberField
                    id="pre-tax"
                    label="Pre-tax deductions"
                    value={input.preTaxDeduction}
                    onChange={(v) => update("preTaxDeduction", v)}
                    prefix="£"
                    suffix="/mo"
                    grouped
                    decimals={0}
                    hint="Give As You Earn, taken before tax"
                  />
                  <NumberField
                    id="post-tax"
                    label="Post-tax deductions"
                    value={input.postTaxDeduction}
                    onChange={(v) => update("postTaxDeduction", v)}
                    prefix="£"
                    suffix="/mo"
                    grouped
                    decimals={0}
                    hint="Union fees, season ticket loan, Gift Aid"
                  />
                </div>
              </Section>
            </div>
          </CardContent>
        </Card>

        {/* ------------------------------------------------ Results */}
        <div className="order-first min-w-0 space-y-6 lg:order-none lg:sticky lg:top-20">
          <Card className="min-w-0 bg-yellow">
            <CardContent className="space-y-6 pt-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <HeroStat
                  label={`Take-home pay per ${perLabel.noun}`}
                  value={inView(result.takeHome)}
                  hint={`from ${inView(result.gross)} gross · you keep ${pct(result.gross > 0 ? result.takeHome / result.gross : 0, 0)}`}
                />
                <Segmented
                  label="Show amounts per"
                  size="sm"
                  value={view}
                  onChange={setView}
                  options={VIEW_PERIODS}
                  className="w-full sm:w-auto"
                />
              </div>

              <div className="flex flex-wrap gap-1.5">
                <Badge variant="secondary">{year.label}</Badge>
                <Badge variant="secondary">{result.scotland ? "Scottish rates" : "England, Wales and NI rates"}</Badge>
                {input.taxCode.trim() && <Badge variant="secondary">Code {input.taxCode.trim().toUpperCase()}</Badge>}
                {input.studentPlan !== "none" && (
                  <Badge variant="secondary">{STUDENT_PLAN_INFO[input.studentPlan].label}</Badge>
                )}
                {input.postgradLoan && <Badge variant="secondary">Postgrad loan</Badge>}
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-foreground/15 pt-5 sm:grid-cols-4">
                <Stat label="Income tax" value={inView(result.incomeTax)} />
                <Stat label="National Insurance" value={inView(result.nationalInsurance)} />
                <Stat label="Effective tax rate" value={pct(result.effectiveRate)} hint="tax + NI over gross" />
                <Stat label="Marginal rate" value={pct(result.marginalRate, 0)} hint="on the next £1,000" />
              </div>

              <SplitBar
                segments={[
                  { name: "Take-home", value: Math.max(result.takeHome, 0), color: "var(--chart-2)" },
                  { name: "Income tax", value: result.incomeTax, color: "var(--chart-1)" },
                  { name: "National Insurance", value: result.nationalInsurance, color: "var(--chart-4)" },
                  { name: "Pension", value: result.pensionDeducted, color: "var(--chart-3)" },
                  { name: "Student loans", value: result.studentLoan + result.postgradLoan, color: "var(--chart-5)" },
                  { name: "Other", value: otherDeductions, color: "var(--chart-neutral)" },
                ].filter((s) => s.value > 0)}
                format={(v) => inView(v)}
              />

              {inTaper && (
                <Callout tone="warn">
                  You are in the 60% trap. Between {money(year.taperThreshold)} and{" "}
                  {money(year.taperThreshold + year.personalAllowance * 2)} every £2 earned removes £1 of
                  personal allowance, so each extra £1 costs about 62p. Pension contributions bring
                  adjusted income back under the threshold.
                </Callout>
              )}
              {result.tapered && result.allowance === 0 && result.taxableIncome > 0 && (
                <Callout>Your personal allowance has tapered away completely above {money(year.taperThreshold + year.personalAllowance * 2)}.</Callout>
              )}
              {result.shortfall > 0 && (
                <Callout tone="warn">
                  Your deductions are {money(result.shortfall)} more than your pay. Take-home is shown as
                  zero, so check the pension and deduction amounts.
                </Callout>
              )}
              {input.pensionType === "personal" && result.pensionGross > 0 && (
                <Callout>
                  You pay {money(result.pensionDeducted)} and your provider adds basic-rate relief, so{" "}
                  {money(result.pensionGross)} reaches your pension.
                </Callout>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ------------------------------------------------ Detail */}
      <Card className="mt-6 min-w-0">
        <CardHeader>
          <CardTitle className="text-base">Full breakdown</CardTitle>
        </CardHeader>
        <CardContent className="min-w-0">
          <Tabs defaultValue="breakdown">
            <TabsList className="mb-4">
              <TabsTrigger value="breakdown">By period</TabsTrigger>
              <TabsTrigger value="bands">Tax bands</TabsTrigger>
              <TabsTrigger value="curve">Salary curve</TabsTrigger>
            </TabsList>

            <TabsContent value="breakdown" className="space-y-6">
              <div className="overflow-x-auto rounded-2xl border-2 border-foreground">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="bg-card">
                    <tr className="border-b border-foreground/15 text-left text-xs font-bold text-muted-foreground">
                      <th className="px-4 py-2.5 font-medium">&nbsp;</th>
                      {TABLE_PERIODS.map((p) => (
                        <th key={p} className="px-4 py-2.5 text-right font-medium">
                          {PERIOD_INFO[p].label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="text-numeric">
                    {breakdownRows.map((row) => (
                      <tr
                        key={row.label}
                        className={cn(
                          "border-b border-foreground/10 last:border-0 hover:bg-secondary",
                          row.kind === "total" && "bg-mint font-bold",
                        )}
                      >
                        <td
                          className={cn(
                            "px-4 py-2.5 font-sans",
                            row.kind === "muted" ? "text-muted-foreground/80" : "text-muted-foreground",
                            row.kind === "total" && "text-foreground",
                          )}
                        >
                          {row.label}
                        </td>
                        {TABLE_PERIODS.map((p) => {
                          const n = periodsPerYear(p, input.hoursPerWeek, input.daysPerWeek);
                          return (
                            <td
                              key={p}
                              className={cn(
                                "px-4 py-2.5 text-right",
                                row.kind === "muted" && "text-muted-foreground",
                                row.kind === "deduct" && "text-foreground/80",
                              )}
                            >
                              {row.kind === "deduct" && row.value > 0 ? "−" : ""}
                              {money(row.value / n, p === "year" ? 0 : 2)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <p className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  What you cost your employer
                </p>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <Stat label="Gross pay" value={inView(result.gross)} />
                  <Stat label="Employer NI" value={inView(result.employerNi)} hint={`${pct(ni.employerRate, 0)} above ${money(ni.secondaryThreshold)}`} />
                  <Stat label="Employer pension" value={inView(result.employerPension)} />
                  <Stat label="Total cost" value={inView(result.employerCost)} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="bands" className="space-y-6">
              <div className="overflow-x-auto rounded-2xl border-2 border-foreground">
                <table className="w-full min-w-[520px] text-sm">
                  <thead className="bg-card">
                    <tr className="border-b border-foreground/15 text-left text-xs font-bold text-muted-foreground">
                      <th className="px-4 py-2.5 font-medium">Band</th>
                      <th className="px-4 py-2.5 text-right font-medium">Rate</th>
                      <th className="px-4 py-2.5 text-right font-medium">Income in band</th>
                      <th className="px-4 py-2.5 text-right font-medium">Tax</th>
                    </tr>
                  </thead>
                  <tbody className="text-numeric">
                    <tr className="border-b border-foreground/10 bg-secondary">
                      <td colSpan={4} className="px-4 py-2 font-sans text-xs font-medium text-muted-foreground">
                        Income tax · {result.scotland ? "Scotland" : "England, Wales and Northern Ireland"}
                      </td>
                    </tr>
                    <tr className="border-b border-foreground/10">
                      <td className="px-4 py-2.5 font-sans text-muted-foreground">Personal allowance</td>
                      <td className="px-4 py-2.5 text-right">0%</td>
                      <td className="px-4 py-2.5 text-right">{money(Math.min(result.allowance, result.gross))}</td>
                      <td className="px-4 py-2.5 text-right">{money(0)}</td>
                    </tr>
                    {result.bands.map((b) => (
                      <tr
                        key={b.name}
                        className={cn("border-b border-foreground/10", b.amount === 0 && "text-muted-foreground/50")}
                      >
                        <td className="px-4 py-2.5 font-sans">{b.name}</td>
                        <td className="px-4 py-2.5 text-right">{pct(b.rate, 0)}</td>
                        <td className="px-4 py-2.5 text-right">{money(b.amount)}</td>
                        <td className="px-4 py-2.5 text-right">{money(b.tax)}</td>
                      </tr>
                    ))}
                    <tr className="border-b border-foreground/10 bg-secondary">
                      <td colSpan={4} className="px-4 py-2 font-sans text-xs font-medium text-muted-foreground">
                        National Insurance · Class 1 employee
                      </td>
                    </tr>
                    {result.niBands.map((b, i) => (
                      <NiRow
                        key={b.name}
                        label={
                          i === 0
                            ? `${money(ni.primaryThreshold)} to ${money(ni.upperEarningsLimit)}`
                            : `Above ${money(ni.upperEarningsLimit)}`
                        }
                        rate={b.rate}
                        amount={b.amount}
                        tax={b.tax}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs font-bold text-muted-foreground/70">
                Bands are applied to taxable income after allowances. Student loan repayments are 9% (6% postgraduate)
                of earnings above the plan threshold. Figures from gov.uk and gov.scot for {year.label}.
              </p>
            </TabsContent>

            <TabsContent value="curve" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                How take-home changes with salary, keeping every other setting the same. The flattening
                between £100k and £125k is the personal allowance taper.
              </p>
              <GrowthChart
                series={[
                  { name: "Take-home", color: "var(--chart-2)", values: curve.takeHome, area: true },
                  { name: "Tax, NI and loans", color: "var(--chart-1)", values: curve.deductions },
                ]}
                xLabel={(i) => `${money(curve.salaries[i] ?? 0)} salary`}
                xTick={(i) => formatMoney(curve.salaries[i] ?? 0, "GBP", { compact: true })}
                formatValue={(v) => money(v)}
                formatAxis={(v) => formatMoney(v, "GBP", { compact: true })}
                extraRow={(i) => {
                  const salary = curve.salaries[i] ?? 0;
                  const kept = curve.takeHome[i];
                  return salary > 0 && kept !== undefined
                    ? { name: "Kept", value: pct(kept / salary, 0) }
                    : null;
                }}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <MobileResultBar
        label={`Take-home / ${perLabel.short}`}
        value={inView(result.takeHome)}
      />
    </>
  );
}

function perLabelFor(period: PayPeriod): string {
  return PERIOD_INFO[period].noun;
}

function NiRow({
  label,
  rate,
  amount,
  tax,
}: {
  label: string;
  rate: number;
  amount: number;
  tax: number;
}) {
  return (
    <tr className={cn("border-b border-foreground/10 last:border-0", amount === 0 && "text-muted-foreground/50")}>
      <td className="px-4 py-2.5 font-sans">{label}</td>
      <td className="px-4 py-2.5 text-right">{pct(rate, 0)}</td>
      <td className="px-4 py-2.5 text-right">{money(amount)}</td>
      <td className="px-4 py-2.5 text-right">{money(tax)}</td>
    </tr>
  );
}

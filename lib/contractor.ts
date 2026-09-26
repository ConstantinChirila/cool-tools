/**
 * UK contractor take-home engine: one day rate through a limited company
 * (outside IR35), an umbrella company (inside IR35) and as a sole trader,
 * compared with a permanent job.
 *
 * Everything is annual. Rates are from gov.uk for each tax year; corporation
 * tax uses the financial year that starts in the same April (the rates have
 * been identical since April 2023). PAYE, employee NI and the personal
 * allowance taper come from the UK salary engine.
 */

import {
  TAX_YEARS,
  calculateUkSalaryBase,
  taxOnBands,
  type BandResult,
  type TaxYear,
  type UkSalaryInput,
} from "@/lib/uk-tax";

export const ROUTES = ["ltd", "umbrella", "soleTrader"] as const;
export type ContractRoute = (typeof ROUTES)[number];
export const SCENARIOS = ["perm", ...ROUTES] as const;
export type Scenario = (typeof SCENARIOS)[number];
/** What the comparison counts: cash only, or cash plus pension and benefits. */
export type CompareBasis = "cash" | "package";

export const ROUTE_INFO: Record<Scenario, { label: string; short: string; hint: string }> = {
  perm: { label: "Permanent job", short: "Permanent", hint: "Your salary through PAYE" },
  ltd: { label: "Limited company", short: "Ltd company", hint: "Outside IR35: salary plus dividends" },
  umbrella: { label: "Umbrella company", short: "Umbrella", hint: "Inside IR35: taxed like an employee" },
  soleTrader: { label: "Sole trader", short: "Sole trader", hint: "Self-employed: income tax and Class 4 NI" },
};

/** One value per contracting route, spelled out so a new route is a compile error until it is added. */
export function byRoute<T>(f: (route: ContractRoute) => T): Record<ContractRoute, T> {
  return { ltd: f("ltd"), umbrella: f("umbrella"), soleTrader: f("soleTrader") };
}

/** One value per scenario, the permanent job included. */
export function byScenario<T>(f: (scenario: Scenario) => T): Record<Scenario, T> {
  return { perm: f("perm"), ...byRoute(f) };
}

/** Dividend allowance and rates (ordinary, upper, additional) by tax year. */
const DIVIDENDS: Record<TaxYear, { allowance: number; rates: [number, number, number] }> = {
  "2025-26": { allowance: 500, rates: [0.0875, 0.3375, 0.3935] },
  "2026-27": { allowance: 500, rates: [0.1075, 0.3575, 0.3935] },
};

/** Corporation tax for financial years 2023 to 2026: small profits rate, main rate and marginal relief. */
export const CORPORATION_TAX = {
  smallRate: 0.19,
  mainRate: 0.25,
  lowerLimit: 50_000,
  upperLimit: 250_000,
  reliefFraction: 3 / 200,
};

/** Class 4 NI for the self-employed. Class 2 is no longer payable above the small profits threshold. */
const CLASS4 = { lower: 12_570, upper: 50_270, mainRate: 0.06, upperRate: 0.02 };

/** Umbrellas are large employers and most pass the 0.5% levy on through the assignment rate. */
export const APPRENTICESHIP_LEVY = 0.005;

export const WEEKS_PER_YEAR = 52;

export interface ContractorInput {
  taxYear: TaxYear;
  scotland: boolean;
  /** Before VAT. */
  dayRate: number;
  daysPerWeek: number;
  holidayDays: number;
  bankHolidays: number;
  sickDays: number;
  /** Days without a contract: gaps between contracts, notice periods, the bench. */
  benchDays: number;
  /** Annual allowable expenses shared by the Ltd and sole trader routes (kit, insurance, training). */
  expenses: number;
  /** Annual cost of running a company on top (accountant, bank, registered office). */
  ltdCosts: number;
  /** Annual accountancy for a sole trader. */
  soleTraderCosts: number;
  directorSalary: number;
  /** Umbrella fee per weekly timesheet. */
  umbrellaMargin: number;
  apprenticeshipLevy: boolean;
  /** Gross annual amount into the pension when contracting, the same on every route. */
  contractorPension: number;
  permSalary: number;
  permBonus: number;
  /** Percentages of salary, 0-100. */
  permEmployeePension: number;
  permEmployerPension: number;
  permSacrifice: boolean;
  /** Annual value you put on non-cash perks (private medical, life cover, gym). */
  permBenefits: number;
}

export type LineKind = "heading" | "income" | "cost" | "subtotal" | "total" | "note";

export interface Line {
  label: string;
  /** Signed: deductions are negative. Headings and notes may carry 0. */
  value: number;
  kind: LineKind;
}

export interface ScenarioResult {
  scenario: Scenario;
  /** Contract income, or salary plus bonus for the permanent job. */
  gross: number;
  takeHome: number;
  /** Gross amount reaching the pension pot in the year, from you and any employer. */
  pension: number;
  benefits: number;
  /** Income tax, NI (employee, employer, Class 4), dividend and corporation tax combined. */
  tax: number;
  lines: Line[];
}

export interface WorkingDays {
  weekdays: number;
  daysOff: number;
  billable: number;
}

export function workingDays(input: ContractorInput): WorkingDays {
  const weekdays = WEEKS_PER_YEAR * clamp(input.daysPerWeek, 0, 7);
  const daysOff =
    Math.max(input.holidayDays, 0) +
    Math.max(input.bankHolidays, 0) +
    Math.max(input.sickDays, 0) +
    Math.max(input.benchDays, 0);
  return { weekdays, daysOff, billable: Math.max(weekdays - daysOff, 0) };
}

export function contractIncome(input: ContractorInput): number {
  return Math.max(input.dayRate, 0) * workingDays(input).billable;
}

/** Take-home, plus pension and benefits when the comparison counts the whole package. */
export function scenarioValue(r: ScenarioResult, basis: CompareBasis): number {
  return basis === "package" ? r.takeHome + r.pension + r.benefits : r.takeHome;
}

/** Plain PAYE input: salary only, England unless told otherwise, nothing optional switched on. */
function paye(taxYear: TaxYear, scotland: boolean, patch: Partial<UkSalaryInput>): UkSalaryInput {
  return {
    taxYear,
    salary: 0,
    salaryPeriod: "year",
    hoursPerWeek: 37.5,
    daysPerWeek: 5,
    scotland,
    taxCode: "",
    noNi: false,
    blind: false,
    marriage: "none",
    studentPlan: "none",
    postgradLoan: false,
    pensionType: "netpay",
    pensionMethod: "amount",
    pensionValue: 0,
    pensionOnExtras: false,
    employerPensionPct: 0,
    bonus: 0,
    overtimeHours: 0,
    overtimeMultiplier: 1,
    cashAllowance: 0,
    taxableBenefits: 0,
    childcareVouchers: 0,
    childcarePre2011: false,
    salarySacrifice: 0,
    preTaxDeduction: 0,
    postTaxDeduction: 0,
    ...patch,
  };
}

export function corporationTax(profit: number): number {
  const { smallRate, mainRate, lowerLimit, upperLimit, reliefFraction } = CORPORATION_TAX;
  if (profit <= 0) return 0;
  if (profit <= lowerLimit) return profit * smallRate;
  if (profit >= upperLimit) return profit * mainRate;
  return profit * mainRate - (upperLimit - profit) * reliefFraction;
}

export interface SalaryDividendTax {
  allowance: number;
  salaryTax: number;
  /** Dividend tax by rate, with the 0% dividend allowance first. */
  dividendBands: BandResult[];
  dividendTax: number;
}

/**
 * Income tax on a director's salary plus dividends. Salary uses the personal
 * allowance first, dividends sit on top of it in the UK bands (Scottish
 * taxpayers included), and the £500 allowance is taxed at 0% but still uses
 * up band space.
 */
export function salaryAndDividendTax(
  taxYear: TaxYear,
  scotland: boolean,
  salary: number,
  dividends: number,
): SalaryDividendTax {
  const cfg = TAX_YEARS[taxYear];
  const div = DIVIDENDS[taxYear];
  const income = salary + dividends;
  const allowance = Math.max(cfg.personalAllowance - Math.max(income - cfg.taperThreshold, 0) / 2, 0);

  const salaryTaxable = Math.max(salary - allowance, 0);
  const salaryTax = taxOnBands(salaryTaxable, scotland ? cfg.scottishBands : cfg.bands, 0).reduce(
    (s, b) => s + b.tax,
    0,
  );

  const dividendTaxable = Math.max(dividends - Math.max(allowance - salary, 0), 0);
  const allowanceUsed = Math.min(div.allowance, dividendTaxable);
  const start = salaryTaxable + allowanceUsed;
  const end = salaryTaxable + dividendTaxable;

  const dividendBands: BandResult[] = [
    { name: "Dividend allowance", rate: 0, amount: allowanceUsed, tax: 0 },
  ];
  const names = ["Dividend ordinary rate", "Dividend upper rate", "Dividend additional rate"];
  let lower = 0;
  cfg.bands.forEach((band, i) => {
    const rate = div.rates[i] ?? div.rates[div.rates.length - 1] ?? 0;
    const amount = Math.max(Math.min(end, band.limit) - Math.max(start, lower), 0);
    dividendBands.push({ name: names[i] ?? band.name, rate, amount, tax: amount * rate });
    lower = band.limit;
  });

  return {
    allowance,
    salaryTax,
    dividendBands,
    dividendTax: dividendBands.reduce((s, b) => s + b.tax, 0),
  };
}

function employeeNi(taxYear: TaxYear, pay: number): number {
  const ni = TAX_YEARS[taxYear].ni;
  const main = clamp(pay - ni.primaryThreshold, 0, ni.upperEarningsLimit - ni.primaryThreshold);
  const upper = Math.max(pay - ni.upperEarningsLimit, 0);
  return main * ni.mainRate + upper * ni.upperRate;
}

function employerNi(taxYear: TaxYear, pay: number): number {
  const ni = TAX_YEARS[taxYear].ni;
  return Math.max(pay - ni.secondaryThreshold, 0) * ni.employerRate;
}

export function calculateLtd(input: ContractorInput): ScenarioResult {
  const { taxYear } = input;
  const revenue = contractIncome(input);
  const costs = Math.max(input.expenses, 0) + Math.max(input.ltdCosts, 0);
  const available = Math.max(revenue - costs, 0);

  // A single-director company cannot claim the Employment Allowance, so the
  // salary carries employer NI. Cap it at what the company can afford.
  let salary = Math.max(input.directorSalary, 0);
  if (salary + employerNi(taxYear, salary) > available) {
    const ni = TAX_YEARS[taxYear].ni;
    salary =
      available <= ni.secondaryThreshold
        ? available
        : (available + ni.secondaryThreshold * ni.employerRate) / (1 + ni.employerRate);
  }
  const salaryNi = employerNi(taxYear, salary);
  const pension = Math.min(Math.max(input.contractorPension, 0), Math.max(available - salary - salaryNi, 0));
  const profit = Math.max(available - salary - salaryNi - pension, 0);
  const ct = corporationTax(profit);
  const dividends = profit - ct;

  const personal = salaryAndDividendTax(taxYear, input.scotland, salary, dividends);
  const ni = employeeNi(taxYear, salary);
  const takeHome = salary - personal.salaryTax - ni + dividends - personal.dividendTax;
  const ctRate = profit > 0 ? ct / profit : 0;

  const lines: Line[] = [
    { label: "Your company", value: 0, kind: "heading" },
    { label: contractLabel(input), value: revenue, kind: "income" },
    { label: "Expenses and running costs", value: -costs, kind: "cost" },
    { label: "Your director's salary", value: -salary, kind: "cost" },
    { label: "Employer NI on the salary", value: -salaryNi, kind: "cost" },
  ];
  if (pension > 0) lines.push({ label: "Company pension contribution", value: -pension, kind: "cost" });
  lines.push(
    { label: "Profit before tax", value: profit, kind: "subtotal" },
    { label: `Corporation tax (${pct(ctRate, 1)} effective)`, value: -ct, kind: "cost" },
    { label: "Paid to you as dividends", value: dividends, kind: "subtotal" },
    { label: "You", value: 0, kind: "heading" },
    { label: "Salary", value: salary, kind: "income" },
    { label: "Dividends", value: dividends, kind: "income" },
    { label: "Income tax on salary", value: -personal.salaryTax, kind: "cost" },
    { label: "Employee NI", value: -ni, kind: "cost" },
  );
  for (const b of personal.dividendBands) {
    if (b.amount <= 0) continue;
    lines.push({ label: `${b.name}: ${money(b.amount)} at ${pct(b.rate, 2)}`, value: -b.tax, kind: "cost" });
  }
  lines.push({ label: "Take-home", value: takeHome, kind: "total" });

  return {
    scenario: "ltd",
    gross: revenue,
    takeHome,
    pension,
    benefits: 0,
    tax: salaryNi + ct + personal.salaryTax + ni + personal.dividendTax,
    lines,
  };
}

export function calculateUmbrella(input: ContractorInput): ScenarioResult {
  const { taxYear } = input;
  const revenue = contractIncome(input);
  const days = workingDays(input);
  const weeks = input.daysPerWeek > 0 ? days.billable / input.daysPerWeek : 0;
  const margin = Math.min(Math.max(input.umbrellaMargin, 0) * weeks, revenue);
  // Salary sacrifice: the umbrella pays the pension as an employer contribution, before employer NI.
  const pension = Math.min(Math.max(input.contractorPension, 0), revenue - margin);
  const pot = Math.max(revenue - margin - pension, 0);

  // Employer NI and the levy are paid out of the assignment rate, so solve
  // pay + employer NI(pay) + levy(pay) = pot.
  const ni = TAX_YEARS[taxYear].ni;
  const levyRate = input.apprenticeshipLevy ? APPRENTICESHIP_LEVY : 0;
  const pay =
    pot <= ni.secondaryThreshold * (1 + levyRate)
      ? pot / (1 + levyRate)
      : (pot + ni.secondaryThreshold * ni.employerRate) / (1 + ni.employerRate + levyRate);
  const erNi = employerNi(taxYear, pay);
  const levy = pay * levyRate;

  const r = calculateUkSalaryBase(paye(taxYear, input.scotland, { salary: pay }));

  const lines: Line[] = [
    { label: "The umbrella", value: 0, kind: "heading" },
    { label: contractLabel(input), value: revenue, kind: "income" },
    { label: `Umbrella margin (${round1(weeks)} weeks)`, value: -margin, kind: "cost" },
  ];
  if (pension > 0) lines.push({ label: "Pension by salary sacrifice", value: -pension, kind: "cost" });
  lines.push({ label: "Employer NI, paid from your rate", value: -erNi, kind: "cost" });
  if (levy > 0) lines.push({ label: "Apprenticeship levy (0.5%)", value: -levy, kind: "cost" });
  lines.push(
    { label: "Gross pay, holiday pay included", value: pay, kind: "subtotal" },
    { label: "You", value: 0, kind: "heading" },
    { label: "Income tax", value: -r.incomeTax, kind: "cost" },
    { label: "Employee NI", value: -r.nationalInsurance, kind: "cost" },
    { label: "Take-home", value: r.takeHome, kind: "total" },
  );

  return {
    scenario: "umbrella",
    gross: revenue,
    takeHome: r.takeHome,
    pension,
    benefits: 0,
    tax: erNi + levy + r.incomeTax + r.nationalInsurance,
    lines,
  };
}

export function calculateSoleTrader(input: ContractorInput): ScenarioResult {
  const { taxYear } = input;
  const revenue = contractIncome(input);
  const costs = Math.max(input.expenses, 0) + Math.max(input.soleTraderCosts, 0);
  const profit = Math.max(revenue - costs, 0);
  // Tax relief is capped at your earnings; relief at source means you pay 80%.
  const pension = Math.min(Math.max(input.contractorPension, 0), profit);

  const r = calculateUkSalaryBase(
    paye(taxYear, input.scotland, {
      salary: profit,
      noNi: true,
      pensionType: "personal",
      pensionMethod: "amount",
      pensionValue: pension,
    }),
  );
  const class4 =
    clamp(profit - CLASS4.lower, 0, CLASS4.upper - CLASS4.lower) * CLASS4.mainRate +
    Math.max(profit - CLASS4.upper, 0) * CLASS4.upperRate;
  const takeHome = r.takeHome - class4;

  const lines: Line[] = [
    { label: "Your business", value: 0, kind: "heading" },
    { label: contractLabel(input), value: revenue, kind: "income" },
    { label: "Expenses and accountancy", value: -costs, kind: "cost" },
    { label: "Taxable profit", value: profit, kind: "subtotal" },
    { label: "You", value: 0, kind: "heading" },
    { label: "Income tax", value: -r.incomeTax, kind: "cost" },
    { label: "Class 4 NI", value: -class4, kind: "cost" },
  ];
  if (pension > 0) {
    lines.push({ label: "Pension: you pay 80%, HMRC adds 20%", value: -r.pensionDeducted, kind: "cost" });
  }
  lines.push({ label: "Take-home", value: takeHome, kind: "total" });

  return {
    scenario: "soleTrader",
    gross: revenue,
    takeHome,
    pension,
    benefits: 0,
    tax: r.incomeTax + class4,
    lines,
  };
}

export function calculatePerm(input: ContractorInput): ScenarioResult {
  const r = calculateUkSalaryBase(
    paye(input.taxYear, input.scotland, {
      salary: Math.max(input.permSalary, 0),
      bonus: Math.max(input.permBonus, 0),
      pensionType: input.permSacrifice ? "sacrifice" : "netpay",
      pensionMethod: "percent",
      pensionValue: input.permEmployeePension,
      employerPensionPct: input.permEmployerPension,
    }),
  );
  const pension = r.pensionGross + r.employerPension;
  const benefits = Math.max(input.permBenefits, 0);

  const lines: Line[] = [
    { label: "Your job", value: 0, kind: "heading" },
    { label: "Salary", value: r.salary, kind: "income" },
  ];
  if (r.bonus > 0) lines.push({ label: "Bonus", value: r.bonus, kind: "income" });
  if (r.pensionDeducted > 0) {
    lines.push({
      label: input.permSacrifice ? "Your pension (salary sacrifice)" : "Your pension contribution",
      value: -r.pensionDeducted,
      kind: "cost",
    });
  }
  lines.push(
    { label: "Income tax", value: -r.incomeTax, kind: "cost" },
    { label: "Employee NI", value: -r.nationalInsurance, kind: "cost" },
    { label: "Take-home", value: r.takeHome, kind: "total" },
  );
  if (r.employerPension > 0) {
    lines.push({ label: "Employer pension, on top", value: r.employerPension, kind: "note" });
  }
  if (benefits > 0) lines.push({ label: "Benefits you valued, on top", value: benefits, kind: "note" });

  return {
    scenario: "perm",
    gross: r.gross,
    takeHome: r.takeHome,
    pension,
    benefits,
    tax: r.incomeTax + r.nationalInsurance,
    lines,
  };
}

const CALCULATORS: Record<Scenario, (input: ContractorInput) => ScenarioResult> = {
  perm: calculatePerm,
  ltd: calculateLtd,
  umbrella: calculateUmbrella,
  soleTrader: calculateSoleTrader,
};

export function calculateScenario(scenario: Scenario, input: ContractorInput): ScenarioResult {
  return CALCULATORS[scenario](input);
}

/** Search bounds for the break-even day rate and the salary equivalent. */
export const MAX_DAY_RATE = 20_000;
const MAX_SALARY = 5_000_000;

/** Smallest x in [0, hi] with f(x) >= target, for f non-decreasing. Null when even hi falls short. */
function solve(f: (x: number) => number, target: number, hi: number): number | null {
  if (f(hi) < target) return null;
  let lo = 0;
  for (let i = 0; i < 50 && hi - lo > 0.01; i++) {
    const mid = (lo + hi) / 2;
    if (f(mid) >= target) hi = mid;
    else lo = mid;
  }
  return hi;
}

export type BreakEven =
  | { kind: "rate"; dayRate: number }
  /** No billable days, so no day rate can match. */
  | { kind: "noDays" }
  /** Even MAX_DAY_RATE falls short of the job. */
  | { kind: "outOfRange" };

/** Day rate at which a route matches the permanent job. */
export function breakEvenDayRate(
  input: ContractorInput,
  route: ContractRoute,
  basis: CompareBasis,
  permValue = scenarioValue(calculatePerm(input), basis),
): BreakEven {
  if (workingDays(input).billable <= 0) return { kind: "noDays" };
  const dayRate = solve(
    (rate) => scenarioValue(calculateScenario(route, { ...input, dayRate: rate }), basis),
    permValue,
    MAX_DAY_RATE,
  );
  return dayRate === null ? { kind: "outOfRange" } : { kind: "rate", dayRate };
}

/** Permanent salary (same pension and benefits) worth the same as `value`. */
export function salaryEquivalent(input: ContractorInput, value: number, basis: CompareBasis): number | null {
  return solve(
    (permSalary) => scenarioValue(calculatePerm({ ...input, permSalary, permBonus: 0 }), basis),
    value,
    MAX_SALARY,
  );
}

export interface DayRateCurve {
  rates: number[];
  series: Record<Scenario, number[]>;
}

/** Each scenario's value across a sweep of day rates; the permanent line is flat. */
export function dayRateCurve(input: ContractorInput, basis: CompareBasis, maxRate: number, steps: number): DayRateCurve {
  const rates = Array.from({ length: steps + 1 }, (_, i) => Math.round((maxRate * i) / steps));
  const perm = scenarioValue(calculatePerm(input), basis);
  const series = byScenario((s) =>
    s === "perm"
      ? rates.map(() => perm)
      : rates.map((dayRate) => scenarioValue(calculateScenario(s, { ...input, dayRate }), basis)),
  );
  return { rates, series };
}

export interface RouteComparison {
  /** The input with the contractor pension resolved: the job's own pension when matching. */
  effective: ContractorInput;
  days: WorkingDays;
  /** False until there is a day rate and at least one paid day. */
  hasIncome: boolean;
  results: Record<Scenario, ScenarioResult>;
  permValue: number;
  best: ContractRoute;
  /** Best route's value minus the job's, on the chosen basis. */
  gap: number;
  breakEven: Record<ContractRoute, BreakEven>;
  /** A sole trader keeps more than a company paying out all its profit: worth explaining. */
  soleBeatsLtd: boolean;
}

/**
 * Everything the comparison shows. With `matchPension` the contractor pays the
 * same gross amount into a pension as the job does (employee plus employer),
 * so the pension columns start level and the difference is all take-home.
 */
export function compareRoutes(input: ContractorInput, basis: CompareBasis, matchPension: boolean): RouteComparison {
  const perm = calculatePerm(input);
  const effective = matchPension ? { ...input, contractorPension: Math.round(perm.pension) } : input;
  const results = byScenario((s) => (s === "perm" ? perm : calculateScenario(s, effective)));
  const value = (s: Scenario) => scenarioValue(results[s], basis);
  const permValue = value("perm");
  const best = ROUTES.reduce((a, b) => (value(b) > value(a) ? b : a));
  const days = workingDays(effective);
  const hasIncome = days.billable > 0 && effective.dayRate > 0;

  return {
    effective,
    days,
    hasIncome,
    results,
    permValue,
    best,
    gap: value(best) - permValue,
    breakEven: byRoute((r) => breakEvenDayRate(effective, r, basis, permValue)),
    soleBeatsLtd: hasIncome && value("soleTrader") > value("ltd"),
  };
}

function contractLabel(input: ContractorInput): string {
  return `Contract income: ${workingDays(input).billable} days × ${money(Math.max(input.dayRate, 0))}`;
}

function money(v: number): string {
  return `£${Math.round(v).toLocaleString("en-GB")}`;
}

function pct(v: number, decimals: number): string {
  return `${Number((v * 100).toFixed(decimals))}%`;
}

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(Math.max(v, lo), hi);
}

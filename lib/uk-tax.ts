/**
 * UK PAYE take-home pay engine.
 *
 * Figures are annual and sourced from gov.uk / gov.scot for each tax year.
 * Everything is computed on an annual basis (the standard salary-calculator
 * approach); pay-period NI rounding and mid-year code changes are ignored.
 */

export type TaxYear = "2025-26" | "2026-27";
export type PayPeriod = "year" | "month" | "4week" | "2week" | "week" | "day" | "hour";
export type StudentPlan = "none" | "plan1" | "plan2" | "plan4" | "plan5";
export type PensionType = "auto" | "netpay" | "sacrifice" | "personal";
export type PensionMethod = "percent" | "amount";
export type MarriageAllowance = "none" | "receive" | "transfer";

interface Band {
  name: string;
  rate: number;
  /** Upper limit of the band in taxable income (after allowances). */
  limit: number;
}

interface TaxYearConfig {
  label: string;
  personalAllowance: number;
  /** Adjusted net income above which the personal allowance tapers away. */
  taperThreshold: number;
  blindAllowance: number;
  marriageTransfer: number;
  bands: Band[];
  scottishBands: Band[];
  ni: {
    primaryThreshold: number;
    upperEarningsLimit: number;
    mainRate: number;
    upperRate: number;
    secondaryThreshold: number;
    employerRate: number;
  };
  studentLoan: Record<Exclude<StudentPlan, "none">, number>;
  studentLoanRate: number;
  postgradThreshold: number;
  postgradRate: number;
  autoEnrolment: { lower: number; upper: number };
  /** Monthly tax-exempt childcare voucher caps by rate band (post April 2011 joiners). */
  childcareCaps: { basic: number; higher: number; additional: number };
}

const RUK_BANDS: Band[] = [
  { name: "Basic rate", rate: 0.2, limit: 37_700 },
  { name: "Higher rate", rate: 0.4, limit: 125_140 },
  { name: "Additional rate", rate: 0.45, limit: Infinity },
];

const NI_2025 = {
  primaryThreshold: 12_570,
  upperEarningsLimit: 50_270,
  mainRate: 0.08,
  upperRate: 0.02,
  secondaryThreshold: 5_000,
  employerRate: 0.15,
};

export const TAX_YEARS: Record<TaxYear, TaxYearConfig> = {
  "2025-26": {
    label: "2025/26",
    personalAllowance: 12_570,
    taperThreshold: 100_000,
    blindAllowance: 3_130,
    marriageTransfer: 1_260,
    bands: RUK_BANDS,
    scottishBands: [
      { name: "Starter rate", rate: 0.19, limit: 2_827 },
      { name: "Basic rate", rate: 0.2, limit: 14_921 },
      { name: "Intermediate rate", rate: 0.21, limit: 31_092 },
      { name: "Higher rate", rate: 0.42, limit: 62_430 },
      { name: "Advanced rate", rate: 0.45, limit: 112_570 },
      { name: "Top rate", rate: 0.48, limit: Infinity },
    ],
    ni: NI_2025,
    studentLoan: { plan1: 26_065, plan2: 28_470, plan4: 32_745, plan5: 25_000 },
    studentLoanRate: 0.09,
    postgradThreshold: 21_000,
    postgradRate: 0.06,
    autoEnrolment: { lower: 6_240, upper: 50_270 },
    childcareCaps: { basic: 243, higher: 124, additional: 110 },
  },
  "2026-27": {
    label: "2026/27",
    personalAllowance: 12_570,
    taperThreshold: 100_000,
    blindAllowance: 3_250,
    marriageTransfer: 1_260,
    bands: RUK_BANDS,
    scottishBands: [
      { name: "Starter rate", rate: 0.19, limit: 2_306 },
      { name: "Basic rate", rate: 0.2, limit: 13_992 },
      { name: "Intermediate rate", rate: 0.21, limit: 31_092 },
      { name: "Higher rate", rate: 0.42, limit: 62_430 },
      { name: "Advanced rate", rate: 0.45, limit: 112_570 },
      { name: "Top rate", rate: 0.48, limit: Infinity },
    ],
    ni: NI_2025,
    studentLoan: { plan1: 26_900, plan2: 29_385, plan4: 33_795, plan5: 25_000 },
    studentLoanRate: 0.09,
    postgradThreshold: 21_000,
    postgradRate: 0.06,
    autoEnrolment: { lower: 6_240, upper: 50_270 },
    childcareCaps: { basic: 243, higher: 124, additional: 110 },
  },
};

export const DEFAULT_TAX_YEAR: TaxYear = "2026-27";

export const STUDENT_PLANS: { value: StudentPlan; label: string; hint: string }[] = [
  { value: "none", label: "No student loan", hint: "" },
  { value: "plan1", label: "Plan 1", hint: "Started before Sept 2012 (England/Wales), or Northern Ireland" },
  { value: "plan2", label: "Plan 2", hint: "Started Sept 2012 to July 2023 (England/Wales)" },
  { value: "plan4", label: "Plan 4", hint: "Scottish students" },
  { value: "plan5", label: "Plan 5", hint: "Started Aug 2023 or later (England)" },
];

export const PENSION_TYPES: { value: PensionType; label: string; hint: string }[] = [
  {
    value: "auto",
    label: "Auto-enrolment",
    hint: "Contribution taken on qualifying earnings only (£6,240 to £50,270). Tax relief, no NI saving.",
  },
  {
    value: "netpay",
    label: "Employer scheme (net pay)",
    hint: "Taken from gross pay before tax on your full salary. Tax relief, no NI saving.",
  },
  {
    value: "sacrifice",
    label: "Salary sacrifice",
    hint: "Your salary is reduced in exchange for the contribution. Saves both tax and NI.",
  },
  {
    value: "personal",
    label: "Personal (relief at source)",
    hint: "Paid from take-home pay. You pay 80%, the provider claims basic-rate relief; higher-rate relief extends your basic band.",
  },
];

export interface UkSalaryInput {
  taxYear: TaxYear;
  salary: number;
  salaryPeriod: PayPeriod;
  hoursPerWeek: number;
  daysPerWeek: number;
  scotland: boolean;
  /** Blank means "use the standard allowance with tapering". */
  taxCode: string;
  /** Over State Pension age: no employee NI. */
  noNi: boolean;
  blind: boolean;
  marriage: MarriageAllowance;
  studentPlan: StudentPlan;
  postgradLoan: boolean;
  pensionType: PensionType;
  pensionMethod: PensionMethod;
  /** Percentage (0-100) or annual amount depending on pensionMethod. */
  pensionValue: number;
  pensionOnExtras: boolean;
  employerPensionPct: number;
  bonus: number;
  overtimeHours: number;
  overtimeMultiplier: number;
  /** Annual cash allowance (e.g. car allowance): taxed and NI'd like salary. */
  cashAllowance: number;
  /** Annual value of taxable benefits in kind (company car, medical): taxed, no employee NI. */
  taxableBenefits: number;
  /** Monthly childcare vouchers via salary sacrifice. */
  childcareVouchers: number;
  childcarePre2011: boolean;
  /** Annual other salary sacrifice exempt from tax and NI (cycle to work, EV scheme). */
  salarySacrifice: number;
  /** Monthly pre-tax deduction such as Give As You Earn. */
  preTaxDeduction: number;
  /** Monthly post-tax deduction (union fees, season ticket loan). */
  postTaxDeduction: number;
}

export interface BandResult {
  name: string;
  rate: number;
  /** Amount of taxable income falling in this band. */
  amount: number;
  tax: number;
}

export interface UkSalaryResult {
  /** Annual salary before anything else. */
  salary: number;
  bonus: number;
  overtime: number;
  cashAllowance: number;
  /** Cash pay before deductions: salary + bonus + overtime + cash allowance. */
  gross: number;
  hourlyRate: number;
  allowance: number;
  allowanceNote: string;
  taxableIncome: number;
  bands: BandResult[];
  incomeTax: number;
  nationalInsurance: number;
  employerNi: number;
  /** What leaves your pay for pension (net of any relief at source). */
  pensionDeducted: number;
  /** Gross amount that reaches the pension pot from you. */
  pensionGross: number;
  employerPension: number;
  studentLoan: number;
  postgradLoan: number;
  childcareVouchers: number;
  salarySacrifice: number;
  preTaxDeduction: number;
  postTaxDeduction: number;
  takeHome: number;
  employerCost: number;
  effectiveRate: number;
  marginalRate: number;
  hoursPerYear: number;
  daysPerYear: number;
  scotland: boolean;
}

export const PERIODS: { value: PayPeriod; label: string; short: string }[] = [
  { value: "year", label: "Yearly", short: "yr" },
  { value: "month", label: "Monthly", short: "mo" },
  { value: "4week", label: "4-weekly", short: "4wk" },
  { value: "2week", label: "2-weekly", short: "2wk" },
  { value: "week", label: "Weekly", short: "wk" },
  { value: "day", label: "Daily", short: "day" },
  { value: "hour", label: "Hourly", short: "hr" },
];

const WEEKS = 52;

/** Number of pay periods in a year. */
export function periodsPerYear(period: PayPeriod, hoursPerWeek: number, daysPerWeek: number): number {
  switch (period) {
    case "year":
      return 1;
    case "month":
      return 12;
    case "4week":
      return 13;
    case "2week":
      return 26;
    case "week":
      return WEEKS;
    case "day":
      return WEEKS * Math.max(daysPerWeek, 0.5);
    case "hour":
      return WEEKS * Math.max(hoursPerWeek, 1);
  }
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

interface ParsedCode {
  kind: "default" | "allowance" | "flat" | "none";
  allowance: number;
  /** Extra taxable income added by a K code. */
  addition: number;
  /** Flat rate for BR/D0/D1-style codes. */
  flatRate: number;
  scotland: boolean;
  note: string;
}

function parseTaxCode(raw: string, scotlandToggle: boolean, cfg: TaxYearConfig): ParsedCode {
  const code = raw.replace(/\s+/g, "").toUpperCase();
  let scotland = scotlandToggle;
  let body = code;
  if (body.startsWith("S")) {
    scotland = true;
    body = body.slice(1);
  } else if (body.startsWith("C")) {
    body = body.slice(1);
  }
  const base = { allowance: 0, addition: 0, flatRate: 0, scotland };

  if (!body) return { ...base, kind: "default", note: "" };
  if (body === "NT") return { ...base, kind: "none", note: "NT: no tax deducted" };
  if (body === "0T") return { ...base, kind: "allowance", note: "0T: no personal allowance" };

  const bands = scotland ? cfg.scottishBands : cfg.bands;
  const flat: Record<string, number> = scotland
    ? { BR: 0.2, D0: 0.21, D1: 0.42, D2: 0.45, D3: 0.48 }
    : { BR: bands[0].rate, D0: bands[1].rate, D1: bands[2].rate };
  if (body in flat) {
    return { ...base, kind: "flat", flatRate: flat[body], note: `${code}: all income taxed at ${Math.round(flat[body] * 100)}%` };
  }

  const k = /^K(\d+)$/.exec(body);
  if (k) {
    return { ...base, kind: "allowance", addition: Number(k[1]) * 10, note: `${code}: £${(Number(k[1]) * 10).toLocaleString("en-GB")} added to taxable pay` };
  }

  const numeric = /^(\d+)([LMNTY]?)$/.exec(body);
  if (numeric) {
    const allowance = Number(numeric[1]) * 10;
    return { ...base, kind: "allowance", allowance, note: `${code}: £${allowance.toLocaleString("en-GB")} allowance` };
  }

  return { ...base, kind: "default", note: `"${raw}" not recognised, using standard allowance` };
}

function taxOnBands(taxable: number, bands: Band[], extend: number): BandResult[] {
  const out: BandResult[] = [];
  let lower = 0;
  let remaining = taxable;
  for (const band of bands) {
    const limit = band.limit === Infinity ? Infinity : band.limit + extend;
    const width = Math.max(limit - lower, 0);
    const amount = Math.max(Math.min(remaining, width), 0);
    out.push({ name: band.name, rate: band.rate, amount, tax: amount * band.rate });
    remaining -= amount;
    lower = limit;
    if (remaining <= 0 && band.limit !== Infinity) {
      // still push the remaining bands as empty rows for a stable table
      continue;
    }
  }
  return out;
}

function compute(input: UkSalaryInput): Omit<UkSalaryResult, "marginalRate"> {
  const cfg = TAX_YEARS[input.taxYear];
  const hoursPerWeek = Math.max(input.hoursPerWeek, 1);
  const daysPerWeek = clamp(input.daysPerWeek, 1, 7);
  const hoursPerYear = hoursPerWeek * WEEKS;
  const daysPerYear = daysPerWeek * WEEKS;

  const salary = Math.max(input.salary, 0) * periodsPerYear(input.salaryPeriod, hoursPerWeek, daysPerWeek);
  const hourlyRate = salary / hoursPerYear;
  const overtime = Math.max(input.overtimeHours, 0) * Math.max(input.overtimeMultiplier, 0) * hourlyRate * WEEKS;
  const bonus = Math.max(input.bonus, 0);
  const cashAllowance = Math.max(input.cashAllowance, 0);
  const gross = salary + bonus + overtime + cashAllowance;

  // Pension
  const extras = bonus + overtime;
  const pensionable =
    input.pensionType === "auto"
      ? clamp(gross, cfg.autoEnrolment.lower, cfg.autoEnrolment.upper) - cfg.autoEnrolment.lower
      : salary + cashAllowance + (input.pensionOnExtras ? extras : 0);
  const pensionGross =
    input.pensionMethod === "percent"
      ? pensionable * (clamp(input.pensionValue, 0, 100) / 100)
      : Math.min(Math.max(input.pensionValue, 0), gross);
  const employerPension = pensionable * (clamp(input.employerPensionPct, 0, 100) / 100);
  const sacrificePension = input.pensionType === "sacrifice" ? pensionGross : 0;
  const netPayPension = input.pensionType === "auto" || input.pensionType === "netpay" ? pensionGross : 0;
  const personalPension = input.pensionType === "personal" ? pensionGross : 0;
  const pensionDeducted = personalPension > 0 ? personalPension * 0.8 : pensionGross;

  // Other sacrifice
  const salarySacrifice = Math.min(Math.max(input.salarySacrifice, 0), gross);
  const childcareMonthly = Math.max(input.childcareVouchers, 0);
  const childcareVouchers = Math.min(childcareMonthly * 12, gross);
  const estimatedEarnings = gross - sacrificePension - netPayPension;
  const childcareCap = input.childcarePre2011
    ? cfg.childcareCaps.basic
    : estimatedEarnings > cfg.bands[1].limit + cfg.personalAllowance
      ? cfg.childcareCaps.additional
      : estimatedEarnings > cfg.bands[0].limit + cfg.personalAllowance
        ? cfg.childcareCaps.higher
        : cfg.childcareCaps.basic;
  const childcareExempt = Math.min(childcareMonthly, childcareCap) * 12;

  // NI
  const niable = Math.max(gross - sacrificePension - salarySacrifice - childcareExempt, 0);
  const ni = cfg.ni;
  const nationalInsurance = input.noNi
    ? 0
    : clamp(niable - ni.primaryThreshold, 0, ni.upperEarningsLimit - ni.primaryThreshold) * ni.mainRate +
      Math.max(niable - ni.upperEarningsLimit, 0) * ni.upperRate;
  const taxableBenefits = Math.max(input.taxableBenefits, 0);
  const employerNi =
    Math.max(niable - ni.secondaryThreshold, 0) * ni.employerRate + taxableBenefits * ni.employerRate;

  // Income tax
  const preTaxDeduction = Math.max(input.preTaxDeduction, 0) * 12;
  const taxablePay = Math.max(niable - netPayPension - preTaxDeduction + taxableBenefits, 0);
  const adjustedNetIncome = Math.max(taxablePay - personalPension, 0);

  const code = parseTaxCode(input.taxCode, input.scotland, cfg);
  const scotland = code.scotland;
  const bands = scotland ? cfg.scottishBands : cfg.bands;

  let allowance = 0;
  let allowanceNote = code.note;
  let taxable = 0;
  let bandResults: BandResult[] = [];
  let incomeTax = 0;

  if (code.kind === "none") {
    allowance = taxablePay;
    bandResults = bands.map((b) => ({ name: b.name, rate: b.rate, amount: 0, tax: 0 }));
  } else if (code.kind === "flat") {
    taxable = taxablePay;
    incomeTax = taxable * code.flatRate;
    bandResults = [{ name: `Flat rate (${code.note.split(":")[0]})`, rate: code.flatRate, amount: taxable, tax: incomeTax }];
  } else {
    if (code.kind === "allowance") {
      allowance = code.allowance;
      taxable = Math.max(taxablePay + code.addition - allowance, 0);
    } else {
      const taper = Math.max(adjustedNetIncome - cfg.taperThreshold, 0) / 2;
      const personal = Math.max(cfg.personalAllowance - taper, 0);
      allowance = personal + (input.blind ? cfg.blindAllowance : 0) - (input.marriage === "transfer" ? cfg.marriageTransfer : 0);
      allowance = Math.max(allowance, 0);
      taxable = Math.max(taxablePay - allowance, 0);
      if (taper > 0 && personal > 0) allowanceNote = `Tapered: £1 lost per £2 over £${cfg.taperThreshold.toLocaleString("en-GB")}`;
      else if (personal === 0) allowanceNote = "Personal allowance fully tapered away";
      else if (input.blind) allowanceNote = "Includes Blind Person's Allowance";
      else if (input.marriage === "transfer") allowanceNote = "£1,260 transferred to your partner";
    }
    // Relief at source extends every band limit by the gross contribution.
    bandResults = taxOnBands(taxable, bands, personalPension);
    incomeTax = bandResults.reduce((s, b) => s + b.tax, 0);
    if (code.kind === "default" && input.marriage === "receive") {
      incomeTax = Math.max(incomeTax - cfg.marriageTransfer * bands.find((b) => b.name === "Basic rate")!.rate, 0);
      allowanceNote = "Marriage Allowance: £252 taken off your tax";
    }
  }

  // Student loans (on NI-able earnings)
  const studentLoan =
    input.studentPlan === "none"
      ? 0
      : Math.max(niable - cfg.studentLoan[input.studentPlan], 0) * cfg.studentLoanRate;
  const postgradLoan = input.postgradLoan ? Math.max(niable - cfg.postgradThreshold, 0) * cfg.postgradRate : 0;

  const postTaxDeduction = Math.max(input.postTaxDeduction, 0) * 12;

  const takeHome =
    gross -
    incomeTax -
    nationalInsurance -
    pensionDeducted -
    studentLoan -
    postgradLoan -
    childcareVouchers -
    salarySacrifice -
    preTaxDeduction -
    postTaxDeduction;

  return {
    salary,
    bonus,
    overtime,
    cashAllowance,
    gross,
    hourlyRate,
    allowance,
    allowanceNote,
    taxableIncome: taxable,
    bands: bandResults,
    incomeTax,
    nationalInsurance,
    employerNi,
    pensionDeducted,
    pensionGross,
    employerPension,
    studentLoan,
    postgradLoan,
    childcareVouchers,
    salarySacrifice,
    preTaxDeduction,
    postTaxDeduction,
    takeHome,
    employerCost: gross + employerNi + employerPension,
    effectiveRate: gross > 0 ? (incomeTax + nationalInsurance) / gross : 0,
    hoursPerYear,
    daysPerYear,
    scotland,
  };
}

export function calculateUkSalary(input: UkSalaryInput): UkSalaryResult {
  const base = compute(input);
  // Marginal rate: how much of the next £1,000 of salary is lost to tax, NI and loans.
  const factor = periodsPerYear(input.salaryPeriod, input.hoursPerWeek, input.daysPerWeek);
  const bumped = compute({ ...input, salary: input.salary + 1000 / factor });
  const deductions = (r: Omit<UkSalaryResult, "marginalRate">) =>
    r.incomeTax + r.nationalInsurance + r.studentLoan + r.postgradLoan;
  const marginalRate = clamp((deductions(bumped) - deductions(base)) / 1000, 0, 1);
  return { ...base, marginalRate };
}

/**
 * Take-home and total deductions for a sweep of annual salaries, used for the
 * "where you sit" curve. Keeps every other input the same.
 */
export function salaryCurve(
  input: UkSalaryInput,
  maxSalary: number,
  steps: number,
): { salaries: number[]; takeHome: number[]; deductions: number[] } {
  const salaries: number[] = [];
  const takeHome: number[] = [];
  const deductions: number[] = [];
  for (let i = 0; i <= steps; i++) {
    const s = (maxSalary * i) / steps;
    const r = compute({ ...input, salary: s, salaryPeriod: "year", bonus: 0, overtimeHours: 0 });
    salaries.push(s);
    takeHome.push(r.takeHome);
    deductions.push(r.incomeTax + r.nationalInsurance + r.studentLoan + r.postgradLoan);
  }
  return { salaries, takeHome, deductions };
}

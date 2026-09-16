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

/** Band tables are positional (basic, higher, additional...); fail loudly if one is shorter than the code assumes. */
function band(bands: Band[], index: number): Band {
  const b = bands[index];
  if (!b) throw new Error(`Tax band table has no entry at index ${index}`);
  return b;
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
      { name: "Advanced rate", rate: 0.45, limit: 125_140 },
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
      { name: "Starter rate", rate: 0.19, limit: 3_967 },
      { name: "Basic rate", rate: 0.2, limit: 16_956 },
      { name: "Intermediate rate", rate: 0.21, limit: 31_092 },
      { name: "Higher rate", rate: 0.42, limit: 62_430 },
      { name: "Advanced rate", rate: 0.45, limit: 125_140 },
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

export const STUDENT_PLAN_INFO: Record<StudentPlan, { label: string; hint: string }> = {
  none: { label: "No student loan", hint: "" },
  plan1: { label: "Plan 1", hint: "Started before Sept 2012 (England/Wales), or Northern Ireland" },
  plan2: { label: "Plan 2", hint: "Started Sept 2012 to July 2023 (England/Wales)" },
  plan4: { label: "Plan 4", hint: "Scottish students" },
  plan5: { label: "Plan 5", hint: "Started Aug 2023 or later (England)" },
};
/** Ordered list for option controls, derived from STUDENT_PLAN_INFO. */
export const STUDENT_PLANS = (Object.keys(STUDENT_PLAN_INFO) as StudentPlan[]).map((value) => ({
  value,
  ...STUDENT_PLAN_INFO[value],
}));

export const PENSION_TYPE_INFO: Record<PensionType, { label: string; hint: string }> = {
  auto: {
    label: "Auto-enrolment",
    hint: "Contribution taken on qualifying earnings only (£6,240 to £50,270). Tax relief, no NI saving.",
  },
  netpay: {
    label: "Employer scheme (net pay)",
    hint: "Taken from gross pay before tax on your full salary. Tax relief, no NI saving.",
  },
  sacrifice: {
    label: "Salary sacrifice",
    hint: "Your salary is reduced in exchange for the contribution. Saves both tax and NI.",
  },
  personal: {
    label: "Personal (relief at source)",
    hint: "Paid from take-home pay. You pay 80%, the provider claims basic-rate relief; higher-rate relief extends your basic band.",
  },
};
/** Ordered list for option controls, derived from PENSION_TYPE_INFO. */
export const PENSION_TYPES = (Object.keys(PENSION_TYPE_INFO) as PensionType[]).map((value) => ({
  value,
  ...PENSION_TYPE_INFO[value],
}));

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
  /** True when adjusted net income pushed the allowance down, whatever the tax code says. */
  tapered: boolean;
  /** True when an S prefix on the tax code, not the toggle, selected Scottish rates. */
  scotlandFromCode: boolean;
  taxableIncome: number;
  bands: BandResult[];
  incomeTax: number;
  nationalInsurance: number;
  /** Pay that employee NI is charged on, after salary sacrifice and exempt vouchers. */
  niablePay: number;
  /** Employee NI split across the main-rate and upper-rate slices. */
  niBands: BandResult[];
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
  /** Never negative. If deductions exceed pay this is 0 and `shortfall` holds the excess. */
  takeHome: number;
  /** Amount by which deductions exceed gross pay, 0 when pay covers them. */
  shortfall: number;
  employerCost: number;
  effectiveRate: number;
  marginalRate: number;
  hoursPerYear: number;
  daysPerYear: number;
  scotland: boolean;
}

export const PERIOD_INFO: Record<PayPeriod, { label: string; short: string; noun: string }> = {
  year: { label: "Yearly", short: "yr", noun: "year" },
  month: { label: "Monthly", short: "mo", noun: "month" },
  "4week": { label: "4-weekly", short: "4wk", noun: "4 weeks" },
  "2week": { label: "2-weekly", short: "2wk", noun: "2 weeks" },
  week: { label: "Weekly", short: "wk", noun: "week" },
  day: { label: "Daily", short: "day", noun: "day" },
  hour: { label: "Hourly", short: "hr", noun: "hour" },
};
/** Ordered list for option controls, derived from PERIOD_INFO. */
export const PERIODS = (Object.keys(PERIOD_INFO) as PayPeriod[]).map((value) => ({
  value,
  ...PERIOD_INFO[value],
}));

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
  /**
   * default  blank or unrecognised, use the statutory personal allowance
   * coded    a numeric code such as 1257L, its number is the starting allowance
   * zero     0T, no allowance at all
   * k        a K code, extra taxable pay instead of an allowance
   * flat     BR/D0/D1/D2/D3, one rate on everything
   * none     NT, no tax
   */
  kind: "default" | "coded" | "zero" | "k" | "flat" | "none";
  /** Starting allowance from the code number, before any taper. */
  allowance: number;
  /** Extra taxable income added by a K code. */
  addition: number;
  /** Flat rate for BR/D0/D1-style codes. */
  flatRate: number;
  scotland: boolean;
  /** True when the S prefix on the code, rather than the toggle, selected Scottish rates. */
  scotlandFromCode: boolean;
  note: string;
}

/** Week 1 / month 1 markers. They change nothing on an annual basis. */
const NON_CUMULATIVE = /(?:W1M1|M1W1|W1|M1|X)$/;

function parseTaxCode(raw: string, scotlandToggle: boolean, cfg: TaxYearConfig): ParsedCode {
  const code = raw.replace(/\s+/g, "").toUpperCase();
  let scotland = scotlandToggle;
  let scotlandFromCode = false;
  let body = code;
  if (body.startsWith("S")) {
    scotland = true;
    scotlandFromCode = true;
    body = body.slice(1);
  } else if (body.startsWith("C")) {
    body = body.slice(1);
  }
  const marker = NON_CUMULATIVE.exec(body);
  if (marker && body.length > marker[0].length) body = body.slice(0, body.length - marker[0].length);

  const base = { allowance: 0, addition: 0, flatRate: 0, scotland, scotlandFromCode };

  if (!body) return { ...base, kind: "default", note: "" };
  if (body === "NT") return { ...base, kind: "none", note: "NT: no tax deducted" };
  if (body === "0T") return { ...base, kind: "zero", note: "0T: no personal allowance" };

  const bands = scotland ? cfg.scottishBands : cfg.bands;
  const flat: Record<string, number> = scotland
    ? { BR: 0.2, D0: 0.21, D1: 0.42, D2: 0.45, D3: 0.48 }
    : { BR: band(bands, 0).rate, D0: band(bands, 1).rate, D1: band(bands, 2).rate };
  const flatRate = flat[body];
  if (flatRate !== undefined) {
    return { ...base, kind: "flat", flatRate, note: `${code}: all income taxed at ${Math.round(flatRate * 100)}%` };
  }

  const k = /^K(\d+)$/.exec(body);
  if (k) {
    const addition = Number(k[1]) * 10;
    return { ...base, kind: "k", addition, note: `${code}: £${addition.toLocaleString("en-GB")} added to taxable pay` };
  }

  const numeric = /^(\d+)([LMNTY]?)$/.exec(body);
  if (numeric) {
    const allowance = Number(numeric[1]) * 10;
    return { ...base, kind: "coded", allowance, note: `${code}: £${allowance.toLocaleString("en-GB")} allowance` };
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
    // Bands past the end of the income still get a row so the table stays stable.
    out.push({ name: band.name, rate: band.rate, amount, tax: amount * band.rate });
    remaining -= amount;
    lower = limit;
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
    : estimatedEarnings > band(cfg.bands, 1).limit
      ? cfg.childcareCaps.additional
      : estimatedEarnings > band(cfg.bands, 0).limit + cfg.personalAllowance
        ? cfg.childcareCaps.higher
        : cfg.childcareCaps.basic;
  const childcareExempt = Math.min(childcareMonthly, childcareCap) * 12;

  // NI
  const niable = Math.max(gross - sacrificePension - salarySacrifice - childcareExempt, 0);
  const ni = cfg.ni;
  const niMainAmount = input.noNi
    ? 0
    : clamp(niable - ni.primaryThreshold, 0, ni.upperEarningsLimit - ni.primaryThreshold);
  const niUpperAmount = input.noNi ? 0 : Math.max(niable - ni.upperEarningsLimit, 0);
  const niBands: BandResult[] = [
    { name: "Main rate", rate: ni.mainRate, amount: niMainAmount, tax: niMainAmount * ni.mainRate },
    { name: "Upper rate", rate: ni.upperRate, amount: niUpperAmount, tax: niUpperAmount * ni.upperRate },
  ];
  const nationalInsurance = niBands.reduce((s, b) => s + b.tax, 0);
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

  // The taper bites whatever the code says: a code is only HMRC's starting figure.
  const taper = Math.max(adjustedNetIncome - cfg.taperThreshold, 0) / 2;
  const blindAllowance = input.blind ? cfg.blindAllowance : 0;
  const transferredOut = input.marriage === "transfer" ? cfg.marriageTransfer : 0;

  let allowance = 0;
  let allowanceNote = code.note;
  let tapered = false;
  let taxable = 0;
  let bandResults: BandResult[] = [];
  let incomeTax = 0;

  const addNote = (note: string) => {
    allowanceNote = allowanceNote ? `${allowanceNote} · ${note}` : note;
  };

  if (code.kind === "none") {
    bandResults = bands.map((b) => ({ name: b.name, rate: b.rate, amount: 0, tax: 0 }));
  } else if (code.kind === "flat") {
    taxable = taxablePay;
    incomeTax = taxable * code.flatRate;
    bandResults = [{ name: `Flat rate (${code.note.split(":")[0]})`, rate: code.flatRate, amount: taxable, tax: incomeTax }];
  } else {
    if (code.kind === "k") {
      taxable = Math.max(taxablePay + code.addition, 0);
    } else if (code.kind === "zero") {
      taxable = taxablePay;
    } else {
      const startingAllowance = code.kind === "coded" ? code.allowance : cfg.personalAllowance;
      const personal = Math.max(startingAllowance - taper, 0);
      tapered = taper > 0 && startingAllowance > 0;
      allowance = Math.max(personal + blindAllowance - transferredOut, 0);
      taxable = Math.max(taxablePay - allowance, 0);
      if (tapered && personal > 0) addNote(`Tapered: £1 lost per £2 over £${cfg.taperThreshold.toLocaleString("en-GB")}`);
      else if (tapered) addNote("Personal allowance fully tapered away");
      if (blindAllowance > 0) addNote("Includes Blind Person's Allowance");
      if (transferredOut > 0) addNote(`£${cfg.marriageTransfer.toLocaleString("en-GB")} transferred to your partner`);
    }
    // Relief at source extends every band limit by the gross contribution.
    bandResults = taxOnBands(taxable, bands, personalPension);
    incomeTax = bandResults.reduce((s, b) => s + b.tax, 0);

    // Marriage Allowance is only available while the recipient stays a basic-rate
    // taxpayer, or in Scotland no higher than the intermediate rate.
    if (input.marriage === "receive" && (code.kind === "default" || code.kind === "coded")) {
      const ceiling = (scotland ? band(bands, 2).limit : band(bands, 0).limit) + personalPension;
      const credit = cfg.marriageTransfer * 0.2;
      if (taxable <= ceiling) {
        incomeTax = Math.max(incomeTax - credit, 0);
        addNote(`Marriage Allowance: £${credit.toLocaleString("en-GB")} off your tax`);
      } else {
        addNote("Marriage Allowance is not available above the basic rate");
      }
    }

    // A K code can never take more than half the pay in the period.
    if (code.kind === "k") incomeTax = Math.min(incomeTax, taxablePay * 0.5);
  }

  // Student loans (on NI-able earnings)
  const studentLoan =
    input.studentPlan === "none"
      ? 0
      : Math.max(niable - cfg.studentLoan[input.studentPlan], 0) * cfg.studentLoanRate;
  const postgradLoan = input.postgradLoan ? Math.max(niable - cfg.postgradThreshold, 0) * cfg.postgradRate : 0;

  const postTaxDeduction = Math.max(input.postTaxDeduction, 0) * 12;

  const netPay =
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
    tapered,
    scotlandFromCode: code.scotlandFromCode,
    taxableIncome: taxable,
    bands: bandResults,
    incomeTax,
    nationalInsurance,
    niablePay: niable,
    niBands,
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
    takeHome: Math.max(netPay, 0),
    shortfall: Math.max(-netPay, 0),
    employerCost: gross + employerNi + employerPension,
    effectiveRate: gross > 0 ? (incomeTax + nationalInsurance) / gross : 0,
    hoursPerYear,
    daysPerYear,
    scotland,
  };
}

export function calculateUkSalary(input: UkSalaryInput): UkSalaryResult {
  const base = compute(input);
  // Marginal rate: how much of the next £1,000 of pay is lost to tax, NI and loans.
  // The bump goes on the cash allowance, and the pension is pinned to the amount
  // already being paid, so raising pay does not also rescale overtime or pension.
  const bumped = compute({
    ...input,
    cashAllowance: Math.max(input.cashAllowance, 0) + 1000,
    pensionMethod: "amount",
    pensionValue: base.pensionGross,
  });
  const deductions = (r: Omit<UkSalaryResult, "marginalRate">) =>
    r.incomeTax + r.nationalInsurance + r.studentLoan + r.postgradLoan;
  const extra = bumped.gross - base.gross;
  const marginalRate = extra > 0 ? clamp((deductions(bumped) - deductions(base)) / extra, 0, 1) : 0;
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
    const r = compute({
      ...input,
      salary: s,
      salaryPeriod: "year",
      bonus: 0,
      overtimeHours: 0,
      cashAllowance: 0,
    });
    salaries.push(s);
    takeHome.push(r.takeHome);
    deductions.push(r.incomeTax + r.nationalInsurance + r.studentLoan + r.postgradLoan);
  }
  return { salaries, takeHome, deductions };
}

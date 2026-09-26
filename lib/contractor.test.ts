import { describe, expect, it } from "vitest";
import {
  ROUTES,
  breakEvenDayRate,
  calculateLtd,
  calculatePerm,
  calculateScenario,
  calculateSoleTrader,
  calculateUmbrella,
  compareRoutes,
  corporationTax,
  salaryAndDividendTax,
  salaryEquivalent,
  scenarioValue,
  workingDays,
  type BreakEven,
  type ContractorInput,
  type ScenarioResult,
} from "@/lib/contractor";

/** 2026/27, England, £500 a day for 212 days (£106,000), no pension: each case overrides what it is about. */
const base: ContractorInput = {
  taxYear: "2026-27",
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
  contractorPension: 0,
  permSalary: 70_000,
  permBonus: 0,
  permEmployeePension: 0,
  permEmployerPension: 0,
  permSacrifice: false,
  permBenefits: 0,
};

const input = (patch: Partial<ContractorInput> = {}) => ({ ...base, ...patch });

const line = (r: ScenarioResult, label: string) => r.lines.find((l) => l.label === label)?.value;

/** The solved day rate, failing the test when there is none. */
const rateOf = (b: BreakEven) => {
  if (b.kind !== "rate") throw new Error(`expected a break-even rate, got ${b.kind}`);
  return b.dayRate;
};

describe("working days", () => {
  it("takes every kind of day off away from 52 working weeks", () => {
    expect(workingDays(base)).toEqual({ weekdays: 260, daysOff: 48, billable: 212 });
  });

  it("never goes below zero", () => {
    expect(workingDays(input({ daysPerWeek: 1, holidayDays: 60 })).billable).toBe(0);
  });
});

describe("corporation tax", () => {
  it("is 19% up to £50,000", () => {
    expect(corporationTax(50_000)).toBeCloseTo(9_500, 2);
  });

  it("applies marginal relief between the limits", () => {
    // 25% of £100k less 3/200 of (£250k - £100k).
    expect(corporationTax(100_000)).toBeCloseTo(25_000 - 2_250, 2);
  });

  it("is 25% from £250,000", () => {
    expect(corporationTax(250_000)).toBeCloseTo(62_500, 2);
  });
});

describe("salary and dividend tax", () => {
  it("uses the personal allowance on salary, then the £500 allowance, then 10.75% and 35.75%", () => {
    const r = salaryAndDividendTax("2026-27", false, 12_570, 60_000);
    expect(r.salaryTax).toBe(0);
    // £500 at 0%, £37,200 at 10.75%, £22,300 at 35.75%.
    expect(r.dividendTax).toBeCloseTo(37_200 * 0.1075 + 22_300 * 0.3575, 2);
  });

  it("uses the 2025/26 rates for that year", () => {
    const r = salaryAndDividendTax("2025-26", false, 12_570, 30_000);
    expect(r.dividendTax).toBeCloseTo(29_500 * 0.0875, 2);
  });

  it("lets dividends use personal allowance the salary left over", () => {
    const r = salaryAndDividendTax("2026-27", false, 5_000, 20_000);
    // £7,570 of allowance left, then £500 at 0%, then £11,930 at 10.75%.
    expect(r.dividendTax).toBeCloseTo(11_930 * 0.1075, 2);
  });

  it("tapers the allowance once salary plus dividends pass £100,000", () => {
    const r = salaryAndDividendTax("2026-27", false, 12_570, 107_430);
    // £120,000 income: allowance £2,570, so £10,000 of salary is taxed at 20%.
    expect(r.allowance).toBeCloseTo(2_570, 2);
    expect(r.salaryTax).toBeCloseTo(2_000, 2);
    const ordinary = 37_700 - 10_000 - 500;
    const upper = 107_430 - 500 - ordinary;
    expect(r.dividendTax).toBeCloseTo(ordinary * 0.1075 + upper * 0.3575, 2);
  });

  it("taxes a Scottish director's salary on Scottish bands and the dividends on UK bands", () => {
    const r = salaryAndDividendTax("2026-27", true, 30_000, 30_000);
    // £17,430 taxable salary: 19% to £3,967, 20% to £16,956, 21% on the last £474.
    expect(r.salaryTax).toBeCloseTo(3_967 * 0.19 + 12_989 * 0.2 + 474 * 0.21, 2);
    // Dividends stack from £17,930 (after the £500 allowance) and cross the UK £37,700 limit.
    expect(r.dividendTax).toBeCloseTo(19_770 * 0.1075 + 9_730 * 0.3575, 2);
  });

  it("taxes dividends above £125,140 of taxable income at 39.35%", () => {
    const r = salaryAndDividendTax("2026-27", false, 12_570, 200_000);
    const top = r.dividendBands.find((b) => b.name === "Dividend additional rate");
    expect(top?.amount).toBeCloseTo(12_570 + 200_000 - 125_140, 2);
  });
});

describe("limited company", () => {
  it("works the default day rate through to take-home", () => {
    const r = calculateLtd(base);
    const profit = 106_000 - 2_500 - 12_570 - 0.15 * 7_570;
    const dividends = profit - corporationTax(profit);
    const dividendTax = 37_200 * 0.1075 + (dividends - 37_700) * 0.3575;
    expect(r.gross).toBe(106_000);
    expect(r.takeHome).toBeCloseTo(12_570 + dividends - dividendTax, 2);
  });

  it("pays the pension from pre-tax profit", () => {
    const without = calculateLtd(base);
    const withPension = calculateLtd(input({ contractorPension: 10_000 }));
    expect(withPension.pension).toBe(10_000);
    expect((line(without, "Profit before tax") ?? 0) - (line(withPension, "Profit before tax") ?? 0)).toBeCloseTo(10_000, 2);
    // Profit stays in the marginal relief band (26.5% on the slice) and dividends in the 35.75% band,
    // so £10k of pension costs £7,350 of dividends, less the dividend tax on them.
    expect(without.takeHome - withPension.takeHome).toBeCloseTo(7_350 * (1 - 0.3575), 2);
  });

  it("pays everything as salary when the company cannot cover employer NI", () => {
    const r = calculateLtd(input({ dayRate: 20, expenses: 0, ltdCosts: 0 }));
    expect(r.gross).toBe(4_240);
    expect(line(r, "Salary")).toBeCloseTo(4_240, 2);
    expect(r.takeHome).toBeCloseTo(4_240, 2);
  });

  it("shrinks the salary so salary plus employer NI uses up what the company has", () => {
    const r = calculateLtd(input({ dayRate: 50, expenses: 0, ltdCosts: 0 }));
    // £10,600 available: salary + 15% of (salary - £5,000) = £10,600.
    const salary = (10_600 + 750) / 1.15;
    expect(line(r, "Salary")).toBeCloseTo(salary, 2);
    expect(line(r, "Employer NI on the salary")).toBeCloseTo(-(salary - 5_000) * 0.15, 2);
    expect(line(r, "Profit before tax")).toBeCloseTo(0, 2);
    expect(r.takeHome).toBeCloseTo(salary, 2);
  });
});

describe("umbrella", () => {
  it("spends the whole assignment income on margin, employer costs and pay", () => {
    const r = calculateUmbrella(input({ contractorPension: 5_000 }));
    const pay = r.lines.find((l) => l.label.startsWith("Gross pay"))?.value ?? 0;
    const margin = 25 * (212 / 5);
    const erNi = 0.15 * (pay - 5_000);
    expect(pay + erNi + pay * 0.005 + margin + 5_000).toBeCloseTo(106_000, 2);
  });

  it("charges no employer NI when pay stays under the secondary threshold", () => {
    const r = calculateUmbrella(input({ dayRate: 20 }));
    // £4,240 less £1,060 margin leaves £3,180, which covers pay plus the 0.5% levy.
    const pay = 3_180 / 1.005;
    expect(line(r, "Gross pay, holiday pay included")).toBeCloseTo(pay, 2);
    expect(line(r, "Employer NI, paid from your rate")).toBeCloseTo(0, 2);
    expect(r.takeHome).toBeCloseTo(pay, 2);
  });

  it("taxes the pay like a salary", () => {
    const r = calculateUmbrella(input({ apprenticeshipLevy: false, umbrellaMargin: 0 }));
    const pay = (106_000 + 750) / 1.15;
    const tax = 37_700 * 0.2 + (pay - 50_270) * 0.4;
    const ni = 37_700 * 0.08 + (pay - 50_270) * 0.02;
    expect(r.takeHome).toBeCloseTo(pay - tax - ni, 2);
  });
});

describe("sole trader", () => {
  it("charges income tax and Class 4 NI on the profit", () => {
    const r = calculateSoleTrader(input({ dayRate: 60_000 / 212, expenses: 0, soleTraderCosts: 0 }));
    const tax = 37_700 * 0.2 + 9_730 * 0.4;
    const class4 = 37_700 * 0.06 + 9_730 * 0.02;
    expect(r.takeHome).toBeCloseTo(60_000 - tax - class4, 2);
  });

  it("gets higher-rate relief on the pension through a wider basic band", () => {
    const r = calculateSoleTrader(input({ dayRate: 60_000 / 212, expenses: 0, soleTraderCosts: 0, contractorPension: 5_000 }));
    const tax = 42_700 * 0.2 + 4_730 * 0.4;
    const class4 = 37_700 * 0.06 + 9_730 * 0.02;
    expect(r.takeHome).toBeCloseTo(60_000 - tax - class4 - 4_000, 2);
    expect(r.pension).toBe(5_000);
  });
});

describe("permanent job", () => {
  it("matches PAYE on £70,000", () => {
    const r = calculatePerm(base);
    expect(r.takeHome).toBeCloseTo(70_000 - (7_540 + 19_730 * 0.4) - (3_016 + 19_730 * 0.02), 2);
  });

  it("counts both pension contributions and benefits in the package", () => {
    const r = calculatePerm(input({ permEmployeePension: 5, permEmployerPension: 5, permBenefits: 1_000 }));
    expect(r.pension).toBeCloseTo(7_000, 2);
    expect(scenarioValue(r, "package") - scenarioValue(r, "cash")).toBeCloseTo(8_000, 2);
  });
});

describe("comparison", () => {
  it("finds the day rate at which each route matches the job's take-home", () => {
    for (const route of ROUTES) {
      const dayRate = rateOf(breakEvenDayRate(base, route, "cash"));
      // Solved to the penny per day, so within about £2 over the year.
      expect(Math.abs(calculateScenario(route, input({ dayRate })).takeHome - calculatePerm(base).takeHome)).toBeLessThan(2);
    }
  });

  it("finds the day rate at which each route matches the whole package, pension included", () => {
    const i = input({ contractorPension: 7_000, permEmployeePension: 5, permEmployerPension: 5, permBenefits: 1_000 });
    const target = scenarioValue(calculatePerm(i), "package");
    // A £3,500 net-pay contribution costs £2,100 of take-home after 40% relief;
    // then £7,000 reaches the pension and £1,000 of benefits on top.
    expect(target).toBeCloseTo(calculatePerm(base).takeHome - 3_500 * 0.6 + 7_000 + 1_000, 2);
    for (const route of ROUTES) {
      const dayRate = rateOf(breakEvenDayRate(i, route, "package"));
      const r = calculateScenario(route, { ...i, dayRate });
      expect(r.pension).toBe(7_000);
      expect(Math.abs(scenarioValue(r, "package") - target)).toBeLessThan(2);
    }
  });

  it("needs a higher day rate inside IR35 than outside", () => {
    expect(rateOf(breakEvenDayRate(base, "umbrella", "cash"))).toBeGreaterThan(rateOf(breakEvenDayRate(base, "ltd", "cash")));
  });

  it("says when there are no billable days", () => {
    expect(breakEvenDayRate(input({ benchDays: 300 }), "ltd", "cash")).toEqual({ kind: "noDays" });
  });

  it("says when even the top day rate falls short, rather than blaming the days", () => {
    // 3 days a week less 153 days off leaves 3 paid days: £60,000 at £20,000 a day.
    const i = input({ daysPerWeek: 3, benchDays: 115 });
    expect(workingDays(i).billable).toBe(3);
    expect(breakEvenDayRate(i, "umbrella", "cash")).toEqual({ kind: "outOfRange" });
  });

  it("turns a contract back into the salary worth the same", () => {
    const perm = calculatePerm(base);
    expect(salaryEquivalent(base, perm.takeHome, "cash")).toBeCloseTo(70_000, 0);
  });
});

describe("compareRoutes", () => {
  const pensionJob = input({ permEmployeePension: 5, permEmployerPension: 5, contractorPension: 1_234 });

  it("sets the contractor pension to the job's employee plus employer pension when matching", () => {
    const c = compareRoutes(pensionJob, "package", true);
    expect(c.effective.contractorPension).toBe(7_000);
    for (const route of ROUTES) expect(c.results[route].pension).toBe(7_000);
  });

  it("keeps your own pension figure when not matching", () => {
    const c = compareRoutes(pensionJob, "package", false);
    expect(c.effective.contractorPension).toBe(1_234);
    expect(c.results.ltd.pension).toBe(1_234);
  });

  it("picks the route worth most and measures it against the job", () => {
    const c = compareRoutes(base, "cash", true);
    const values = ROUTES.map((r) => scenarioValue(c.results[r], "cash"));
    expect(scenarioValue(c.results[c.best], "cash")).toBe(Math.max(...values));
    expect(c.gap).toBeCloseTo(Math.max(...values) - calculatePerm(base).takeHome, 6);
  });

  it("flags a sole trader beating a company that pays out everything, but only with income", () => {
    // £500 a day with defaults: sole trader £70,983 against Ltd £66,862.
    expect(compareRoutes(base, "cash", true).soleBeatsLtd).toBe(true);
    const idle = compareRoutes(input({ dayRate: 0 }), "cash", true);
    expect(idle.hasIncome).toBe(false);
    expect(idle.soleBeatsLtd).toBe(false);
  });

  it("gives a break-even for every route", () => {
    const c = compareRoutes(base, "cash", true);
    for (const route of ROUTES) expect(c.breakEven[route].kind).toBe("rate");
  });
});

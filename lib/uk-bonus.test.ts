import { describe, expect, it } from "vitest";
import { calculateBonus, compareSacrifice, type BonusInput } from "@/lib/uk-bonus";

/** 2026/27, England, monthly paid, no pension or loan: each case overrides what it is about. */
const base: BonusInput = {
  taxYear: "2026-27",
  salary: 40_000,
  bonus: 10_000,
  frequency: "month",
  scotland: false,
  taxCode: "",
  studentPlan: "none",
  postgradLoan: false,
  pensionType: "netpay",
  pensionPct: 0,
  pensionOnBonus: false,
  sacrificePct: 0,
  director: false,
  noNi: false,
};

const bonus = (patch: Partial<BonusInput> = {}) => calculateBonus({ ...base, ...patch });

describe("income tax on a bonus", () => {
  it("is 20% while salary plus bonus stays in the basic rate", () => {
    expect(bonus().incomeTax).toBeCloseTo(2_000, 2);
  });

  it("is 40% on the whole bonus once salary alone reaches £50,270", () => {
    const r = bonus({ salary: 50_270, bonus: 5_000 });
    expect(r.incomeTax).toBeCloseTo(2_000, 2);
    expect(r.taxBands).toEqual([expect.objectContaining({ name: "Higher rate", amount: 5_000 })]);
  });

  it("splits a bonus that straddles the higher-rate threshold and names the band it crossed into", () => {
    const r = bonus({ salary: 48_000, bonus: 5_000 });
    // £2,270 of room left at 20%, the other £2,730 at 40%.
    expect(r.incomeTax).toBeCloseTo(2_270 * 0.2 + 2_730 * 0.4, 2);
    expect(r.crossedInto).toBe("Higher rate");
  });

  it("charges the lost personal allowance when the bonus crosses £100,000", () => {
    const r = bonus({ salary: 95_000, bonus: 20_000 });
    expect(r.allowanceLost).toBeCloseTo(7_500, 2);
    // £20,000 of bonus plus £7,500 of newly taxable allowance, all at 40%.
    expect(r.incomeTax).toBeCloseTo(11_000, 2);
    expect(r.takeHome).toBeCloseTo(8_600, 2);
    expect(r.without.tapered).toBe(false);
  });

  it("knows when the salary alone is already in the taper", () => {
    const r = bonus({ salary: 110_000 });
    expect(r.without.tapered).toBe(true);
    expect(r.allowanceLost).toBeCloseTo(5_000, 2);
    expect(r.taperEnd).toBe(125_140);
  });

  it("uses the Scottish 42% higher rate", () => {
    expect(bonus({ salary: 45_000, bonus: 5_000, scotland: true }).incomeTax).toBeCloseTo(2_100, 2);
  });
});

describe("National Insurance on a bonus", () => {
  it("is charged on the bonus month alone: 8% up to £4,189, 2% above", () => {
    const r = bonus();
    const ordinary = 40_000 / 12;
    expect(r.nationalInsurance).toBeCloseTo((4_189 - ordinary) * 0.08 + (ordinary + 10_000 - 4_189) * 0.02, 2);
    expect(r.annualBasisNi).toBeCloseTo(800, 2);
    expect(r.niSavedVsAnnual).toBeCloseTo(800 - r.nationalInsurance, 2);
  });

  it("is a flat 2% when the monthly salary is already over the upper limit", () => {
    expect(bonus({ salary: 60_000 }).nationalInsurance).toBeCloseTo(200, 2);
  });

  it("uses the £242 / £967 weekly thresholds for weekly pay", () => {
    const r = bonus({ salary: 26_000, bonus: 2_000, frequency: "week" });
    expect(r.nationalInsurance).toBeCloseTo((967 - 500) * 0.08 + (2_500 - 967) * 0.02, 2);
  });

  it("uses four times the weekly thresholds for 4-weekly pay", () => {
    const r = bonus({ salary: 26_000, bonus: 5_000, frequency: "4week" });
    expect(r.nationalInsurance).toBeCloseTo((3_868 - 2_000) * 0.08 + (7_000 - 3_868) * 0.02, 2);
  });

  it("is assessed annually for directors", () => {
    const r = bonus({ director: true });
    expect(r.nationalInsurance).toBeCloseTo(800, 2);
    expect(r.niSavedVsAnnual).toBe(0);
  });

  it("is nil over State Pension age", () => {
    expect(bonus({ noNi: true }).nationalInsurance).toBe(0);
  });
});

describe("student loans on a bonus", () => {
  it("takes 9% of the whole bonus when salary is already over the threshold", () => {
    const r = bonus({ salary: 60_000, studentPlan: "plan2" });
    expect(r.studentLoan).toBeCloseTo(900, 2);
    expect(r.loanTriggeredByBonus).toBe(false);
  });

  it("still repays in the bonus month when salary is under the annual threshold", () => {
    const r = bonus({ salary: 20_000, bonus: 5_000, studentPlan: "plan2" });
    expect(r.studentLoan).toBeCloseTo((20_000 / 12 + 5_000 - 29_385 / 12) * 0.09, 2);
    expect(r.loanTriggeredByBonus).toBe(true);
  });

  it("adds 6% for a postgraduate loan", () => {
    const r = bonus({ salary: 60_000, postgradLoan: true });
    expect(r.postgradLoan).toBeCloseTo(600, 2);
    expect(r.loans).toBeCloseTo(600, 2);
  });
});

describe("pension and bonus sacrifice", () => {
  it("takes the regular pension from the bonus only when asked, with tax relief under net pay", () => {
    expect(bonus({ pensionPct: 5 }).pension).toBe(0);
    const r = bonus({ pensionPct: 5, pensionOnBonus: true });
    expect(r.pension).toBeCloseTo(500, 2);
    expect(r.incomeTax).toBeCloseTo(1_900, 2);
  });

  it("puts a fully sacrificed bonus in the pension untaxed", () => {
    const r = bonus({ sacrificePct: 100 });
    expect(r.takeHome).toBe(0);
    expect(r.incomeTax).toBe(0);
    expect(r.nationalInsurance).toBe(0);
    expect(r.pensionPot).toBeCloseTo(10_000, 2);
    expect(r.employerNiSaved).toBeCloseTo(1_500, 2);
  });

  it("only counts employer NI that would actually have been paid", () => {
    expect(bonus({ salary: 0, bonus: 5_000, sacrificePct: 100 }).employerNiSaved).toBe(0);
    expect(bonus({ salary: 3_000, bonus: 5_000, sacrificePct: 100 }).employerNiSaved).toBeCloseTo(450, 2);
  });

  it("keeps the allowance when enough is sacrificed to stay at £100,000", () => {
    const r = bonus({ salary: 95_000, bonus: 20_000, sacrificePct: 75 });
    expect(r.allowanceLost).toBe(0);
    expect(r.takeHome).toBeCloseTo(2_900, 2);
    expect(r.pensionPot).toBeCloseTo(15_000, 2);
  });

  it("compares the chosen split with both extremes", () => {
    const c = compareSacrifice({ ...base, salary: 60_000, sacrificePct: 50 });
    expect(c.allCash.takeHome).toBeCloseTo(5_800, 2);
    expect(c.result.takeHome).toBeCloseTo(2_900, 2);
    expect(c.allPension.pensionPot).toBeCloseTo(10_000, 2);
    // £2,900 of take-home given up for £5,000 of pension.
    expect(c.pensionPerPound).toBeCloseTo(5_000 / 2_900, 4);
  });

  it("reuses the result at the extremes and reports no exchange rate without a sacrifice", () => {
    const c = compareSacrifice(base);
    expect(c.allCash).toBe(c.result);
    expect(c.pensionPerPound).toBe(0);
  });
});

describe("edge cases", () => {
  it("returns zeros, not NaN, for no bonus", () => {
    const r = bonus({ bonus: 0 });
    expect(r.takeHome).toBe(0);
    expect(r.keepRate).toBe(0);
    expect(r.deductionRate).toBe(0);
  });

  it("clamps the sacrifice share to 0-100", () => {
    expect(bonus({ sacrificePct: 250 }).sacrificed).toBe(10_000);
    expect(bonus({ sacrificePct: -5 }).sacrificed).toBe(0);
  });

  it("never reports a negative take-home when a pension swallows the whole bonus", () => {
    const r = bonus({ bonus: 5_000, pensionPct: 100, pensionOnBonus: true });
    expect(r.takeHome).toBe(0);
    expect(r.keepRate).toBe(0);
  });

  it("adds up: take-home plus everything taken equals the bonus", () => {
    const r = bonus({ salary: 60_000, studentPlan: "plan2", sacrificePct: 30, pensionPct: 5, pensionOnBonus: true });
    const taken = r.incomeTax + r.nationalInsurance + r.loans + r.pension + r.sacrificed;
    expect(r.takeHome + taken).toBeCloseTo(r.bonus, 2);
  });
});

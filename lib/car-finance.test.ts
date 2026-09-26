import { describe, expect, it } from "vitest";
import {
  annuityPayment,
  basisValue,
  calculateHp,
  calculateLease,
  calculateLoan,
  calculatePcp,
  carValueAtEnd,
  compareFinance,
  defaultGmfvPct,
  defaultResalePct,
  excessMileageCharge,
  mileageValueLoss,
  monthlyRate,
  type CarFinanceInput,
} from "@/lib/car-finance";

/** £25,000 car, £2,500 down, 36 months: each case overrides what it is about. */
const base: CarFinanceInput = {
  price: 25_000,
  deposit: 2_500,
  dealerContribution: 0,
  termMonths: 36,
  apr: 9.9,
  loanApr: 6.5,
  resalePct: 51,
  gmfvPct: 41,
  pcpEnd: "handBack",
  adminFee: 0,
  optionFee: 10,
  leaseMonthly: 299,
  leaseInitial: 6,
  leaseFee: 250,
  milesPerYear: 10_000,
  mileageAllowance: 10_000,
  excessPerMile: 0.1,
};

/** Balance left after paying `payment` for `n` months at monthly rate `r`. */
function remaining(principal: number, r: number, n: number, payment: number): number {
  let balance = principal;
  for (let m = 0; m < n; m++) balance = balance * (1 + r) - payment;
  return balance;
}

describe("rates", () => {
  it("treats APR as an annual effective rate", () => {
    expect((1 + monthlyRate(9.9)) ** 12).toBeCloseTo(1.099, 10);
    expect(monthlyRate(0)).toBe(0);
  });

  it("annuity payment clears the loan, or leaves exactly the balloon", () => {
    const r = monthlyRate(9.9);
    const plain = annuityPayment(22_500, r, 36);
    expect(remaining(22_500, r, 36, plain)).toBeCloseTo(0, 6);
    const pcp = annuityPayment(22_500, r, 36, 10_250);
    expect(remaining(22_500, r, 36, pcp)).toBeCloseTo(10_250, 6);
  });

  it("splits evenly at 0% APR", () => {
    expect(annuityPayment(12_000, 0, 24)).toBe(500);
    expect(annuityPayment(12_000, 0, 24, 6_000)).toBe(250);
  });

  it("matches a hand-worked HP payment", () => {
    // £10,000 over 36 months at 9.9% APR: r = 1.099^(1/12) − 1 = 0.0078978 and
    // (1 + r)^−36 = 1.099^−3 = 0.753368, so 10,000 × 0.0078978 / 0.246632.
    expect(annuityPayment(10_000, monthlyRate(9.9), 36)).toBeCloseTo(320.22, 2);
  });
});

describe("default values", () => {
  it("knocks 20% off each year, with the GMFV at 80% of that", () => {
    expect(defaultResalePct(12)).toBe(80);
    expect(defaultResalePct(36)).toBe(51);
    expect(defaultGmfvPct(36)).toBe(41);
    expect(defaultGmfvPct(48)).toBe(33);
  });
});

describe("hire purchase", () => {
  it("owns the car after deposit, payments and the option fee", () => {
    const hp = calculateHp({ ...base, adminFee: 99 });
    expect(hp.borrowed).toBe(22_500);
    expect(hp.upfront).toBe(2_599);
    expect(hp.final).toBe(10);
    expect(hp.totalPaid).toBeCloseTo(2_599 + hp.monthly * 36 + 10, 6);
    expect(hp.endValue).toBe(12_750);
    expect(hp.netCost).toBeCloseTo(hp.totalPaid - 12_750, 6);
    expect(hp.cumulative).toHaveLength(37);
    expect(hp.cumulative.at(-1)).toBeCloseTo(hp.totalPaid, 6);
  });

  it("borrows nothing when the deposit covers the price", () => {
    const hp = calculateHp({ ...base, deposit: 30_000 });
    expect(hp.borrowed).toBe(0);
    expect(hp.monthly).toBe(0);
    expect(hp.upfront).toBe(25_000);
  });
});

describe("PCP", () => {
  it("hands back with equity when the car is worth more than the balloon", () => {
    const pcp = calculatePcp(base);
    expect(pcp.balloon).toBe(10_250);
    expect(pcp.final).toBe(0);
    expect(pcp.endValue).toBe(12_750 - 10_250);
    expect(pcp.owns).toBe(false);
    expect(pcp.interest).toBeCloseTo(pcp.monthly * 36 + 10_250 - 22_500, 6);
  });

  it("walks away owing nothing when the car is worth less than the balloon", () => {
    const pcp = calculatePcp({ ...base, resalePct: 30 });
    expect(pcp.endValue).toBe(0);
  });

  it("pays the balloon and option fee to keep the car", () => {
    const keep = calculatePcp({ ...base, pcpEnd: "keep" });
    expect(keep.final).toBe(10_260);
    expect(keep.endValue).toBe(12_750);
    expect(keep.owns).toBe(true);
    // With positive equity, keeping costs exactly the option fee more.
    const back = calculatePcp(base);
    expect(keep.netCost - back.netCost).toBeCloseTo(10, 6);
  });

  // 14,000 miles a year on a 10,000 allowance for 3 years at 10p: £1,200.
  const heavy = { ...base, milesPerYear: 14_000 };

  it("sells with the equity when the car still beats the balloon after extra miles", () => {
    const pcp = calculatePcp(heavy);
    expect(pcp.endValue).toBeCloseTo(12_750 - 1_200 - 10_250, 6);
    expect(pcp.excessMileage).toBe(0);
    expect(pcp.final).toBe(0);
  });

  it("settles a small shortfall and sells when that beats the excess charge", () => {
    // Worth £11,000 less £1,200 = £9,800 against a £10,250 balloon.
    const pcp = calculatePcp({ ...heavy, resalePct: 44 });
    expect(pcp.shortfall).toBeCloseTo(450, 6);
    expect(pcp.excessMileage).toBe(0);
    expect(pcp.final).toBeCloseTo(450, 6);
    expect(pcp.endValue).toBe(0);
  });

  it("hands back and pays the excess when the shortfall is bigger", () => {
    const pcp = calculatePcp({ ...heavy, resalePct: 35 });
    expect(pcp.shortfall).toBe(0);
    expect(pcp.excessMileage).toBeCloseTo(1_200, 6);
    expect(pcp.final).toBeCloseTo(1_200, 6);
  });

  it("charges no excess when keeping the car, but it is worth less", () => {
    const keep = calculatePcp({ ...heavy, pcpEnd: "keep" });
    expect(keep.excessMileage).toBe(0);
    expect(keep.endValue).toBeCloseTo(11_550, 6);
  });

  it("caps the balloon at the amount borrowed", () => {
    const pcp = calculatePcp({ ...base, deposit: 20_000 });
    expect(pcp.balloon).toBe(5_000);
    expect(pcp.monthly).toBeGreaterThan(0);
    expect(compareFinance({ ...base, deposit: 20_000 }, "net").balloonCapped).toBe(true);
    expect(compareFinance(base, "net").balloonCapped).toBe(false);
  });

  it("has lower monthly payments but more interest than HP", () => {
    const pcp = calculatePcp(base);
    const hp = calculateHp(base);
    expect(pcp.monthly).toBeLessThan(hp.monthly);
    expect(pcp.interest).toBeGreaterThan(hp.interest);
  });
});

describe("dealer deposit contribution", () => {
  it("cuts the amount borrowed on HP and PCP, not the loan", () => {
    const input = { ...base, dealerContribution: 1_000 };
    expect(calculateHp(input).borrowed).toBe(21_500);
    expect(calculatePcp(input).borrowed).toBe(21_500);
    expect(calculateLoan(input).borrowed).toBe(22_500);
    // It is not your money: the up front payment is still just the deposit.
    expect(calculateHp(input).upfront).toBe(2_500);
    expect(calculateHp(input).netCost).toBeLessThan(calculateHp(base).netCost);
  });

  it("is capped at what the deposit leaves to pay", () => {
    const hp = calculateHp({ ...base, deposit: 24_000, dealerContribution: 3_000 });
    expect(hp.contribution).toBe(1_000);
    expect(hp.borrowed).toBe(0);
  });
});

describe("mileage and the car's value", () => {
  it("takes extra miles off an owned car at the excess rate", () => {
    const input = { ...base, milesPerYear: 14_000 };
    expect(mileageValueLoss(input)).toBeCloseTo(1_200, 6);
    expect(carValueAtEnd(input)).toBeCloseTo(11_550, 6);
    expect(calculateHp(input).endValue).toBeCloseTo(11_550, 6);
    expect(calculateLoan(input).endValue).toBeCloseTo(11_550, 6);
  });

  it("never takes the value below zero", () => {
    const input = { ...base, milesPerYear: 100_000, resalePct: 5 };
    expect(carValueAtEnd(input)).toBe(0);
    expect(mileageValueLoss(input)).toBe(1_250);
  });

  it("leaves the value alone within the allowance", () => {
    expect(mileageValueLoss({ ...base, milesPerYear: 6_000 })).toBe(0);
  });
});

describe("personal loan", () => {
  it("uses its own APR and has no fees", () => {
    const loan = calculateLoan(base);
    expect(loan.monthly).toBeCloseTo(annuityPayment(22_500, monthlyRate(6.5), 36), 10);
    expect(loan.fees).toBe(0);
    expect(loan.final).toBe(0);
  });
});

describe("lease", () => {
  it("takes the initial rental up front, then term − 1 rentals", () => {
    const lease = calculateLease(base);
    expect(lease.upfront).toBe(299 * 6 + 250);
    expect(lease.payments).toBe(35);
    expect(lease.totalPaid).toBe(299 * 41 + 250);
    expect(lease.netCost).toBe(lease.totalPaid);
    // Nothing is due in month 1: the initial rental covers it.
    expect(lease.cumulative[1]).toBe(lease.cumulative[0]);
    expect(lease.cumulative.at(-1)).toBeCloseTo(lease.totalPaid, 6);
  });

  it("adds excess mileage over the whole term", () => {
    const input = { ...base, milesPerYear: 12_000, excessPerMile: 0.08 };
    expect(excessMileageCharge(input)).toBeCloseTo(480, 6);
    expect(calculateLease(input).final).toBeCloseTo(480, 6);
  });
});

describe("comparison", () => {
  it("picks the cheapest option on the chosen basis", () => {
    const net = compareFinance(base, "net");
    const values = Object.values(net.results).map((r) => basisValue(r, "net"));
    expect(basisValue(net.results[net.best], "net")).toBe(Math.min(...values));
    // Paying the least out of pocket is not the same as the lowest real cost.
    const total = compareFinance(base, "total");
    expect(total.best).not.toBe("hp");
  });
});

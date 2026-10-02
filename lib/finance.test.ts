import { describe, expect, it } from "vitest";
import { calculateCompound } from "@/lib/finance";

describe("calculateCompound", () => {
  it("matches the closed-form formula for a lump sum", () => {
    // Figures quoted in the tool's guide.
    expect(calculateCompound(10_000, 0, 5, 12, 10).finalBalance).toBeCloseTo(16_470.09, 2);
    expect(calculateCompound(10_000, 0, 5, 1, 10).finalBalance).toBeCloseTo(16_288.95, 2);
  });

  it("adds contributions at the start of each month", () => {
    const r = calculateCompound(10_000, 250, 7, 12, 20);
    expect(r.totalContributed).toBe(70_000);
    expect(r.finalBalance).toBeCloseTo(171_378.74, 2);
    expect(r.totalInterest).toBeCloseTo(r.finalBalance - 70_000, 6);
    expect(r.totalFees).toBe(0);
    expect(r.realFinalBalance).toBe(r.finalBalance);
    expect(r.balanceSeries).toHaveLength(21);
    expect(r.years.at(-1)?.monthlyContribution).toBe(250);
  });

  it("raises the contribution every year after the first", () => {
    const r = calculateCompound(0, 100, 0, 12, 3, { contributionIncreasePct: 10 });
    const paid = r.years.map((y) => y.monthlyContribution);
    expect(paid[0]).toBe(100);
    expect(paid[1]).toBeCloseTo(110, 9);
    expect(paid[2]).toBeCloseTo(121, 9);
    expect(r.totalContributed).toBeCloseTo(12 * (100 + 110 + 121), 6);
  });

  it("takes the annual fee monthly off the balance", () => {
    const noFee = calculateCompound(10_000, 0, 0, 12, 1);
    const withFee = calculateCompound(10_000, 0, 0, 12, 1, { annualFeePct: 1.2 });
    // 0.1% a month for 12 months, compounding.
    expect(withFee.finalBalance).toBeCloseTo(10_000 * (1 - 0.001) ** 12, 6);
    expect(withFee.totalFees).toBeCloseTo(noFee.finalBalance - withFee.finalBalance, 6);
    expect(withFee.totalInterest).toBeCloseTo(-withFee.totalFees, 6);
    expect(withFee.years[0]?.feesThisYear).toBeCloseTo(withFee.totalFees, 6);
  });

  it("deflates balances to today's money without changing the nominal result", () => {
    const nominal = calculateCompound(10_000, 0, 5, 1, 10);
    const r = calculateCompound(10_000, 0, 5, 1, 10, { inflationPct: 3 });
    expect(r.finalBalance).toBe(nominal.finalBalance);
    expect(r.realFinalBalance).toBeCloseTo(nominal.finalBalance / 1.03 ** 10, 6);
    expect(r.realBalanceSeries[0]).toBe(10_000);
    expect(r.years[4]?.realBalance).toBeCloseTo((r.years[4]?.balance ?? 0) / 1.03 ** 5, 6);
  });

  it("handles a zero-year term", () => {
    const r = calculateCompound(500, 50, 5, 12, 0);
    expect(r.finalBalance).toBe(500);
    expect(r.realFinalBalance).toBe(500);
    expect(r.years).toEqual([]);
  });
});

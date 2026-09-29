import { describe, expect, it } from "vitest";
import {
  DEFAULT_EXPENSES,
  JSA,
  encodeIncome,
  formatDuration,
  monthlyIncome,
  parseIncome,
  runOutDate,
  runway,
  spendingTotals,
  target,
  ucCapitalDeduction,
  type IncomeLine,
} from "@/lib/emergency-fund";

const line = (kind: IncomeLine["kind"], amount: number, months = 0): IncomeLine => ({ kind, amount, months });

describe("spendingTotals", () => {
  it("splits the defaults into essentials and the rest", () => {
    expect(spendingTotals(DEFAULT_EXPENSES)).toEqual({ essential: 2_010, cuttable: 390, total: 2_400 });
  });
});

describe("runway", () => {
  it("divides savings by spending with no income", () => {
    const r = runway(6_000, 2_000, [], 12);
    expect(r.months).toBe(3);
    expect(r.balances.slice(0, 5)).toEqual([6_000, 4_000, 2_000, 0, 0]);
    expect(r.balances).toHaveLength(13);
  });

  it("counts the part month the money runs out in", () => {
    expect(runway(5_000, 2_000, [], 12).months).toBe(2.5);
  });

  it("is zero with no savings", () => {
    expect(runway(0, 1_000, [], 12).months).toBe(0);
  });

  it("adds one-off sums on day one", () => {
    expect(runway(2_000, 2_000, [line("redundancy", 4_000)], 12).months).toBe(3);
  });

  it("never runs out when ongoing income covers spending", () => {
    const r = runway(1_000, 2_000, [line("partner", 2_000)], 24);
    expect(r.months).toBeNull();
    expect(r.balances.every((b) => b === 1_000)).toBe(true);
  });

  it("runs out once income that covered spending stops", () => {
    // 3 months at +500, then -1,500 a month from 2,500.
    const r = runway(1_000, 1_500, [line("side", 2_000, 3)], 12);
    expect(r.months).toBeCloseTo(3 + 2_500 / 1_500);
  });

  it("stops JSA after six months", () => {
    const weekly = JSA.over25;
    const monthly = (weekly * 52) / 12;
    expect(monthlyIncome(line("jsa", weekly), 6)).toBeCloseTo(monthly);
    expect(monthlyIncome(line("jsa", weekly), 7)).toBe(0);
    // Spending exactly matched by JSA: six free months, then a month's savings lasts one more.
    expect(runway(monthly, monthly, [line("jsa", weekly)], 12).months).toBeCloseTo(7);
  });

  it("treats 50 years or more as lasting for good", () => {
    expect(runway(10_000_000, 1_000, [], 12).months).toBeNull();
  });
});

describe("target", () => {
  it("measures progress towards months of essentials", () => {
    const t = target(6, 2_000, 5_000, 250, []);
    expect(t).toMatchObject({ amount: 12_000, gap: 7_000, over: 0, monthsToGo: 28, withIncome: 12_000 });
    expect(t.progress).toBeCloseTo(5 / 12);
  });

  it("reports savings over the target", () => {
    expect(target(3, 1_000, 4_000, 0, [])).toMatchObject({ gap: 0, over: 1_000, progress: 1, monthsToGo: 0 });
  });

  it("has no end date when nothing is being saved", () => {
    expect(target(3, 1_000, 0, 0, []).monthsToGo).toBeNull();
  });

  it("works out the savings needed once income is counted", () => {
    // 1,000 a month for 3 months, then nothing: 6 months of 2,000 needs 12,000 - 3,000.
    expect(target(6, 2_000, 0, 0, [line("partner", 1_000, 3)]).withIncome).toBe(9_000);
    // One-off money counts too, never below zero.
    expect(target(3, 1_000, 0, 0, [line("redundancy", 5_000)]).withIncome).toBe(0);
  });

  it("uses the deepest dip when income arrives later than it is needed", () => {
    // Income beyond spending early on can't pay for later months that haven't happened, but it does bank.
    expect(target(2, 1_000, 0, 0, [line("side", 3_000, 1)]).withIncome).toBe(0);
  });
});

describe("income encoding", () => {
  it("round trips", () => {
    const income = [line("redundancy", 3_000), line("partner", 800), line("side", 300, 6), line("jsa", 95.55)];
    const code = encodeIncome(income);
    expect(code).toBe("r3000_p800_s300m6_j95.55");
    expect(parseIncome(code)).toEqual({ ok: true, value: income });
  });

  it("reads an empty string as no income", () => {
    expect(parseIncome("")).toEqual({ ok: true, value: [] });
  });

  it("rejects junk", () => {
    expect(parseIncome("x100").ok).toBe(false);
    expect(parseIncome("r").ok).toBe(false);
    expect(parseIncome(Array(9).fill("r1").join("_")).ok).toBe(false);
  });
});

describe("ucCapitalDeduction", () => {
  it("matches the gov.uk examples", () => {
    expect(ucCapitalDeduction(6_000)).toBe(0);
    expect(ucCapitalDeduction(6_300)).toBeCloseTo(8.7);
    expect(ucCapitalDeduction(14_500)).toBeCloseTo(147.9);
    expect(ucCapitalDeduction(16_001)).toBeNull();
  });
});

describe("formatDuration", () => {
  it("picks sensible units", () => {
    expect(formatDuration(0)).toBe("0 days");
    expect(formatDuration(0.1)).toBe("3 days");
    expect(formatDuration(0.5)).toBe("2 weeks");
    expect(formatDuration(1)).toBe("1 month");
    expect(formatDuration(2.5)).toBe("2 months 2 weeks");
    expect(formatDuration(30)).toBe("2 years 6 months");
  });
});

describe("runOutDate", () => {
  it("adds calendar months then days", () => {
    expect(runOutDate(new Date(2026, 8, 29), 3).toDateString()).toBe(new Date(2026, 11, 29).toDateString());
    expect(runOutDate(new Date(2026, 0, 31), 1).toDateString()).toBe(new Date(2026, 1, 28).toDateString());
    expect(runOutDate(new Date(2026, 8, 1), 0.5).toDateString()).toBe(new Date(2026, 8, 16).toDateString());
  });
});

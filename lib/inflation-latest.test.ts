import { afterEach, describe, expect, it, vi } from "vitest";

// The latest year behaves differently while it is unfinished, so these run
// against a small fixture in both states rather than whatever the live data holds.
async function load(latest: { partial: boolean; month: string }) {
  vi.resetModules();
  vi.doMock("@/lib/inflation-data", () => ({
    INFLATION_DATA: {
      released: "2022-04-13",
      nextRelease: "18 May 2022",
      latest: { year: 2022, cpiRate: 5, rpiRate: 6, ...latest },
      cpi: { first: 2020, values: [100, 110, 121] },
      rpi: { first: 2020, values: [100, 110, 121] },
    },
  }));
  return import("@/lib/inflation");
}

afterEach(() => {
  vi.doUnmock("@/lib/inflation-data");
});

describe("a partial latest year", () => {
  it("centres the latest figure on its month when averaging", async () => {
    const { convert } = await load({ partial: true, month: "Mar" });
    const r = convert({ amount: 1, from: 2020, to: 2022, measure: "cpi" });
    // Mid-2020 to mid-March 2022.
    expect(r.averageRate).toBeCloseTo(1.21 ** (1 / (2022 + 2.5 / 12 - 2020.5)) - 1, 9);
  });

  it("uses the published 12-month rate and labels the month", async () => {
    const { convert, yearLabel } = await load({ partial: true, month: "Mar" });
    const r = convert({ amount: 1, from: 2021, to: 2022, measure: "cpi" });
    expect(r.rows[1]?.rate).toBeCloseTo(0.05, 9);
    expect(yearLabel(2022)).toBe("2022 (Mar)");
    expect(yearLabel(2021)).toBe("2021");
  });
});

describe("a finished latest year", () => {
  it("treats it like any other year", async () => {
    const { convert, yearLabel } = await load({ partial: false, month: "Dec" });
    const r = convert({ amount: 1, from: 2020, to: 2022, measure: "cpi" });
    expect(r.averageRate).toBeCloseTo(0.1, 9);
    expect(r.rows[2]?.rate).toBeCloseTo(121 / 110 - 1, 9);
    expect(yearLabel(2022)).toBe("2022");
  });
});

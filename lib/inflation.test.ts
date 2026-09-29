import { describe, expect, it } from "vitest";
import { INFLATION_DATA } from "@/lib/inflation-data";
import { LATEST, LATEST_YEAR, clampYear, convert, payCheck, project, yearLabel } from "@/lib/inflation";

// CPI (D7BT) annual averages used below, from the ONS: 2000 72.7, 2010 89.4,
// 2020 108.7, 2021 111.6, 2022 121.7, 2023 130.5, 2025 138.4. The ONS does not
// revise CPI or RPI once published, so these stay put across data refreshes.

describe("convert", () => {
  it("restates an amount by the ratio of the two years' index", () => {
    const r = convert({ amount: 100, from: 2000, to: 2025, measure: "cpi" });
    expect(r.value).toBeCloseTo((100 * 138.4) / 72.7, 6);
    expect(r.totalRise).toBeCloseTo(138.4 / 72.7 - 1, 6);
  });

  it("works backwards and round-trips", () => {
    const back = convert({ amount: 100, from: 2025, to: 2000, measure: "cpi" });
    expect(back.value).toBeCloseTo((100 * 72.7) / 138.4, 6);
    expect(convert({ amount: back.value, from: 2000, to: 2025, measure: "cpi" }).value).toBeCloseTo(100, 6);
    // The price rise is the same whichever way round the years go.
    expect(back.totalRise).toBeCloseTo(convert({ amount: 1, from: 2000, to: 2025, measure: "cpi" }).totalRise, 9);
  });

  it("gives the steady yearly rate over whole years", () => {
    const r = convert({ amount: 1, from: 2000, to: 2010, measure: "cpi" });
    expect(r.averageRate).toBeCloseTo((89.4 / 72.7) ** (1 / 10) - 1, 9);
  });

  it("lists every year with its inflation rate and finds the peak", () => {
    const r = convert({ amount: 100, from: 2020, to: 2023, measure: "cpi" });
    expect(r.rows.map((row) => row.year)).toEqual([2020, 2021, 2022, 2023]);
    expect(r.rows[0]?.rate).toBeNull();
    expect(r.rows[2]?.rate).toBeCloseTo(121.7 / 111.6 - 1, 9);
    expect(r.peak?.year).toBe(2022);
  });

  it("is a no-op for the same year", () => {
    const r = convert({ amount: 250, from: 2010, to: 2010, measure: "rpi" });
    expect(r.value).toBe(250);
    expect(r.averageRate).toBe(0);
    expect(r.peak).toBeNull();
  });

  it("keeps years inside what each measure covers", () => {
    expect(clampYear("cpi", 1950)).toBe(1988);
    expect(clampYear("rpi", 1950)).toBe(1950);
    expect(clampYear("rpi", 1700)).toBe(1800);
    expect(clampYear("cpi", 3000)).toBe(LATEST_YEAR);
  });

  it("goes back to 1800 with the long-run RPI", () => {
    const { values } = INFLATION_DATA.rpi;
    const r = convert({ amount: 1, from: 1800, to: 2025, measure: "rpi" });
    expect(r.value).toBeCloseTo((values[2025 - 1800] ?? 0) / (values[0] ?? 1), 6);
    expect(r.rows).toHaveLength(226);
  });
});

describe("the latest year", () => {
  it("labels an unfinished year with its month", () => {
    expect(yearLabel(2020)).toBe("2020");
    expect(yearLabel(LATEST_YEAR)).toBe(LATEST.partial ? `${LATEST_YEAR} (${LATEST.month})` : String(LATEST_YEAR));
  });

  it("uses the published 12-month rate for a partial year", () => {
    if (!LATEST.partial) return;
    const r = convert({ amount: 1, from: LATEST_YEAR - 1, to: LATEST_YEAR, measure: "cpi" });
    expect(r.rows[1]?.rate).toBeCloseTo(LATEST.cpiRate / 100, 9);
  });
});

describe("payCheck", () => {
  it("compares pay now with the old pay in today's prices", () => {
    const r = payCheck({ thenPay: 30_000, nowPay: 36_000, from: 2020, to: 2025, measure: "cpi" });
    const needed = (30_000 * 138.4) / 108.7;
    expect(r.needed).toBeCloseTo(needed, 6);
    expect(r.cashChange).toBeCloseTo(0.2, 9);
    expect(r.realChange).toBeCloseTo(36_000 / needed - 1, 9);
    expect(r.realChange).toBeLessThan(0);
    expect(r.gap).toBeCloseTo(36_000 - needed, 6);
  });

  it("does not divide by zero", () => {
    const r = payCheck({ thenPay: 0, nowPay: 0, from: 2020, to: 2025, measure: "cpi" });
    expect(r.realChange).toBe(0);
    expect(r.cashChange).toBe(0);
  });
});

describe("project", () => {
  it("compounds a steady rate", () => {
    const r = project({ amount: 100, years: 10, rate: 0.02 });
    expect(r.cost).toBeCloseTo(100 * 1.02 ** 10, 9);
    expect(r.buyingPower).toBeCloseTo(100 / 1.02 ** 10, 9);
    expect(r.rows).toHaveLength(11);
    expect(r.rows[0]).toEqual({ year: 0, cost: 100, buyingPower: 100 });
  });
});

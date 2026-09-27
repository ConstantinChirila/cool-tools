import { describe, expect, it } from "vitest";
import {
  calculateStampDuty,
  cashToBuy,
  compareBuyers,
  nearestSaving,
  stampDuty,
  taxCurve,
  type Buyer,
  type Nation,
} from "@/lib/stamp-duty";

const tax = (nation: Nation, buyer: Buyer, price: number, nonResident = false) =>
  stampDuty({ nation, buyer, price, nonResident });

describe("England and NI (SDLT)", () => {
  // Worked examples from gov.uk, checked 2026-09-27.
  it("matches the gov.uk examples", () => {
    expect(tax("england", "main", 295_000)).toBe(4_750);
    expect(tax("england", "firstTime", 500_000)).toBe(10_000);
    expect(tax("england", "additional", 300_000)).toBe(20_000);
    // Non-resident first-time buyer over the cap: standard rates plus 2%.
    expect(tax("england", "firstTime", 700_000, true)).toBe(39_000);
  });

  it("charges nothing up to £125,000", () => {
    expect(tax("england", "main", 125_000)).toBe(0);
    expect(tax("england", "main", 126_000)).toBe(20);
  });

  it("uses every band on an expensive home", () => {
    // 2,500 + 33,750 + 57,500 + 60,000
    expect(tax("england", "main", 2_000_000)).toBe(153_750);
  });

  it("loses first-time buyer relief entirely above £500,000", () => {
    const at = calculateStampDuty({ nation: "england", buyer: "firstTime", price: 500_000, nonResident: false });
    const over = calculateStampDuty({ nation: "england", buyer: "firstTime", price: 500_001, nonResident: false });
    expect(at.relief).toBe("applied");
    expect(over.relief).toBe("overCap");
    expect(over.tax).toBe(15_000);
  });

  it("stacks the non-resident 2% on first-time and additional rates", () => {
    // 2% of 300k + 7% of 100k
    expect(tax("england", "firstTime", 400_000, true)).toBe(13_000);
    // 7% of 125k + 9% of 125k + 12% of 50k
    expect(tax("england", "additional", 300_000, true)).toBe(26_000);
  });

  it("skips higher rates under £40,000", () => {
    expect(tax("england", "additional", 39_999)).toBe(0);
    expect(tax("england", "additional", 40_000)).toBe(2_000);
  });
});

describe("Scotland (LBTT)", () => {
  it("matches the Revenue Scotland examples", () => {
    expect(tax("scotland", "main", 135_000)).toBe(0);
    expect(tax("scotland", "main", 235_000)).toBe(1_800);
    expect(tax("scotland", "main", 875_000)).toBe(63_350);
    expect(tax("scotland", "firstTime", 250_000)).toBe(1_500);
  });

  it("saves first-time buyers £600 at any price", () => {
    expect(tax("scotland", "main", 2_000_000) - tax("scotland", "firstTime", 2_000_000)).toBe(600);
  });

  it("adds ADS as a flat 8% of the whole price", () => {
    const r = calculateStampDuty({ nation: "scotland", buyer: "additional", price: 300_000, nonResident: false });
    expect(r.flatSupplement).toEqual({ rate: 0.08, tax: 24_000 });
    expect(r.tax).toBe(28_600);
    expect(r.marginalRate).toBeCloseTo(0.13);
  });

  it("has no non-resident surcharge", () => {
    expect(tax("scotland", "main", 300_000, true)).toBe(tax("scotland", "main", 300_000));
  });
});

describe("Wales (LTT)", () => {
  it("matches the Welsh Revenue Authority examples", () => {
    expect(tax("wales", "main", 280_000)).toBe(3_300);
    expect(tax("wales", "main", 350_000)).toBe(7_500);
    expect(tax("wales", "main", 1_700_000)).toBe(135_750);
    expect(tax("wales", "additional", 130_000)).toBe(6_500);
    expect(tax("wales", "additional", 330_000)).toBe(22_950);
    expect(tax("wales", "additional", 36_500)).toBe(0);
  });

  it("has no first-time buyer relief", () => {
    const r = calculateStampDuty({ nation: "wales", buyer: "firstTime", price: 300_000, nonResident: false });
    expect(r.relief).toBe("unavailable");
    expect(r.tax).toBe(tax("wales", "main", 300_000));
  });
});

describe("band lines", () => {
  it("add up to the tax and cover the whole price", () => {
    const r = calculateStampDuty({ nation: "england", buyer: "additional", price: 1_000_000, nonResident: true });
    expect(r.lines.reduce((s, l) => s + l.taxable, 0)).toBe(1_000_000);
    expect(Math.floor(r.lines.reduce((s, l) => s + l.tax, 0))).toBe(r.tax);
    expect(r.lines[0]).toMatchObject({ rate: 0, surcharge: 0.07 });
  });

  it("rounds down to the pound", () => {
    // 2% of 50 pence over the band edge
    expect(tax("england", "main", 125_025)).toBe(0);
    expect(tax("england", "main", 125_050)).toBe(1);
  });
});

describe("compareBuyers", () => {
  it("prices every buyer type", () => {
    expect(compareBuyers({ nation: "england", buyer: "main", price: 300_000, nonResident: false })).toEqual({
      main: 5_000,
      firstTime: 0,
      additional: 20_000,
    });
  });
});

describe("nearestSaving", () => {
  it("points at the start of the current band", () => {
    const n = nearestSaving({ nation: "england", buyer: "main", price: 260_000, nonResident: false });
    expect(n).toEqual({ target: 250_000, cut: 10_000, saving: 500, reason: "band" });
  });

  it("finds the first-time buyer cliff", () => {
    const n = nearestSaving({ nation: "england", buyer: "firstTime", price: 510_000, nonResident: false });
    expect(n).toEqual({ target: 500_000, cut: 10_000, saving: 5_500, reason: "firstTimeCap" });
  });

  it("finds the £40,000 additional-property minimum", () => {
    const n = nearestSaving({ nation: "england", buyer: "additional", price: 45_000, nonResident: false });
    expect(n).toMatchObject({ target: 39_999, saving: 2_250, reason: "additionalMin" });
  });

  it("returns null when no tax is due", () => {
    expect(nearestSaving({ nation: "england", buyer: "firstTime", price: 280_000, nonResident: false })).toBeNull();
  });
});

describe("taxCurve", () => {
  it("samples every buyer type from zero", () => {
    const c = taxCurve({ nation: "england", nonResident: false }, 1_000_000, 10);
    expect(c.prices).toHaveLength(11);
    expect(c.main[3]).toBe(tax("england", "main", 300_000));
    expect(c.firstTime[6]).toBe(tax("england", "main", 600_000));
  });
});

describe("cashToBuy", () => {
  it("adds the deposit, tax and costs", () => {
    expect(cashToBuy(5_000, { deposit: 30_000, legal: 1_500, survey: 500, mortgageFees: 999, other: 500 })).toBe(38_499);
  });
});

describe("guide examples", () => {
  // Every figure quoted in content/stamp-duty-calculator.ts.
  it("match the engine", () => {
    expect(tax("england", "firstTime", 450_000)).toBe(7_500);
    expect(tax("england", "main", 450_000)).toBe(12_500);
    expect(tax("england", "firstTime", 510_000)).toBe(15_500);
    expect(tax("scotland", "main", 300_000)).toBe(4_600);
    expect(tax("scotland", "firstTime", 300_000)).toBe(4_000);
    expect(tax("scotland", "additional", 300_000)).toBe(28_600);
    expect(tax("wales", "main", 300_000)).toBe(4_500);
    expect(tax("wales", "additional", 300_000)).toBe(19_950);
    expect(cashToBuy(tax("england", "main", 300_000), { deposit: 30_000, legal: 1_800, survey: 500, mortgageFees: 999, other: 0 })).toBe(38_299);
  });
});

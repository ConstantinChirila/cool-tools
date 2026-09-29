import { describe, expect, it } from "vitest";
import {
  DRESSING_DEFAULTS,
  FEED_DEFAULTS,
  SEED_DEFAULTS,
  TOPSOIL_DEFAULTS,
  TURF_DEFAULTS,
  WATER_DEFAULTS,
  calculate,
  calculateFeed,
  calculateSoil,
  calculateTurf,
  calculateWater,
  seedPacks,
  seedRate,
  type LawnInput,
} from "@/lib/lawn";

// An 8 × 5 m garden with a 2 × 1.5 m shed and a 6 × 0.8 m path taken out: 40 − 3 − 4.8 = 32.2 m².
const areas: LawnInput["areas"] = [
  { shape: "rect", length: 8, width: 5, cut: false },
  { shape: "rect", length: 2, width: 1.5, cut: true },
  { shape: "rect", length: 6, width: 0.8, cut: true },
];
const input = (patch: Partial<LawnInput> = {}): LawnInput => ({
  areas,
  project: "seed",
  seed: SEED_DEFAULTS,
  turf: TURF_DEFAULTS,
  topsoil: TOPSOIL_DEFAULTS,
  dressing: DRESSING_DEFAULTS,
  feed: FEED_DEFAULTS,
  water: WATER_DEFAULTS,
  include: { topsoil: true, dressing: true, feed: true, water: true },
  ...patch,
});

describe("area", () => {
  it("takes paths, beds and sheds off the lawn", () => {
    expect(calculate(input()).area.net).toBeCloseTo(32.2, 9);
  });
});

describe("seed", () => {
  it("sows new lawns thicker than overseeding, and half as much again for birds", () => {
    expect(seedRate("seed", SEED_DEFAULTS)).toBe(35);
    expect(seedRate("overseed", SEED_DEFAULTS)).toBe(25);
    expect(seedRate("seed", { ...SEED_DEFAULTS, birds: true })).toBe(52.5);
  });

  it("buys the cheapest mix of packs", () => {
    // 32.2 m² × 35 g = 1.127 kg: one 1.5 kg pack (£18) beats a 10 kg pack (£75).
    const r = calculate(input()).seed!;
    expect(r.kg).toBeCloseTo(1.127, 9);
    expect(r.options.best).toMatchObject({ bags: 1, bulk: 0, cost: 18 });
  });

  it("switches to big packs once they're cheaper", () => {
    // 12 kg: eight 1.5 kg packs cost £144; a 10 kg pack and two small ones £111.
    const o = seedPacks(12, SEED_DEFAULTS);
    expect(o.best).toMatchObject({ bulk: 1, bags: 2, cost: 111 });
  });
});

describe("turf", () => {
  it("adds 5% for cutting and rounds up to whole rolls", () => {
    // 32.2 × 1.05 = 33.81 m²: 34 rolls of 1 m² at £5.
    const t = calculateTurf(32.2, TURF_DEFAULTS);
    expect(t.m2).toBeCloseTo(33.81, 9);
    expect(t.rolls).toBe(34);
    expect(t.cost).toBe(170);
  });

  it("charges delivery once, and nothing for an empty lawn", () => {
    expect(calculateTurf(10, { ...TURF_DEFAULTS, extra: 0, delivery: 30 }).cost).toBe(80);
    expect(calculateTurf(0, { ...TURF_DEFAULTS, delivery: 30 })).toEqual({ m2: 0, rolls: 0, cost: 0 });
  });

  it("replaces the seed in the results", () => {
    const r = calculate(input({ project: "turf" }));
    expect(r.seed).toBeNull();
    expect(r.turf?.rolls).toBe(34);
    expect(r.cost.grass).toBe(170);
  });
});

describe("soil", () => {
  it("spreads topsoil under a new lawn, with extra for settling", () => {
    // 32.2 m² × 0.1 m × 1.15 = 3.703 m³.
    const s = calculateSoil(32.2, "seed", TOPSOIL_DEFAULTS, DRESSING_DEFAULTS);
    expect(s.kind).toBe("topsoil");
    expect(s.volume).toBeCloseTo(3.703, 9);
    expect(s.weight).toBeCloseTo(3.703 * 1.3, 9);
  });

  it("top dresses an overseeded lawn by weight", () => {
    // 32.2 m² × 2.5 kg = 80.5 kg: four 25 kg bags at £7.
    const s = calculateSoil(32.2, "overseed", TOPSOIL_DEFAULTS, DRESSING_DEFAULTS);
    expect(s.kind).toBe("dressing");
    expect(s.weight).toBeCloseTo(0.0805, 9);
    expect(s.volume).toBeCloseTo(0.0805 / 1.5, 9);
    expect(s.options.best).toMatchObject({ bags: 4, bulk: 0, cost: 28 });
  });
});

describe("feed", () => {
  it("buys whole packs at the rate", () => {
    // 32.2 m² × 40 g = 1.288 kg: one 2 kg box.
    expect(calculateFeed(32.2, FEED_DEFAULTS)).toEqual({ kg: expect.closeTo(1.288, 9), packs: 1, cost: 34 });
    expect(calculateFeed(60, FEED_DEFAULTS).packs).toBe(2);
  });
});

describe("water", () => {
  it("adds up the watering spells", () => {
    // Turf: 14 daily waterings then 6 over weeks 3–4, 10 L/m² each: 200 L/m².
    const w = calculateWater(10, "turf", WATER_DEFAULTS);
    expect(w.waterings).toBe(20);
    expect(w.weeks).toBe(4);
    expect(w.litres).toBe(2000);
    expect(w.cost).toBeCloseTo(9, 9);
  });

  it("waters seed lightly until it comes up", () => {
    // 14 × 5 L then 8 × 10 L: 150 L/m².
    expect(calculateWater(1, "seed", WATER_DEFAULTS).litres).toBe(150);
    expect(calculateWater(1, "overseed", WATER_DEFAULTS).litres).toBe(110);
  });
});

describe("total cost", () => {
  it("adds the grass, soil, feed and water", () => {
    const r = calculate(input());
    expect(r.cost.total).toBeCloseTo(r.cost.grass + r.cost.soil + r.cost.feed + r.cost.water, 9);
    expect(r.cost.feed).toBe(34);
    expect(r.cost.water).toBeCloseTo((32.2 * 150 * 4.5) / 1000, 9);
  });

  it("leaves out what's switched off", () => {
    // Top dressing is only for overseeding, so it doesn't count on a new lawn.
    const r = calculate(input({ include: { topsoil: false, dressing: true, feed: false, water: false } }));
    expect(r.soil).toBeNull();
    expect(r.feed).toBeNull();
    expect(r.water).toBeNull();
    expect(r.cost.total).toBe(r.cost.grass);
  });

  it("says what it couldn't price", () => {
    const r = calculate(input({ seed: { ...SEED_DEFAULTS, smallPrice: 0, bigPrice: 0 } }));
    expect(r.cost.unpriced).toEqual(["seed"]);
    expect(r.cost.grass).toBe(0);
  });
});

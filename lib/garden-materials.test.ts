import { describe, expect, it } from "vitest";
import {
  MATERIALS,
  MATERIAL_INFO,
  areaOf,
  buyOptions,
  calculate,
  encodeAreas,
  jobFor,
  parseAreas,
  totalArea,
  unitVolume,
  type Area,
  type Settings,
} from "@/lib/garden-materials";

const rect = (a: number, b: number, cut = false): Area => ({ shape: "rect", a, b, cut });

describe("areas", () => {
  it("measures each shape", () => {
    expect(areaOf(rect(5, 3))).toBe(15);
    expect(areaOf({ shape: "circle", a: 2, b: 0, cut: false })).toBeCloseTo(Math.PI, 9);
    expect(areaOf({ shape: "known", a: 0, b: 12, cut: false })).toBe(12);
  });

  it("subtracts cut-outs and never goes below zero", () => {
    expect(totalArea([rect(5, 4), rect(2, 2, true)])).toEqual({ net: 16, added: 20, cut: 4 });
    expect(totalArea([rect(1, 1), rect(2, 2, true)]).net).toBe(0);
  });

  it("round-trips the URL form", () => {
    const areas: Area[] = [rect(5, 3), { shape: "circle", a: 2.4, b: 0, cut: false }, { shape: "known", a: 0, b: 12.5, cut: false }, rect(1, 1, true)];
    const code = encodeAreas(areas);
    expect(code).toBe("r5x3_c2.4_k12.5_-r1x1");
    expect(parseAreas(code)).toEqual({ ok: true, value: areas });
  });

  it("rejects malformed lists", () => {
    expect(parseAreas("").ok).toBe(false);
    expect(parseAreas("r5").ok).toBe(false);
    expect(parseAreas("x1x2").ok).toBe(false);
    expect(parseAreas(Array(9).fill("k1").join("_")).ok).toBe(false);
  });
});

describe("units", () => {
  it("turns litres and kilograms into cubic metres", () => {
    expect(unitVolume(750, "L", 1.3)).toBe(0.75);
    // An 800 kg bulk bag of sand at 1.6 t/m³ holds half a cubic metre.
    expect(unitVolume(800, "kg", 1.6)).toBeCloseTo(0.5, 9);
  });
});

const settings = (over: Partial<Settings> = {}): Settings => ({ ...MATERIAL_INFO.topsoil.defaults, ...over });

describe("buying", () => {
  it("does not buy an extra bag for float dust", () => {
    const o = buyOptions(1.5, settings({ bulk: 750 }), "L");
    expect(o.bulkOnly.bulk).toBe(2);
    expect(o.bulkOnly.spare).toBeCloseTo(0, 9);
  });

  it("finds a bulk and bag mix when it beats both", () => {
    // 1.725 m³: 69 × £3.50 = £241.50, 3 bulk = £285, 2 bulk + 9 bags = £221.50.
    const o = buyOptions(1.725, settings(), "L");
    expect(o.bagsOnly).toMatchObject({ bags: 69, bulk: 0, cost: 241.5 });
    expect(o.bulkOnly).toMatchObject({ bags: 0, bulk: 3, cost: 285 });
    expect(o.mix).toMatchObject({ bags: 9, bulk: 2, cost: 221.5 });
    expect(o.best).toBe(o.mix);
  });

  it("drops the mix when it is not the cheapest", () => {
    const o = buyOptions(1.725, settings({ bagPrice: 15 }), "L");
    expect(o.mix).toBeNull();
    expect(o.best).toBe(o.bulkOnly);
  });

  it("adds delivery once to any order with a bulk bag", () => {
    const o = buyOptions(1.725, settings({ delivery: 40 }), "L");
    expect(o.bulkOnly.cost).toBe(325);
    expect(o.bagsOnly.cost).toBe(241.5);
    expect(o.best).toBe(o.bagsOnly);
  });

  it("leaves out ways to buy with no price", () => {
    const o = buyOptions(1.725, settings({ bulkPrice: 0 }), "L");
    expect(o.bulkOnly.cost).toBeNull();
    expect(o.best).toBe(o.bagsOnly);
    expect(buyOptions(1.725, settings({ bulkPrice: 0, bagPrice: 0 }), "L").best).toBeNull();
  });

  it("prefers fewer items on a price tie", () => {
    // 1 m³: 40 bags at £2.50 or 1 bulk bag at £100.
    const o = buyOptions(1, settings({ bag: 25, bagPrice: 2.5, bulk: 1000, bulkPrice: 100 }), "L");
    expect(o.best).toBe(o.bulkOnly);
  });

  it("buys nothing for nothing", () => {
    const o = buyOptions(0, settings(), "L");
    expect(o.best).toMatchObject({ bags: 0, bulk: 0, cost: 0 });
  });
});

describe("calculate", () => {
  it("works out the default topsoil border", () => {
    // 4 × 1.5 m at 25 cm is 1.5 m³, plus 15% is 1.725 m³ at 1.3 t/m³.
    const r = calculate([rect(4, 1.5)], "topsoil", MATERIAL_INFO.topsoil.defaults);
    expect(r.exact).toBeCloseTo(1.5, 9);
    expect(r.volume).toBeCloseTo(1.725, 9);
    expect(r.weight).toBeCloseTo(2.2425, 9);
    // 1,725 L is 20 barrows by volume; 2,243 kg is 17 by weight.
    expect(r.barrowLoads).toBe(20);
  });

  it("limits barrow loads by weight for heavy material", () => {
    // 1 m³ of sand at 1.8 t/m³: 12 loads by volume, 13 by weight (1800 / 140 = 12.9).
    const r = calculate([rect(10, 10)], "sand", { ...MATERIAL_INFO.sand.defaults, depth: 1, extra: 0, density: 1.8 });
    expect(r.barrowLoads).toBe(13);
  });

  it("gravel bags by weight", () => {
    // 10 m² at 4 cm = 0.4 m³ = 640 kg: 29 bags of 22.5 kg, or one 800 kg bulk bag.
    const r = calculate([rect(5, 2)], "gravel", { ...MATERIAL_INFO.gravel.defaults, extra: 0 });
    expect(r.weight).toBeCloseTo(0.64, 9);
    expect(r.options.bagsOnly.bags).toBe(29);
    expect(r.options.bulkOnly.bulk).toBe(1);
  });
});

describe("material data", () => {
  it.each(MATERIALS)("%s defaults are consistent", (m) => {
    const info = MATERIAL_INFO[m];
    const job = jobFor(m, info.defaults.job);
    expect(job.id).toBe(info.defaults.job);
    expect(info.defaults.depth).toBe(job.depth);
    expect(info.bagSizes).toContain(info.defaults.bag);
    expect(info.bulkSizes).toContain(info.defaults.bulk);
    const [lo, hi] = info.densityRange;
    expect(info.defaults.density).toBeGreaterThanOrEqual(lo);
    expect(info.defaults.density).toBeLessThanOrEqual(hi);
    for (const j of info.jobs) expect(j.depth >= j.min && j.depth <= j.max).toBe(true);
  });
});

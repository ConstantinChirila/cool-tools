import { describe, expect, it } from "vitest";
import {
  DEFAULTS,
  MAX_CUTOUTS,
  MAX_PATIOS,
  MAX_SIDE,
  calculate,
  countSlabs,
  encodePatios,
  layout,
  mortarFor,
  parsePatios,
  patioArea,
  piecesPerSlab,
  type Patio,
  type Slab,
} from "@/lib/patio";

const SQUARE: Slab = { length: 600, width: 600, thickness: 20 };
const LONG: Slab = { length: 900, width: 600, thickness: 20 };
const patio = (length: number, width: number, cutOuts: Patio["cutOuts"] = []): Patio => ({ length, width, cutOuts });
const kinds = (p: Patio, slab = SQUARE, joint = 10, pattern: "grid" | "offset" = "grid", direction: "along" | "away" = "along") => {
  const { pieces } = layout(p, slab, joint, pattern, direction);
  return {
    full: pieces.filter((x) => x.kind === "full").length,
    cut: pieces.filter((x) => x.kind === "cut").length,
    notched: pieces.filter((x) => x.kind === "notched").length,
    pieces,
  };
};

describe("layout", () => {
  it("fits whole slabs exactly with no joint", () => {
    expect(kinds(patio(3, 1.8), SQUARE, 0)).toMatchObject({ full: 15, cut: 0 });
  });

  it("cuts the far edges once joints are counted", () => {
    // 610 mm pitch: 4 whole slabs then 560 mm along, 2 whole rows then 580 mm away.
    const { full, cut, pieces } = kinds(patio(3, 1.8));
    expect(full).toBe(8);
    expect(cut).toBe(7);
    const corner = pieces.find((p) => p.x > 2000 && p.y > 1000);
    expect(corner).toMatchObject({ w: 560, h: 580 });
  });

  it("counts joints inside the patio only", () => {
    // Two 3 m joints along the house, four per row across three rows of 600, 600 and 580 mm.
    expect(layout(patio(3, 1.8), SQUARE, 10, "grid", "along").jointLength).toBeCloseTo(6 + 4 * 1.78);
  });

  it("turns long slabs with the direction", () => {
    expect(layout(patio(2.7, 1.8), LONG, 0, "grid", "along").tile).toEqual({ x: 900, y: 600 });
    expect(kinds(patio(2.7, 1.8), LONG, 0, "grid", "along").full).toBe(9);
    expect(kinds(patio(2.7, 1.8), LONG, 0, "grid", "away").full).toBe(8);
  });

  it("starts every other row half a slab in for an offset pattern", () => {
    // Row 2 of a 1.8 m run with 600 slabs and no joint: 300, 600, 600, 300.
    const { pieces } = kinds(patio(1.8, 1.2), SQUARE, 0, "offset");
    const second = pieces.filter((p) => p.y === 600).map((p) => p.w);
    expect(second).toEqual([300, 600, 600, 300]);
  });

  it("leaves out cells inside a cut-out", () => {
    expect(kinds(patio(3, 1.8, [{ x: 0, y: 0, w: 0.6, h: 0.6 }]), SQUARE, 0)).toMatchObject({ full: 14, cut: 0 });
  });

  it("notches a slab with a hole in it", () => {
    expect(kinds(patio(1.2, 1.2, [{ x: 0.2, y: 0.2, w: 0.2, h: 0.2 }]), SQUARE, 0)).toMatchObject({ full: 3, notched: 1 });
  });

  it("makes a straight cut when a cut-out runs right across a slab", () => {
    const { pieces } = kinds(patio(1.2, 1.2, [{ x: 0, y: 0, w: 0.6, h: 0.2 }]), SQUARE, 0);
    expect(pieces[0]).toMatchObject({ kind: "cut", y: 200, w: 600, h: 400 });
  });
});

describe("piecesPerSlab", () => {
  it("gets two narrow strips from one slab, allowing for the blade", () => {
    expect(piecesPerSlab(250, 600, { x: 600, y: 600 })).toBe(2);
    expect(piecesPerSlab(299, 600, { x: 600, y: 600 })).toBe(1);
    expect(piecesPerSlab(290, 600, { x: 900, y: 600 })).toBe(3);
  });
});

describe("countSlabs", () => {
  it("adds the slabs the cuts come from and the breakage allowance", () => {
    // 3.3 × 0.6 m: five whole slabs and a 250 mm piece; add a second row for two 250s from one slab.
    const one = countSlabs([layout(patio(3.3, 0.6), SQUARE, 10, "grid", "along")], 0);
    expect(one).toMatchObject({ full: 5, cuts: 1, cutFrom: 1, needed: 6, order: 6, thinnest: 250 });
    const two = countSlabs([layout(patio(3.3, 1.21), SQUARE, 10, "grid", "along")], 10);
    expect(two).toMatchObject({ full: 10, cuts: 2, cutFrom: 1, needed: 11, order: 13 });
  });
});

describe("mortarFor", () => {
  it("splits dry materials by the mix", () => {
    // Pavingexpert: 0.4 m³ at 4:1 is 680 kg of sand and 170 kg of cement (rounded).
    const m = mortarFor(0.4, 4);
    expect(m.sandKg).toBeCloseTo(672);
    expect(m.cementKg).toBeCloseTo(168);
  });
});

describe("patios in the URL", () => {
  it("round trips with cut-outs", () => {
    const patios = [patio(5, 3, [{ x: 1, y: 0.5, w: 0.6, h: 0.45 }]), patio(2.4, 1.8)];
    const code = encodePatios(patios);
    expect(code).toBe("5x3@1,0.5,0.6x0.45_2.4x1.8");
    expect(parsePatios(code)).toEqual({ ok: true, value: patios });
  });

  it("rejects junk", () => {
    expect(parsePatios("5x").ok).toBe(false);
    expect(parsePatios("5x3@1,2").ok).toBe(false);
  });

  it("caps the number of patios and cut-outs and clamps sides to 100 m", () => {
    expect(parsePatios(Array.from({ length: MAX_PATIOS }, () => "2x2").join("_")).ok).toBe(true);
    expect(parsePatios(Array.from({ length: MAX_PATIOS + 1 }, () => "2x2").join("_")).ok).toBe(false);
    expect(parsePatios(`2x2${"@0,0,1x1".repeat(MAX_CUTOUTS)}`).ok).toBe(true);
    expect(parsePatios(`2x2${"@0,0,1x1".repeat(MAX_CUTOUTS + 1)}`).ok).toBe(false);
    const big = parsePatios("500x3@0,0,200x1");
    expect(big.ok && big.value[0]).toMatchObject({ length: MAX_SIDE, width: 3, cutOuts: [{ x: 0, y: 0, w: MAX_SIDE, h: 1 }] });
  });

  it("lays nothing and says so rather than millions of slabs", () => {
    const l = layout(patio(100, 100), { length: 100, width: 100, thickness: 20 }, 0, "grid", "along");
    expect(l.pieces).toHaveLength(0);
    expect(l.tooMany).toBe(true);
  });
});

describe("patioArea", () => {
  it("only takes off the part of a cut-out inside the patio", () => {
    expect(patioArea(patio(2, 2, [{ x: 1.5, y: 1.5, w: 1, h: 1 }]))).toEqual({ gross: 4, cut: 0.25, net: 3.75 });
  });
});

describe("calculate", () => {
  const build = {
    slab: SQUARE,
    joint: 5,
    pattern: "grid" as const,
    direction: "along" as const,
    slabExtra: 0,
    subBase: 100,
    subBaseExtra: 30,
    bed: 30,
    bedRatio: 4,
    fall: 60,
    fallAlong: "width" as const,
    jointing: "compound" as const,
    pointingRatio: 4,
    tub: 12.5,
  };
  const prices = { slab: 40, perSlab: false, mot: DEFAULTS.mot, sand: DEFAULTS.sand, cementBag: 7.5, tub: 43 };

  it("matches Marshalls' sub-base example: 5 × 5 m at 100 mm is 5.72 t", () => {
    expect(calculate([patio(5, 5)], build, prices).subBase.kg).toBeCloseTo(5720);
  });

  it("works out the fall across the width and the bed's sand and cement", () => {
    const r = calculate([patio(5, 3)], build, prices);
    expect(r.fall).toEqual({ run: 3, drop: 50 });
    // 15 m² × 30 mm = 0.45 m³ of bed at 2.1 t/m³.
    expect(r.bed.cementKg).toBeCloseTo(189);
    expect(r.cement.bags).toBe(8);
  });

  it("fills compound joints at least 25 mm deep and rounds up to whole tubs", () => {
    // 3 × 1.8 m in 600 mm slabs with 10 mm joints: 13.12 m of joint, 10 mm wide, filled 25 mm deep (not the slab's 20) plus 5%.
    const r = calculate([patio(3, 1.8)], { ...build, joint: 10 }, prices);
    expect(r.joints.length).toBeCloseTo(13.12);
    expect(r.compound?.depth).toBe(25);
    expect(r.compound?.litres).toBeCloseTo(3.444, 2);
    expect(r.compound?.tubs).toBe(1);
    // 6 × 4 m needs 18.8 L, about 33.8 kg: three 12.5 kg tubs.
    const big = calculate([patio(6, 4)], { ...build, joint: 10 }, prices);
    expect(big.compound?.litres).toBeCloseTo(18.76, 1);
    expect(big.compound?.tubs).toBe(3);
  });

  it("prices slabs per slab or per m² and totals the list", () => {
    const perM2 = calculate([patio(3, 1.8)], build, prices);
    const perSlab = calculate([patio(3, 1.8)], build, { ...prices, slab: 12, perSlab: true });
    expect(perM2.cost.slabs).toBeCloseTo(perM2.slabs.order * 40 * 0.36);
    expect(perSlab.cost.slabs).toBe(perSlab.slabs.order * 12);
    expect(perM2.cost.total).toBeCloseTo(perM2.cost.slabs + (perM2.cost.subBase ?? 0) + (perM2.cost.sand ?? 0) + perM2.cost.cement + perM2.cost.jointing);
  });

  it("mortar jointing adds pointing sand and cement and drops the compound", () => {
    const r = calculate([patio(3, 1.8)], { ...build, jointing: "mortar", joint: 10 }, prices);
    expect(r.compound).toBeNull();
    expect(r.cost.jointing).toBe(0);
    expect(r.pointing).not.toBeNull();
    expect(r.cement.kg).toBeCloseTo(r.bed.cementKg + (r.pointing?.cementKg ?? 0));
    expect(r.sand.kg).toBeCloseTo(r.bed.sandKg + (r.pointing?.sandKg ?? 0));
  });

  it("leaves the total finite when sand is unpriced", () => {
    const r = calculate([patio(3, 1.8)], build, { ...prices, sand: { ...DEFAULTS.sand, bagPrice: 0, bulkPrice: 0 } });
    expect(r.cost.sand).toBeNull();
    expect(Number.isFinite(r.cost.total)).toBe(true);
    expect(r.cost.total).toBeCloseTo(r.cost.slabs + (r.cost.subBase ?? 0) + r.cost.cement + r.cost.jointing);
  });

  it("says so rather than counting nothing when a patio would take too many pieces", () => {
    // 15 × 15 m of 100 mm setts: over 20,000 pieces.
    const r = calculate([patio(15, 15)], { ...build, slab: { length: 100, width: 100, thickness: 50 }, joint: 3 }, prices);
    expect(r.tooMany).toBe(true);
    expect(r.layouts[0]?.pieces).toHaveLength(0);
    expect(calculate([patio(5, 3)], build, prices).tooMany).toBe(false);
  });
});

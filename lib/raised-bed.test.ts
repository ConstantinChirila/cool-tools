import { describe, expect, it } from "vitest";
import {
  INGREDIENTS,
  INGREDIENT_INFO,
  KERF,
  calculate,
  calculateTimber,
  cutList,
  groupBoards,
  presetFor,
  shares,
  timberFor,
  type Bed,
  type Ingredient,
  type RaisedBedInput,
} from "@/lib/raised-bed";

const bed: Bed = { length: 2.4, width: 1.2, depth: 45, count: 1 };
const buying = Object.fromEntries(INGREDIENTS.map((i) => [i, INGREDIENT_INFO[i].defaults])) as RaisedBedInput["buying"];
const input = (patch: Partial<RaisedBedInput> = {}): RaisedBedInput => ({
  bed,
  mix: { topsoil: 50, compost: 30, manure: 20 },
  extra: 15,
  buying,
  timber: timberFor("scaffold"),
  otherPerBed: 0,
  ...patch,
});

describe("mix", () => {
  it("treats percentages that don't add up to 100 as parts", () => {
    expect(shares({ topsoil: 50, compost: 30, manure: 20 })).toEqual({ topsoil: 0.5, compost: 0.3, manure: 0.2 });
    const s = shares({ topsoil: 2, compost: 1, manure: 1 });
    expect(s.topsoil).toBe(0.5);
    expect(s.compost).toBe(0.25);
    expect(shares({ topsoil: 0, compost: 0, manure: 0 })).toEqual({ topsoil: 0, compost: 0, manure: 0 });
  });

  it("recognises presets", () => {
    expect(presetFor({ topsoil: 50, compost: 30, manure: 20 })?.id).toBe("classic");
    expect(presetFor({ topsoil: 50, compost: 25, manure: 25 })).toBeUndefined();
  });
});

describe("soil", () => {
  it("fills internal length × width × depth for every bed, plus the extra", () => {
    const r = calculate(input({ bed: { ...bed, count: 2 } }));
    expect(r.perBed).toBeCloseTo(1.296, 9);
    expect(r.exact).toBeCloseTo(2.592, 9);
    expect(r.volume).toBeCloseTo(2.592 * 1.15, 9);
  });

  it("splits the volume by the mix and leaves out unused ingredients", () => {
    const r = calculate(input({ mix: { topsoil: 60, compost: 40, manure: 0 } }));
    expect(r.parts.map((p) => p.ingredient)).toEqual<Ingredient[]>(["topsoil", "compost"]);
    const [topsoil, compost] = r.parts;
    expect(topsoil!.volume + compost!.volume).toBeCloseTo(r.volume, 9);
    expect(topsoil!.volume / r.volume).toBeCloseTo(0.6, 9);
    expect(topsoil!.weight).toBeCloseTo(topsoil!.volume * 1.3, 9);
  });

  it("prices each ingredient the cheapest way", () => {
    // 1.4904 m³: topsoil 0.7452 → one 750 L bulk bag (£95) beats 30 × 25 L (£105);
    // compost 0.44712 → 9 × 50 L (£54); manure 0.29808 → 6 × 50 L (£36).
    const r = calculate(input());
    const plan = (i: Ingredient) => r.parts.find((p) => p.ingredient === i)!.options.best!;
    expect(plan("topsoil")).toMatchObject({ bulk: 1, bags: 0, cost: 95 });
    expect(plan("compost")).toMatchObject({ bulk: 0, bags: 9, cost: 54 });
    expect(plan("manure")).toMatchObject({ bulk: 0, bags: 6, cost: 36 });
    expect(r.cost.soil).toBe(185);
  });

  it("flags an ingredient with no price", () => {
    const r = calculate(input({ buying: { ...buying, manure: { ...buying.manure, bagPrice: 0, bulkPrice: 0 } } }));
    expect(r.cost.unpriced).toEqual(["manure"]);
    expect(r.cost.soil).toBe(95 + 54);
  });
});

describe("cut list", () => {
  it("packs pieces into the fewest boards, allowing for saw cuts", () => {
    const boards = cutList([2.476, 2.476, 1.2, 1.2], 3.9);
    expect(boards).toHaveLength(2);
    expect(boards[0]!.cuts).toEqual([2.476, 1.2]);
    expect(boards[0]!.offcut).toBeCloseTo(3.9 - 2.476 - 1.2 - KERF, 9);
  });

  it("doesn't squeeze in a piece that only fits without the saw cut", () => {
    expect(cutList([1.95, 1.95], 3.9)).toHaveLength(2);
    expect(cutList([1.9485, 1.9485], 3.9)).toHaveLength(1);
  });

  it("packs thousands of pieces the same as a plain first-fit scan", () => {
    const pieces = Array.from({ length: 3000 }, (_, i) => [2.456, 1.2, 0.9, 2.456][i % 4]!);
    const naive: { cuts: number[]; offcut: number }[] = [];
    for (const piece of [...pieces].sort((a, b) => b - a)) {
      const board = naive.find((b) => b.offcut + 1e-9 >= piece + KERF);
      if (board) {
        board.cuts.push(piece);
        board.offcut -= piece + KERF;
      } else naive.push({ cuts: [piece], offcut: 3.6 - piece });
    }
    expect(cutList(pieces, 3.6).map((b) => b.cuts)).toEqual(naive.map((b) => b.cuts));
  });

  it("groups identical boards", () => {
    const groups = groupBoards(cutList([2, 2, 2, 1, 1, 1], 3.1));
    expect(groups).toEqual([{ count: 3, cuts: [2, 1], offcut: expect.closeTo(0.1 - KERF, 9) }]);
  });
});

describe("timber", () => {
  it("builds a 2.4 × 1.2 m bed two scaffold boards high from four boards and six posts", () => {
    const t = calculateTimber(bed, timberFor("scaffold"))!;
    expect(t.courses).toBe(2);
    expect(t.height).toBe(450);
    expect(t.boards).toHaveLength(4);
    expect(t.outside.length).toBeCloseTo(2.476, 9);
    expect(t.outside.width).toBeCloseTo(1.276, 9);
    // Four corners plus one halfway along each 2.4 m side, 0.45 m each: five to a 2.4 m length.
    expect(t.posts.count).toBe(6);
    expect(t.posts.stock).toHaveLength(2);
    expect(t.cost).toBe(4 * 22 + 2 * 6);
    expect(t.joins).toBe(false);
  });

  it("rounds the courses up to cover the fill depth", () => {
    expect(calculateTimber({ ...bed, depth: 30 }, timberFor("scaffold"))!.courses).toBe(2);
    expect(calculateTimber({ ...bed, depth: 22.5 }, timberFor("scaffold"))!.courses).toBe(1);
  });

  it("splits sides longer than a board and says so", () => {
    const t = calculateTimber({ ...bed, length: 4, depth: 20 }, timberFor("sleeper"))!;
    // A 4 m side can't come from a 2.4 m sleeper either way round; no posts on sleepers.
    expect(t.joins).toBe(true);
    expect(Math.max(...t.boards.flatMap((b) => b.cuts))).toBeLessThanOrEqual(2.4);
    expect(t.posts.count).toBe(0);
    expect(t.postCost).toBe(0);
  });

  it("puts the overlapping sides whichever way uses fewer boards", () => {
    // 2.4 m sleepers: 2.4 m sides between 1.4 m ends take four; 2.6 m sides would need joining and six.
    const t = calculateTimber({ length: 2.4, width: 1.2, depth: 20, count: 1 }, timberFor("sleeper"))!;
    expect(t.joins).toBe(false);
    expect(t.boards).toHaveLength(4);
  });

  it("multiplies by the number of beds", () => {
    // 144 mm decking, 3.6 m long, four courses to 45 cm. Each course takes two
    // 2.456 m sides (one to a board, the 1.144 m offcut too short for an end)
    // and two 1.2 m ends (two to a board): 12 courses over three beds = 36 boards.
    const one = calculateTimber(bed, timberFor("decking"))!;
    const three = calculateTimber({ ...bed, count: 3 }, timberFor("decking"))!;
    expect(one.boards).toHaveLength(12);
    expect(three.boards).toHaveLength(36);
    expect(three.boardCost).toBe(36 * 12);
    expect(three.posts.count).toBe(one.posts.count * 3);
  });

  it("is skipped when the bed is already built", () => {
    expect(calculateTimber(bed, timberFor("none"))).toBeNull();
    expect(calculate(input({ timber: timberFor("none") })).cost.timber).toBe(0);
  });
});

describe("total cost", () => {
  it("adds soil, timber and other bits per bed", () => {
    const r = calculate(input({ otherPerBed: 10, bed: { ...bed, count: 2 } }));
    expect(r.cost.other).toBe(20);
    expect(r.cost.total).toBeCloseTo(r.cost.soil + r.cost.timber + 20, 9);
  });
});

import { describe, expect, it } from "vitest";
import {
  FOOT,
  INCH,
  acuityDistance,
  detailDistance,
  detailVerdict,
  distanceForAngle,
  screenSize,
  sizeForAngle,
  viewingAngle,
  zoneBands,
  zoneFor,
} from "@/lib/tv-distance";

describe("screen geometry", () => {
  it("measures a 16:9 screen", () => {
    // A 65" 16:9 panel is 56.7" by 31.9".
    const { width, height } = screenSize(65);
    expect(width / INCH).toBeCloseTo(56.65, 2);
    expect(height / INCH).toBeCloseTo(31.87, 2);
  });

  it("round-trips angle, distance and size", () => {
    const d = distanceForAngle(55, 35);
    expect(viewingAngle(55, d)).toBeCloseTo(35, 9);
    expect(sizeForAngle(d, 35)).toBeCloseTo(55, 9);
  });

  it("matches the usual rules of thumb", () => {
    // SMPTE 30° is about 1.63 times the diagonal, THX 40° about 1.2 and THX 36° about 1.34.
    expect(distanceForAngle(65, 30) / (65 * INCH)).toBeCloseTo(1.626, 3);
    expect(distanceForAngle(65, 40) / (65 * INCH)).toBeCloseTo(1.197, 3);
    expect(distanceForAngle(65, 36) / (65 * INCH)).toBeCloseTo(1.341, 3);
  });
});

describe("resolution", () => {
  it("matches Carlton Bale's chart for a 60-inch 1080p screen", () => {
    // Full benefit of 1080p on a 60" screen ends at about 7.8 ft.
    expect(acuityDistance(60, 1080) / FOOT).toBeCloseTo(7.8, 1);
  });

  it("halves the distance each time the resolution doubles", () => {
    expect(acuityDistance(65, 2160)).toBeCloseTo(acuityDistance(65, 1080) / 2, 9);
  });

  it("judges 4K against Full HD", () => {
    const hd = acuityDistance(65, 1080);
    expect(detailVerdict(65, hd + 0.1, "4k").within).toBe(false);
    expect(detailVerdict(65, hd - 0.1, "4k").within).toBe(true);
    expect(detailVerdict(65, hd - 0.1, "4k").message).toMatch(/some/);
    expect(detailVerdict(65, hd / 2, "4k").message).toMatch(/every/);
  });

  it("uses one detail distance for the verdict and the size guide", () => {
    for (const r of ["hd", "4k", "8k"] as const) expect(detailVerdict(55, 2, r).distance).toBe(detailDistance(55, r));
    expect(detailDistance(65, "hd")).toBe(detailDistance(65, "4k"));
  });

  it("judges 8K against 4K", () => {
    const uhd = acuityDistance(65, 2160);
    expect(detailVerdict(65, uhd + 0.1, "8k")).toMatchObject({ within: false, distance: uhd });
  });
});

describe("zones", () => {
  it("puts each angle in one zone", () => {
    expect(zoneFor(55).id).toBe("tooClose");
    expect(zoneFor(50).id).toBe("tooClose");
    expect(zoneFor(45).id).toBe("immersive");
    expect(zoneFor(35).id).toBe("sweetSpot");
    expect(zoneFor(30).id).toBe("sweetSpot");
    expect(zoneFor(25).id).toBe("bitFar");
    expect(zoneFor(5).id).toBe("tooFar");
  });

  it("lays the zones end to end from the screen", () => {
    const bands = zoneBands(65);
    expect(bands[0]!.from).toBe(0);
    expect(bands.at(-1)!.to).toBe(Number.POSITIVE_INFINITY);
    for (let i = 1; i < bands.length; i++) expect(bands[i]!.from).toBeCloseTo(bands[i - 1]!.to, 9);
    const sweet = bands.find((b) => b.zone.id === "sweetSpot")!;
    expect(sweet.from).toBeCloseTo(distanceForAngle(65, 40), 9);
    expect(sweet.to).toBeCloseTo(distanceForAngle(65, 30), 9);
  });
});

import { describe, expect, it } from "vitest";
import {
  PIPE_DEFAULTS,
  SCHEDULE_DEFAULTS,
  TAP_DEFAULTS,
  calculate,
  calculateZone,
  clockText,
  encodeZones,
  flushFlow,
  parseClock,
  parseZones,
  pipeLitres,
  tapFlow,
  usableFlow,
  zoneFromKind,
  type IrrigationInput,
} from "@/lib/irrigation";

const zones = [zoneFromKind("tomato", 6), zoneFromKind("pot", 10), zoneFromKind("basket", 4)];
const input = (patch: Partial<IrrigationInput> = {}): IrrigationInput => ({
  tap: TAP_DEFAULTS,
  zones,
  schedule: SCHEDULE_DEFAULTS,
  pipes: PIPE_DEFAULTS,
  price: 4.5,
  ...patch,
});

describe("tap", () => {
  it("turns a bucket test into litres an hour", () => {
    // Hozelock's example: 9 L in 15 s is 2,160 L/h.
    expect(tapFlow({ litres: 9, seconds: 15 })).toBe(2160);
    expect(tapFlow({ litres: 10, seconds: 40 })).toBe(900);
    expect(tapFlow({ litres: 10, seconds: 0 })).toBe(0);
  });

  it("designs to the margin, capped by the kit", () => {
    expect(usableFlow(TAP_DEFAULTS)).toBe(675);
    expect(usableFlow({ ...TAP_DEFAULTS, limit: 500 })).toBe(500);
    expect(usableFlow({ ...TAP_DEFAULTS, limit: 1000 })).toBe(675);
  });
});

describe("zones", () => {
  it("works out flow, the dripper limit and run time", () => {
    const z = calculateZone(zoneFromKind("tomato", 6), 675, 1);
    expect(z).toMatchObject({ drippers: 6, flow: 24, maxDrippers: 168, over: false, split: 1, litres: 9 });
    // 1.5 L from one 4 L/h dripper: 22.5 minutes.
    expect(z.minutes).toBeCloseTo(22.5);
  });

  it("halves the run time over two waterings", () => {
    expect(calculateZone(zoneFromKind("tomato", 6), 675, 2).minutes).toBeCloseTo(11.25);
  });

  it("splits a zone the tap can't run at once", () => {
    const z = calculateZone({ ...zoneFromKind("bed", 50) }, 675, 1);
    // 50 m² × 4 drippers × 2 L/h = 400 L/h: fits. 100 m² is 800 L/h: two zones.
    expect(z.over).toBe(false);
    const big = calculateZone(zoneFromKind("bed", 100), 675, 1);
    expect(big).toMatchObject({ flow: 800, over: true, split: 2, maxDrippers: 337 });
  });

  it("round-trips through the URL", () => {
    const code = encodeZones(zones);
    expect(code).toBe("t6x1x4x1.5_p10x1x4x1.5_b4x1x2x0.4");
    const parsed = parseZones(code);
    expect(parsed.ok && parsed.value).toEqual(zones);
  });

  it("rejects junk and clamps numbers", () => {
    expect(parseZones("q1x1x1x1").ok).toBe(false);
    expect(parseZones("t1x1x1").ok).toBe(false);
    expect(parseZones(Array(7).fill("t1x1x4x1").join("_")).ok).toBe(false);
    const parsed = parseZones("t9999x0x4x1");
    expect(parsed.ok && parsed.value[0]).toMatchObject({ plants: 500, drippersPerPlant: 1 });
  });
});

describe("calculate", () => {
  it("adds up the default garden", () => {
    const r = calculate(input());
    expect(r.tap).toBe(900);
    expect(r.usable).toBe(675);
    // 22.5 + 22.5 + 12 minutes, one zone after another.
    expect(r.minutes).toBeCloseTo(57);
    expect(r.daily).toBeCloseTo(25.6);
    expect(r.weekly).toBeCloseTo(179.2);
    expect(r.weeklyCost).toBeCloseTo(0.8064);
  });

  it("counts every run of a zone the tap must split", () => {
    const r = calculate(input({ zones: [zoneFromKind("bed", 100)] }));
    const z = r.zones[0]!;
    expect(z.split).toBe(2);
    expect(r.minutes).toBeCloseTo(z.minutes * 2);
  });

  it("waters fewer days a week", () => {
    const r = calculate(input({ schedule: { ...SCHEDULE_DEFAULTS, days: 3 } }));
    expect(r.weekly).toBeCloseTo(76.8);
  });

  it("works out what the pipes hold and how fast they flush", () => {
    const r = calculate(input());
    expect(r.pipes.supplyLitres).toBeCloseTo(1.274, 3);
    expect(r.pipes.microLitres).toBeCloseTo(0.126, 3);
    expect(r.pipes.flushMinutes * 60).toBeCloseTo(5.6, 1);
    expect(r.pipes.flushRatio).toBeCloseTo(9.81, 2);
  });
});

describe("pipes", () => {
  it("measures volume and flushing flow", () => {
    // 16 mm LDPE, 13.6 mm inside: 0.145 L a metre; 0.3 m/s is about 157 L/h.
    expect(pipeLitres(13.6, 1)).toBeCloseTo(0.1453, 4);
    expect(flushFlow(13.6)).toBeCloseTo(156.9, 1);
  });
});

describe("clock", () => {
  it("formats and parses times of day", () => {
    expect(clockText(6 * 60)).toBe("06:00");
    expect(clockText(1440 + 30)).toBe("00:30");
    expect(parseClock("18:45")).toBe(18 * 60 + 45);
    expect(parseClock("25:00")).toBeNull();
  });
});

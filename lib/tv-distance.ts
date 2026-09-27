/**
 * TV viewing distance: how much of your view a screen fills, and how close you
 * need to be to see all the detail its resolution carries.
 *
 * Geometry is exact for a flat 16:9 screen. Distances are from your eyes to the
 * screen, in metres; sizes are the screen diagonal in inches.
 */

export const INCH = 0.0254;
export const FOOT = 0.3048;

/** Width and height of a 16:9 screen as fractions of its diagonal. */
const WIDTH_PER_DIAGONAL = 16 / Math.hypot(16, 9);
const HEIGHT_PER_DIAGONAL = 9 / Math.hypot(16, 9);

/** 20/20 vision resolves detail down to one arcminute. */
const ARCMINUTE = Math.PI / (180 * 60);

const rad = (deg: number) => (deg * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

export function screenSize(diagonalIn: number): { width: number; height: number } {
  const d = diagonalIn * INCH;
  return { width: d * WIDTH_PER_DIAGONAL, height: d * HEIGHT_PER_DIAGONAL };
}

/** Horizontal field of view the screen fills, in degrees. */
export function viewingAngle(diagonalIn: number, distance: number): number {
  if (distance <= 0) return 180;
  return deg(2 * Math.atan(screenSize(diagonalIn).width / 2 / distance));
}

/** Eye-to-screen distance at which the screen fills `angle` degrees. */
export function distanceForAngle(diagonalIn: number, angle: number): number {
  return screenSize(diagonalIn).width / 2 / Math.tan(rad(angle) / 2);
}

/** Screen diagonal, in inches, that fills `angle` degrees from `distance`. */
export function sizeForAngle(distance: number, angle: number): number {
  return (2 * distance * Math.tan(rad(angle) / 2)) / WIDTH_PER_DIAGONAL / INCH;
}

export type Resolution = "hd" | "4k" | "8k";

export const RESOLUTIONS: readonly Resolution[] = ["hd", "4k", "8k"];

export const RESOLUTION_INFO: Record<Resolution, { label: string; rows: number }> = {
  hd: { label: "Full HD", rows: 1080 },
  "4k": { label: "4K", rows: 2160 },
  "8k": { label: "8K", rows: 4320 },
};

/**
 * Furthest distance at which 20/20 eyes can still pick out single rows of
 * pixels on a screen with `rows` lines. Further back, finer detail is lost.
 */
export function acuityDistance(diagonalIn: number, rows: number): number {
  return screenSize(diagonalIn).height / rows / Math.tan(ARCMINUTE);
}

export type ZoneId = "tooClose" | "immersive" | "sweetSpot" | "bitFar" | "tooFar";

export interface Zone {
  id: ZoneId;
  label: string;
  /** Angles this zone covers: from `minAngle` (far edge) to `maxAngle` (near edge). */
  minAngle: number;
  maxAngle: number;
  blurb: string;
}

/**
 * Zones by viewing angle, nearest first. 30° is SMPTE's minimum and 40° the
 * THX ideal; the 50° and 20° edges are a rule of thumb, not a standard.
 */
export const ZONES: readonly Zone[] = [
  {
    id: "tooClose",
    label: "Too close",
    minAngle: 50,
    maxAngle: 180,
    blurb: "The screen spills past your view, so you'll turn your head to follow the action.",
  },
  {
    id: "immersive",
    label: "Immersive",
    minAngle: 40,
    maxAngle: 50,
    blurb: "Like the front half of a cinema: great for films and games, a lot for the news.",
  },
  {
    id: "sweetSpot",
    label: "Sweet spot",
    minAngle: 30,
    maxAngle: 40,
    blurb: "Between SMPTE's 30° and THX's 40°: big enough to draw you in, easy to take in at a glance.",
  },
  {
    id: "bitFar",
    label: "Bit far",
    minAngle: 20,
    maxAngle: 30,
    blurb: "Comfortable for everyday TV, but films lose some of their punch.",
  },
  {
    id: "tooFar",
    label: "Too far",
    minAngle: 0,
    maxAngle: 20,
    blurb: "The screen is a small window from here: a bigger TV or a closer seat would help.",
  },
];

export const SWEET_SPOT = { min: 30, max: 40, ideal: 35 } as const;

export function zoneFor(angle: number): Zone {
  return ZONES.find((z) => angle >= z.minAngle) ?? ZONES[ZONES.length - 1]!;
}

/** Where each zone starts and ends on the floor, from the screen outwards. */
export function zoneBands(diagonalIn: number): { zone: Zone; from: number; to: number }[] {
  return ZONES.map((zone) => ({
    zone,
    from: zone.maxAngle >= 180 ? 0 : distanceForAngle(diagonalIn, zone.maxAngle),
    to: zone.minAngle <= 0 ? Number.POSITIVE_INFINITY : distanceForAngle(diagonalIn, zone.minAngle),
  }));
}

export interface DetailVerdict {
  /** Distance the verdict turns on. */
  distance: number;
  /** Whether you sit close enough to benefit. */
  within: boolean;
  /** One short line on what the resolution gives you from here. */
  message: string;
}

/**
 * What the screen's resolution is worth from this seat. Full HD is judged on
 * whether pixels show; 4K and 8K on whether you can see more than the step
 * below them.
 */
export function detailVerdict(diagonalIn: number, distance: number, resolution: Resolution): DetailVerdict {
  const hd = acuityDistance(diagonalIn, 1080);
  const uhd = acuityDistance(diagonalIn, 2160);
  if (resolution === "hd") {
    const within = distance < hd;
    return {
      distance: hd,
      within,
      message: within
        ? "Close enough to pick out pixels on Full HD: a 4K set would look sharper."
        : "Full HD looks as sharp as it can from here.",
    };
  }
  if (resolution === "4k") {
    const within = distance < hd;
    return {
      distance: hd,
      within,
      message: within
        ? distance <= uhd
          ? "You can see every bit of 4K detail from here."
          : "You can see some of the extra 4K detail over Full HD."
        : "Too far to tell 4K from Full HD on this size: move closer or go bigger.",
    };
  }
  const within = distance < uhd;
  return {
    distance: uhd,
    within,
    message: within
      ? "Close enough for 8K to look sharper than 4K."
      : "Too far for 8K to beat 4K on this size.",
  };
}

/** Common TV sizes, for the size guide and for rounding a recommendation to something you can buy. */
export const COMMON_SIZES = [32, 43, 50, 55, 65, 75, 85, 98] as const;

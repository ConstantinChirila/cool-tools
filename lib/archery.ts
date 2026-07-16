/**
 * Arrow spine math.
 *
 * Static spine follows the ASTM F2031 convention: the deflection (in
 * thousandths of an inch) of a shaft supported on a 28" span with a 1.94 lb
 * weight hung at the center. Higher number = more deflection = weaker shaft.
 *
 * Effective (dynamic) spine model:
 * - Length: beam deflection scales with the cube of the working length
 *   (stiffness of a beam is proportional to EI / L^3), so
 *   spine_length = spine * (newLength / baseLength)^3.
 * - Point weight: a heavier point increases the inertial load that buckles
 *   the shaft during acceleration. The effect is proportional to both the
 *   extra mass and the shaft's compliance. We use the widely quoted field
 *   heuristic (25 gr of point weight is roughly 25 spine on a mid-range
 *   shaft) scaled proportionally to the shaft's own spine:
 *   factor = 1 + POINT_SENSITIVITY * (newPoint - basePoint) / 100.
 *
 * This estimates how the modified arrow behaves relative to the original
 * setup. It is a tuning aid, not a substitute for paper/bareshaft tuning.
 */

/** Spine change per 100 gr of point weight, as a fraction of current spine. */
const POINT_SENSITIVITY = 0.25;

/** Approximate spine ratio of one standard spine group (about 5 lb of draw). */
const GROUP_RATIO = 0.84;
const LBS_PER_GROUP = 5;

/** Common commercial spine sizes, stiffest first. */
export const STANDARD_SPINES = [
  150, 200, 250, 300, 340, 350, 400, 500, 600, 700, 800, 900, 1000, 1100,
  1200, 1300,
];

export interface SpineInput {
  /** Static spine as labeled on the shaft (ASTM, e.g. 500). */
  baseSpine: number;
  /** Current shaft length in inches. */
  baseLength: number;
  /** Current point weight in grains. */
  basePoint: number;
  /** Modified shaft length in inches. */
  newLength: number;
  /** Modified point weight in grains. */
  newPoint: number;
}

export interface SpineResult {
  /** Spine number the modified arrow behaves like, in the original setup. */
  effectiveSpine: number;
  /** Portion of the change caused by the length difference. */
  lengthEffect: number;
  /** Portion of the change caused by the point weight difference. */
  pointEffect: number;
  /** effectiveSpine - baseSpine (negative = stiffer). */
  totalDelta: number;
  /** Equivalent draw weight shift in pounds (positive = like drawing more). */
  drawWeightShift: number;
  /** Closest commercial spine size to the effective spine. */
  nearestStandard: number;
  direction: "stiffer" | "weaker" | "unchanged";
}

export function calculateEffectiveSpine(input: SpineInput): SpineResult {
  const { baseSpine, baseLength, basePoint, newLength, newPoint } = input;

  const lengthFactor = (newLength / baseLength) ** 3;
  const afterLength = baseSpine * lengthFactor;

  const pointFactor = 1 + (POINT_SENSITIVITY * (newPoint - basePoint)) / 100;
  const effectiveSpine = Math.max(1, afterLength * pointFactor);

  const lengthEffect = afterLength - baseSpine;
  const pointEffect = effectiveSpine - afterLength;
  const totalDelta = effectiveSpine - baseSpine;

  // A weaker effective spine behaves like drawing more weight with the
  // original arrow: one spine group (ratio ~0.84) per ~5 lb.
  const drawWeightShift =
    (Math.log(effectiveSpine / baseSpine) / Math.log(1 / GROUP_RATIO)) *
    LBS_PER_GROUP;

  const nearestStandard = STANDARD_SPINES.reduce((best, s) =>
    Math.abs(s - effectiveSpine) < Math.abs(best - effectiveSpine) ? s : best,
  );

  const direction =
    Math.abs(totalDelta) < 0.5
      ? "unchanged"
      : totalDelta < 0
        ? "stiffer"
        : "weaker";

  return {
    effectiveSpine,
    lengthEffect,
    pointEffect,
    totalDelta,
    drawWeightShift,
    nearestStandard,
    direction,
  };
}

/**
 * Units and number formats shared by the garden tools (garden materials,
 * raised beds, lawn), so the same volume reads the same in each.
 */

import { formatNumber, plural } from "@/lib/currency";
import type { Buying, Plan } from "@/lib/garden-materials";

export type Units = "metric" | "imperial";
export const UNITS = ["metric", "imperial"] as const satisfies readonly Units[];
export const UNIT_OPTIONS: { value: Units; label: string }[] = [
  { value: "metric", label: "Metres" },
  { value: "imperial", label: "Feet" },
];

export const FOOT = 0.3048;
export const CM_PER_INCH = 2.54;
export const CUBIC_YARD = 0.764555;

export type Money = (v: number, decimals?: number) => string;

/** Cubic metres to 2 places (1 from 10 up), nudged so 1.725 shows as 1.73 like its 1,725 litres. */
export function cubic(m3: number): string {
  return formatNumber(m3 + 1e-9, m3 < 10 ? 2 : 1);
}

/** Tonnes from one up, kilograms below. */
export function weightText(t: number): string {
  return t >= 1 ? `${formatNumber(t, 2)} t` : `${formatNumber(t * 1000, 0)} kg`;
}

/** Pence while it matters, whole pounds once it doesn't. */
export function price(v: number, money: Money): string {
  return money(v, v < 100 && !Number.isInteger(v) ? 2 : 0);
}

/** Metres, or feet and inches: 8′2″. */
export function lengthText(m: number, units: Units): string {
  if (units === "imperial") {
    const inches = Math.round(m / 0.0254);
    const ft = Math.floor(inches / 12);
    return inches % 12 ? `${ft}′${inches % 12}″` : `${ft} ft`;
  }
  return `${formatNumber(m, m < 10 ? 2 : 1)} m`;
}

export function depthText(cm: number, units: Units): string {
  return units === "imperial" ? `${formatNumber(cm / CM_PER_INCH, 1)} in` : `${formatNumber(cm, 1)} cm`;
}

/** How lengths and areas are entered and shown in each unit system. */
export function lengthIn(units: Units): { factor: number; suffix: string; area: string } {
  return units === "imperial" ? { factor: FOOT, suffix: "ft", area: "ft²" } : { factor: 1, suffix: "m", area: "m²" };
}

export function formatArea(m2: number, units: Units): string {
  const { factor, area } = lengthIn(units);
  const v = m2 / (factor * factor);
  return `${formatNumber(v, v < 10 ? 2 : 1)} ${area}`;
}

/** "1 bulk bag + 3 bags". */
export function planText(plan: Plan): string {
  const parts = [];
  if (plan.bulk) parts.push(plural(plan.bulk, "bulk bag"));
  if (plan.bags) parts.push(plural(plan.bags, "bag"));
  return parts.join(" + ") || "Nothing";
}

/** "1 × 750 L + 3 × 25 L". */
export function bagDetail(plan: Plan, s: Buying, unit: "L" | "kg"): string {
  return [plan.bulk ? `${plan.bulk} × ${formatNumber(s.bulk, 0)} ${unit}` : "", plan.bags ? `${plan.bags} × ${formatNumber(s.bag, 0)} ${unit}` : ""].filter(Boolean).join(" + ");
}

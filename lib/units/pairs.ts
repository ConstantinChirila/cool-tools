import { getCategory, getUnit, type Unit, type UnitCategory } from "@/lib/units/data";

/**
 * Curated conversions that get their own landing page under
 * /tools/unit-converter/<slug>. Titles use the words people search for
 * ("feet to cm"), not the formal unit names.
 */
export interface UnitPair {
  slug: string;
  title: string;
  category: string;
  from: string;
  to: string;
  /** Values shown in the quick-reference table. */
  table: readonly number[];
}

const STONES = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 20];
const KILOS = [40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 110, 120];
const SMALL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 25, 50, 100];
const DISTANCES = [1, 2, 3, 5, 10, 13.1, 20, 26.2, 30, 50, 100, 200, 500, 1000];
const TEMPS_C = [-40, -20, -10, 0, 5, 10, 15, 18, 20, 21, 25, 30, 35, 37, 40, 100];
const TEMPS_F = [-40, 0, 10, 20, 32, 40, 50, 60, 65, 70, 72, 75, 80, 90, 98.6, 100, 212];
const SPEEDS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 150];
const MPG = [20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 80, 90, 100];
const L100 = [3, 4, 5, 5.5, 6, 6.5, 7, 7.5, 8, 9, 10, 12, 15, 20];
const VOLUMES = [0.5, 1, 1.5, 2, 3, 4, 5, 10, 20, 25, 40, 50, 100];
const PACES = [3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 9, 10];

export const pairs: readonly UnitPair[] = [
  { slug: "stone-to-kg", title: "Stone to kg", category: "mass", from: "st", to: "kg", table: STONES },
  { slug: "kg-to-stone", title: "kg to stone", category: "mass", from: "kg", to: "st", table: KILOS },
  { slug: "lbs-to-kg", title: "lbs to kg", category: "mass", from: "lb", to: "kg", table: [1, 2, 5, 10, 20, 50, 100, 120, 140, 150, 160, 180, 200, 220, 250] },
  { slug: "kg-to-lbs", title: "kg to lbs", category: "mass", from: "kg", to: "lb", table: KILOS },
  { slug: "oz-to-grams", title: "oz to grams", category: "mass", from: "oz", to: "g", table: SMALL },
  { slug: "grams-to-oz", title: "Grams to oz", category: "mass", from: "g", to: "oz", table: [10, 25, 50, 75, 100, 125, 150, 200, 250, 300, 400, 500, 750, 1000] },
  { slug: "feet-to-cm", title: "Feet to cm", category: "length", from: "ft", to: "cm", table: [1, 2, 3, 4, 5, 5.5, 6, 6.5, 7, 8, 10, 12, 20, 50] },
  { slug: "cm-to-feet", title: "cm to feet", category: "length", from: "cm", to: "ft", table: [100, 120, 140, 150, 155, 160, 165, 170, 175, 180, 185, 190, 195, 200] },
  { slug: "inches-to-cm", title: "Inches to cm", category: "length", from: "in", to: "cm", table: SMALL },
  { slug: "cm-to-inches", title: "cm to inches", category: "length", from: "cm", to: "in", table: SMALL },
  { slug: "feet-to-metres", title: "Feet to metres", category: "length", from: "ft", to: "m", table: SMALL },
  { slug: "metres-to-feet", title: "Metres to feet", category: "length", from: "m", to: "ft", table: SMALL },
  { slug: "miles-to-km", title: "Miles to km", category: "length", from: "mi", to: "km", table: DISTANCES },
  { slug: "km-to-miles", title: "km to miles", category: "length", from: "km", to: "mi", table: DISTANCES },
  { slug: "yards-to-metres", title: "Yards to metres", category: "length", from: "yd", to: "m", table: SMALL },
  { slug: "celsius-to-fahrenheit", title: "Celsius to Fahrenheit", category: "temp", from: "c", to: "f", table: TEMPS_C },
  { slug: "fahrenheit-to-celsius", title: "Fahrenheit to Celsius", category: "temp", from: "f", to: "c", table: TEMPS_F },
  { slug: "mph-to-kmh", title: "mph to km/h", category: "speed", from: "mph", to: "kmh", table: SPEEDS },
  { slug: "kmh-to-mph", title: "km/h to mph", category: "speed", from: "kmh", to: "mph", table: SPEEDS },
  { slug: "knots-to-mph", title: "Knots to mph", category: "speed", from: "kn", to: "mph", table: SPEEDS },
  { slug: "min-per-km-to-min-per-mile", title: "min/km to min/mile", category: "speed", from: "minkm", to: "minmi", table: PACES },
  { slug: "min-per-km-to-kmh", title: "min/km to km/h", category: "speed", from: "minkm", to: "kmh", table: PACES },
  { slug: "mpg-to-l-per-100km", title: "mpg to L/100km", category: "fuel", from: "mpg_uk", to: "l100km", table: MPG },
  { slug: "l-per-100km-to-mpg", title: "L/100km to mpg", category: "fuel", from: "l100km", to: "mpg_uk", table: L100 },
  { slug: "us-mpg-to-l-per-100km", title: "US mpg to L/100km", category: "fuel", from: "mpg_us", to: "l100km", table: MPG },
  { slug: "uk-mpg-to-us-mpg", title: "UK mpg to US mpg", category: "fuel", from: "mpg_uk", to: "mpg_us", table: MPG },
  { slug: "litres-to-gallons", title: "Litres to gallons", category: "volume", from: "l", to: "gal_uk", table: VOLUMES },
  { slug: "gallons-to-litres", title: "Gallons to litres", category: "volume", from: "gal_uk", to: "l", table: VOLUMES },
  { slug: "us-gallons-to-litres", title: "US gallons to litres", category: "volume", from: "gal_us", to: "l", table: VOLUMES },
  { slug: "pints-to-ml", title: "Pints to ml", category: "volume", from: "pt_uk", to: "ml", table: [0.25, 0.5, 1, 1.5, 2, 3, 4, 5, 8, 10] },
  { slug: "ml-to-fl-oz", title: "ml to fl oz", category: "volume", from: "ml", to: "floz_uk", table: [5, 10, 15, 25, 30, 50, 75, 100, 125, 150, 200, 250, 330, 500, 568, 750, 1000] },
  { slug: "cups-to-ml", title: "Cups to ml", category: "volume", from: "cup_us", to: "ml", table: [0.25, 0.33, 0.5, 0.67, 0.75, 1, 1.5, 2, 3, 4] },
  { slug: "acres-to-hectares", title: "Acres to hectares", category: "area", from: "acre", to: "ha", table: SMALL },
  { slug: "hectares-to-acres", title: "Hectares to acres", category: "area", from: "ha", to: "acre", table: SMALL },
  { slug: "square-feet-to-square-metres", title: "Square feet to square metres", category: "area", from: "sqft", to: "m2", table: [100, 200, 300, 400, 500, 600, 700, 800, 1000, 1200, 1500, 2000, 2500, 3000] },
  { slug: "square-metres-to-square-feet", title: "Square metres to square feet", category: "area", from: "m2", to: "sqft", table: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 120, 150, 200, 250] },
  { slug: "psi-to-bar", title: "psi to bar", category: "pressure", from: "psi", to: "bar", table: [10, 15, 20, 25, 30, 32, 35, 36, 40, 45, 50, 60, 80, 100] },
  { slug: "bar-to-psi", title: "Bar to psi", category: "pressure", from: "bar", to: "psi", table: [0.5, 1, 1.5, 2, 2.2, 2.4, 2.5, 3, 4, 5, 6, 8, 10] },
  { slug: "kcal-to-kj", title: "kcal to kJ", category: "energy", from: "kcal", to: "kj", table: [50, 100, 150, 200, 250, 300, 400, 500, 750, 1000, 1500, 2000, 2500] },
  { slug: "kj-to-kcal", title: "kJ to kcal", category: "energy", from: "kj", to: "kcal", table: [100, 200, 300, 400, 500, 750, 1000, 1500, 2000, 4000, 8400, 10000] },
  { slug: "hp-to-kw", title: "hp to kW", category: "power", from: "hp", to: "kw", table: [50, 75, 100, 120, 150, 180, 200, 250, 300, 400, 500, 600] },
  { slug: "kw-to-hp", title: "kW to hp", category: "power", from: "kw", to: "hp", table: [50, 75, 100, 110, 130, 150, 180, 200, 250, 300, 400, 500] },
  { slug: "gb-to-gib", title: "GB to GiB", category: "data", from: "gb", to: "gib", table: [1, 8, 16, 32, 64, 128, 250, 256, 500, 512, 1000, 2000, 4000] },
  { slug: "mbps-to-mbs", title: "Mbps to MB/s", category: "datarate", from: "mbps", to: "mbs", table: [1, 5, 10, 20, 50, 100, 200, 300, 500, 900, 1000, 2000] },
  { slug: "mg-dl-to-mmol-l", title: "mg/dL to mmol/L (glucose)", category: "glucose", from: "mgdl", to: "mmoll", table: [50, 60, 70, 80, 90, 100, 110, 120, 126, 140, 160, 180, 200, 250, 300] },
];

export interface ResolvedPair extends UnitPair {
  categoryData: UnitCategory;
  fromUnit: Unit;
  toUnit: Unit;
}

export function resolvePair(pair: UnitPair): ResolvedPair {
  const categoryData = getCategory(pair.category);
  const fromUnit = categoryData && getUnit(categoryData, pair.from);
  const toUnit = categoryData && getUnit(categoryData, pair.to);
  if (!categoryData || !fromUnit || !toUnit) {
    throw new Error(`Unit pair "${pair.slug}" refers to unknown units`);
  }
  return { ...pair, categoryData, fromUnit, toUnit };
}

export function getPair(slug: string): UnitPair | undefined {
  return pairs.find((p) => p.slug === slug);
}

/** The same conversion the other way round, when it has a page. */
export function reversePair(pair: UnitPair): UnitPair | undefined {
  return pairs.find((p) => p.category === pair.category && p.from === pair.to && p.to === pair.from);
}

export function pairPath(pair: UnitPair): string {
  return `/tools/unit-converter/${pair.slug}`;
}

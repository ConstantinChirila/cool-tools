/**
 * Solar yield for a spread of UK places: kWh a year per kWp of panels on a
 * south-facing roof pitched at 35°, with the usual 14% system losses, from
 * the EU's PVGIS tool (API v5.3, SARAH3 data), run 2026-10-01:
 * re.jrc.ec.europa.eu/api/v5_3/PVcalc?lat=…&lon=…&peakpower=1&loss=14&angle=35&aspect=0
 */

export interface SolarPlace {
  id: string;
  name: string;
  /** kWh per kWp a year, south-facing at 35°. */
  yield: number;
  /** Which month-by-month shape the year follows. */
  shape: "south" | "north";
}

export const SOLAR_PLACES = [
  { id: "london", name: "London", yield: 1019, shape: "south" },
  { id: "cambridge", name: "Cambridge and East Anglia", yield: 1041, shape: "south" },
  { id: "bristol", name: "Bristol and the South West", yield: 1023, shape: "south" },
  { id: "plymouth", name: "Plymouth and Cornwall", yield: 1122, shape: "south" },
  { id: "cardiff", name: "Cardiff and South Wales", yield: 1042, shape: "south" },
  { id: "birmingham", name: "Birmingham and the Midlands", yield: 968, shape: "south" },
  { id: "manchester", name: "Manchester and the North West", yield: 886, shape: "south" },
  { id: "leeds", name: "Leeds and Yorkshire", yield: 947, shape: "south" },
  { id: "newcastle", name: "Newcastle and the North East", yield: 947, shape: "north" },
  { id: "belfast", name: "Belfast and Northern Ireland", yield: 919, shape: "north" },
  { id: "glasgow", name: "Glasgow and the West of Scotland", yield: 853, shape: "north" },
  { id: "edinburgh", name: "Edinburgh and the East of Scotland", yield: 903, shape: "north" },
  { id: "aberdeen", name: "Aberdeen and the North East of Scotland", yield: 887, shape: "north" },
  { id: "inverness", name: "Inverness and the Highlands", yield: 810, shape: "north" },
] as const satisfies readonly SolarPlace[];

export type SolarPlaceId = (typeof SOLAR_PLACES)[number]["id"];

/**
 * kWh each month brings per kWp, January first, from the same PVGIS runs for
 * London and Glasgow. The engine uses the shares: a northern year is more
 * bunched into summer. December gives a tenth of what June does.
 */
export const MONTH_SHAPE: Record<SolarPlace["shape"], readonly number[]> = {
  south: [40.71, 53.19, 86.55, 114.55, 119.45, 122.59, 123.21, 110.37, 95.22, 68.51, 48.18, 36.33],
  north: [23.9, 40.4, 72.2, 102.9, 115.8, 110.0, 111.0, 96.8, 75.1, 52.3, 33.3, 19.4],
};

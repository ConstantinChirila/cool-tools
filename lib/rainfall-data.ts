/**
 * Met Office 1991–2020 climate averages for a spread of UK places: rain in
 * mm for each month and the year, and the average number of days each month
 * with 1 mm of rain or more. Fetched 2026-10-01 from the Met Office
 * location-specific long-term averages pages
 * (metoffice.gov.uk/research/climate/maps-and-data/location-specific-long-term-averages/<geohash>);
 * the station is named where it isn't the town itself.
 */

export interface Place {
  id: string;
  name: string;
  /** Met Office station and geohash, for checking. */
  station: string;
  /** mm a year. */
  annual: number;
  /** mm, January first. */
  monthly: readonly number[];
  /** Days with 1 mm or more, January first. */
  rainDays: readonly number[];
}

export const PLACES = [
  {
    id: "london",
    name: "London",
    station: "Heathrow gcpsvg3nc",
    annual: 615,
    monthly: [58.83, 44.96, 38.78, 42.31, 45.91, 47.25, 45.8, 52.78, 49.61, 65.07, 66.63, 57.05],
    rainDays: [11.53, 9.5, 8.47, 8.8, 8.0, 8.33, 7.9, 8.43, 7.9, 10.8, 11.23, 10.77],
  },
  {
    id: "surrey",
    name: "Surrey and Sussex",
    station: "Charlwood gcpfgzz2b",
    annual: 834,
    monthly: [90.34, 64.46, 53.65, 52.49, 54.83, 50.67, 54.73, 60.42, 64.71, 94.33, 97.11, 95.95],
    rainDays: [13.1, 10.86, 9.44, 9.73, 8.9, 8.79, 8.45, 9.29, 9.15, 12.51, 13.17, 12.82],
  },
  {
    id: "oxford",
    name: "Oxfordshire",
    station: "Brize Norton gcnvkkdfw",
    annual: 706,
    monthly: [66.23, 48.13, 46.42, 49.18, 60.12, 49.8, 55.09, 58.62, 54.21, 70.86, 73.17, 74.21],
    rainDays: [12.33, 9.63, 9.33, 9.9, 9.53, 8.7, 8.37, 10.1, 8.93, 11.43, 12.8, 12.33],
  },
  {
    id: "cambridge",
    name: "Cambridge",
    station: "Cambridge NIAB u1214qgj0",
    annual: 559,
    monthly: [48.62, 35.72, 32.87, 37.56, 43.21, 49.11, 48.27, 55.86, 47.61, 58.71, 52.63, 49.2],
    rainDays: [10.4, 8.67, 8.13, 8.03, 7.33, 8.73, 8.4, 9.03, 7.97, 9.57, 10.43, 10.47],
  },
  {
    id: "plymouth",
    name: "Plymouth",
    station: "Mount Batten gbvn6nxjm",
    annual: 1038,
    monthly: [109.57, 87.69, 76.15, 68.52, 60.09, 64.43, 63.54, 80.28, 72.27, 112.1, 117.8, 125.24],
    rainDays: [15.37, 12.73, 12.27, 10.97, 9.83, 9.73, 9.97, 11.3, 10.1, 14.8, 15.87, 15.7],
  },
  {
    id: "birmingham",
    name: "Birmingham",
    station: "Coleshill gcqf2sb4e",
    annual: 708,
    monthly: [63.62, 46.95, 46.58, 48.1, 53.83, 64.88, 52.94, 66.17, 58.09, 72.78, 69.58, 64.7],
    rainDays: [12.43, 9.83, 9.94, 10.13, 9.76, 9.55, 8.95, 10.51, 9.64, 11.63, 13.04, 11.71],
  },
  {
    id: "peak",
    name: "Peak District edge",
    station: "Leek Thorncliffe gcqw4zwjn",
    annual: 975,
    monthly: [87.46, 72.6, 66.62, 59.72, 68.43, 76.5, 82.51, 82.61, 81.72, 97.53, 97.98, 101.06],
    rainDays: [14.79, 13.25, 12.48, 11.47, 10.92, 12.28, 12.63, 13.12, 12.05, 14.99, 15.89, 15.55],
  },
  {
    id: "manchester",
    name: "Manchester",
    station: "Woodford gcqrqyr80",
    annual: 868,
    monthly: [77.0, 60.48, 52.53, 55.81, 56.21, 64.61, 80.19, 79.73, 76.09, 91.69, 77.08, 96.98],
    rainDays: [14.73, 12.21, 11.81, 10.96, 10.84, 11.96, 13.17, 13.6, 11.96, 14.51, 15.04, 15.7],
  },
  {
    id: "north-east",
    name: "Durham and Newcastle",
    station: "Durham gcwzefp2c",
    annual: 676,
    monthly: [51.76, 44.6, 41.06, 51.22, 44.37, 61.03, 60.9, 66.45, 56.93, 63.36, 72.95, 61.02],
    rainDays: [11.78, 9.9, 8.63, 9.13, 8.6, 9.93, 10.7, 10.29, 9.4, 11.77, 12.01, 12.0],
  },
  {
    id: "cardiff",
    name: "Cardiff",
    station: "Bute Park gcjszmp44",
    annual: 1203,
    monthly: [126.97, 92.97, 85.29, 72.07, 78.45, 73.54, 83.58, 104.82, 86.31, 129.05, 130.65, 139.58],
    rainDays: [15.6, 12.0, 12.29, 10.73, 11.17, 10.37, 11.23, 12.4, 11.8, 15.03, 15.6, 15.17],
  },
  {
    id: "edinburgh",
    name: "Edinburgh",
    station: "Gogarbank gcvw5vmsn",
    annual: 784,
    monthly: [73.01, 61.07, 52.49, 45.87, 50.17, 68.77, 71.85, 74.71, 55.17, 82.66, 73.65, 74.87],
    rainDays: [13.3, 10.7, 10.28, 9.21, 10.76, 11.14, 11.39, 11.17, 10.54, 13.0, 12.86, 13.08],
  },
  {
    id: "glasgow",
    name: "Glasgow",
    station: "Paisley gcuvdyxy0",
    annual: 1263,
    monthly: [146.37, 115.24, 97.41, 66.13, 68.78, 67.83, 82.85, 94.82, 98.4, 131.82, 131.82, 161.36],
    rainDays: [17.71, 14.74, 13.75, 12.34, 12.11, 12.14, 13.25, 13.94, 13.92, 16.24, 17.26, 16.94],
  },
  {
    id: "belfast",
    name: "Belfast",
    station: "Aldergrove gcewfr7bf",
    annual: 872,
    monthly: [76.98, 63.34, 60.59, 55.62, 55.86, 68.02, 78.79, 84.46, 69.23, 88.01, 87.66, 83.47],
    rainDays: [14.65, 13.18, 13.0, 11.97, 11.57, 11.87, 14.07, 14.17, 12.1, 13.97, 15.47, 15.23],
  },
] as const satisfies readonly Place[];

export type PlaceId = (typeof PLACES)[number]["id"];

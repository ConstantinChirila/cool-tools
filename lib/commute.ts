/**
 * Commute time and cost over a year. Pure functions; the UI in
 * components/tools/commute-calculator.tsx only formats what comes out.
 */

/** Working days in a standard 5-day year (52 weeks x 5). */
export const WORKING_DAYS_PER_YEAR = 260;
/** Weeks used to turn a weekly figure into a yearly one. */
export const WEEKS_PER_YEAR = 52;
/** Length of a working day, for the "working days" equivalent. */
export const WORK_HOURS_PER_DAY = 8;
/** Length of a working week, for the "working weeks" equivalent. */
export const WORK_HOURS_PER_WEEK = 40;

export interface CommuteInputs {
  /** Door to door, one way, in minutes. */
  outboundMinutes: number;
  /** Door to door on the way back. Usually the same as outbound. */
  returnMinutes: number;
  /** Days per week you actually make the trip (0-7). */
  daysPerWeek: number;
  /**
   * Annual leave plus bank holidays and typical sick days, counted in
   * 5-day-week working days (the way UK leave is quoted). Scaled to the
   * number of commuting days so 28 days off on a 3-day-a-week commute
   * removes 3/5 of 28 commuting days, not all 28.
   */
  daysOffPerYear: number;
}

export interface CommuteTime {
  /** Round trip, in minutes. */
  dailyMinutes: number;
  /** Trips actually made in a year after days off. May be fractional. */
  commutingDaysPerYear: number;
  minutesPerYear: number;
  hoursPerYear: number;
  /** Hours in a typical commuting week, before days off. */
  hoursPerWeek: number;
  /** Yearly hours spread evenly over 12 months. */
  hoursPerMonth: number;
  /** Yearly hours as full 24-hour days. */
  fullDays: number;
  /** Yearly hours as 8-hour working days. */
  workingDays: number;
  /** Yearly hours as 40-hour working weeks. */
  workingWeeks: number;
}

export function commutingDaysPerYear(daysPerWeek: number, daysOffPerYear: number): number {
  const scheduled = daysPerWeek * WEEKS_PER_YEAR;
  const off = daysOffPerYear * (daysPerWeek / 5);
  return Math.max(0, scheduled - off);
}

export function calculateCommuteTime(inputs: CommuteInputs): CommuteTime {
  const dailyMinutes = Math.max(0, inputs.outboundMinutes) + Math.max(0, inputs.returnMinutes);
  const days = commutingDaysPerYear(inputs.daysPerWeek, inputs.daysOffPerYear);
  const minutesPerYear = dailyMinutes * days;
  const hoursPerYear = minutesPerYear / 60;
  return {
    dailyMinutes,
    commutingDaysPerYear: days,
    minutesPerYear,
    hoursPerYear,
    hoursPerWeek: (dailyMinutes * inputs.daysPerWeek) / 60,
    hoursPerMonth: hoursPerYear / 12,
    fullDays: hoursPerYear / 24,
    workingDays: hoursPerYear / WORK_HOURS_PER_DAY,
    workingWeeks: hoursPerYear / WORK_HOURS_PER_WEEK,
  };
}

export type CostMode = "perDay" | "monthly";

export interface CommuteCostInputs {
  mode: CostMode;
  /** Return fare, fuel, parking: everything one commuting day costs. */
  perDay: number;
  /** Season ticket or monthly pass, charged whether or not you travel. */
  monthly: number;
}

export interface CommuteCost {
  perYear: number;
  perMonth: number;
  /** Effective cost of one commuting day (a monthly pass spread over trips). */
  perTrip: number;
}

export function calculateCommuteCost(
  cost: CommuteCostInputs,
  commutingDays: number,
): CommuteCost {
  if (cost.mode === "monthly") {
    const perYear = Math.max(0, cost.monthly) * 12;
    return {
      perYear,
      perMonth: perYear / 12,
      perTrip: commutingDays > 0 ? perYear / commutingDays : 0,
    };
  }
  const perTrip = Math.max(0, cost.perDay);
  const perYear = perTrip * commutingDays;
  return { perYear, perMonth: perYear / 12, perTrip };
}

/**
 * The same commute with some days moved to home working. A monthly pass
 * costs the same however often it is used, so cost only drops in per-day
 * mode.
 */
export interface HybridComparison {
  wfhDaysPerWeek: number;
  time: CommuteTime;
  hoursSavedPerYear: number;
  fullDaysSaved: number;
  costSavedPerYear: number;
}

export function compareHybrid(
  inputs: CommuteInputs,
  wfhDaysPerWeek: number,
  cost?: CommuteCostInputs,
): HybridComparison {
  const wfh = Math.min(Math.max(0, wfhDaysPerWeek), inputs.daysPerWeek);
  const base = calculateCommuteTime(inputs);
  const time = calculateCommuteTime({ ...inputs, daysPerWeek: inputs.daysPerWeek - wfh });
  const hoursSaved = base.hoursPerYear - time.hoursPerYear;
  let costSaved = 0;
  if (cost && cost.mode === "perDay") {
    costSaved =
      calculateCommuteCost(cost, base.commutingDaysPerYear).perYear -
      calculateCommuteCost(cost, time.commutingDaysPerYear).perYear;
  }
  return {
    wfhDaysPerWeek: wfh,
    time,
    hoursSavedPerYear: hoursSaved,
    fullDaysSaved: hoursSaved / 24,
    costSavedPerYear: costSaved,
  };
}

/** Things a year of commuting adds up to. Durations are approximate. */
export interface Equivalent {
  key: string;
  /** Hours the unit takes. */
  hours: number;
  singular: string;
  plural: string;
  note: string;
}

export const EQUIVALENTS: Equivalent[] = [
  {
    key: "lotr",
    hours: 11.4,
    singular: "Lord of the Rings marathon",
    plural: "Lord of the Rings marathons",
    note: "All three extended editions back to back, about 11 h 20 m",
  },
  {
    key: "sleep",
    hours: 8,
    singular: "full night's sleep",
    plural: "full nights' sleep",
    note: "At eight hours a night",
  },
  {
    key: "sydney",
    hours: 22,
    singular: "flight from London to Sydney",
    plural: "flights from London to Sydney",
    note: "Around 22 hours with one stop",
  },
];

export function equivalentCount(hoursPerYear: number, eq: Equivalent): number {
  return hoursPerYear / eq.hours;
}

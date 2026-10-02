import { describe, expect, it } from "vitest";
import { FIELD_BY_KEY, describeCron, describeField, fieldMode, fieldToken, nextRuns, parseCron, replaceField, type CronSchedule } from "@/lib/cron";

function parse(expr: string): CronSchedule {
  const r = parseCron(expr);
  if (!r.ok) throw new Error(r.error);
  return r.value;
}

function error(expr: string): string {
  const r = parseCron(expr);
  if (r.ok) throw new Error(`expected "${expr}" to fail`);
  return r.error;
}

const utc = (y: number, mo: number, d: number, h = 0, mi = 0) => Date.UTC(y, mo - 1, d, h, mi);

describe("parseCron", () => {
  it("expands every form of field", () => {
    const s = parse("*/15 9-17 1,15 JAN-MAR,dec MON-FRI");
    expect(s.fields.minute.values).toEqual([0, 15, 30, 45]);
    expect(s.fields.hour.values).toEqual([9, 10, 11, 12, 13, 14, 15, 16, 17]);
    expect(s.fields.dom.values).toEqual([1, 15]);
    expect(s.fields.month.values).toEqual([1, 2, 3, 12]);
    expect(s.fields.dow.values).toEqual([1, 2, 3, 4, 5]);
    expect(s.fields.minute.star).toBe(true);
    expect(s.fields.hour.star).toBe(false);
  });

  it("treats 7 as Sunday, including at the end of a range", () => {
    expect(parse("* * * * 7").fields.dow.values).toEqual([0]);
    expect(parse("* * * * 5-7").fields.dow.values).toEqual([0, 5, 6]);
  });

  it("reads Vixie's value/step as value-to-end", () => {
    expect(parse("5/15 * * * *").fields.minute.values).toEqual([5, 20, 35, 50]);
    expect(parse("* 1-23/6 * * *").fields.hour.values).toEqual([1, 7, 13, 19]);
  });

  it("expands nicknames and ignores extra whitespace", () => {
    expect(parse("@daily").expression).toBe("0 0 * * *");
    expect(parse("  0   0 *  * 0 ").expression).toBe("0 0 * * 0");
    expect(parse("@WEEKLY").expression).toBe("0 0 * * 0");
  });

  it("rejects what standard cron cannot say", () => {
    expect(error("")).toMatch(/Type a cron/);
    expect(error("* * * *")).toMatch(/Expected 5 fields.*got 4/);
    expect(error("0 0 12 * * ?")).toMatch(/six or seven fields/);
    expect(error("0 0 ? * MON")).toMatch(/Quartz/);
    expect(error("0 0 L * *")).toMatch(/L, W or #/);
    expect(error("60 * * * *")).toBe("Minute must be 0-59, got 60");
    expect(error("* * 0 * *")).toBe("Day of month must be 1-31, got 0");
    expect(error("*/0 * * * *")).toMatch(/Step in minute/);
    expect(error("10-5 * * * *")).toMatch(/runs backwards/);
    expect(error("* * * FOO *")).toMatch(/not a month name/);
    expect(error("1,,2 * * * *")).toMatch(/empty entry/);
    expect(error("@reboot")).toMatch(/no schedule/);
    expect(error("@fortnightly")).toMatch(/Unknown nickname/);
  });

  it("does not mistake month names for Quartz letters", () => {
    expect(parse("0 0 1 JUL *").fields.month.values).toEqual([7]);
  });
});

describe("builder helpers", () => {
  it("classifies fields", () => {
    const s = parse("* */5 1,15 1-6 1-5/2");
    expect(fieldMode(s.fields.minute)).toBe("any");
    expect(fieldMode(s.fields.hour)).toBe("step");
    expect(fieldMode(s.fields.dom)).toBe("specific");
    expect(fieldMode(s.fields.month)).toBe("range");
    expect(fieldMode(s.fields.dow)).toBe("custom");
    expect(fieldMode(parse("5 * * * *").fields.minute)).toBe("specific");
    expect(fieldMode(parse("1,*/10 * * * *").fields.minute)).toBe("custom");
  });

  it("writes tokens and swaps one field", () => {
    const minute = FIELD_BY_KEY.minute;
    expect(fieldToken(minute, "any", {})).toBe("*");
    expect(fieldToken(minute, "step", { step: 15 })).toBe("*/15");
    expect(fieldToken(minute, "range", { from: 10, to: 5 })).toBe("10-10");
    expect(fieldToken(minute, "specific", { values: [30, 0, 30, 99] })).toBe("0,30");
    expect(fieldToken(minute, "specific", { values: [] })).toBe("*");
    expect(replaceField("0 9 * * 1-5", "dow", "*")).toBe("0 9 * * *");
    expect(replaceField("0 9 * * 1-5", "minute", "*/5")).toBe("*/5 9 * * 1-5");
  });
});

describe("describeCron", () => {
  const cases: [string, string][] = [
    ["* * * * *", "Every minute"],
    ["*/5 * * * *", "Every 5 minutes"],
    ["0 * * * *", "At minute 0 past every hour"],
    ["0,30 * * * *", "At minute 0 and 30 past every hour"],
    ["0 0 * * *", "At 00:00"],
    ["30 9 * * 1-5", "At 09:30 on Monday through Friday"],
    ["0 9,17 * * *", "At 09:00 and 17:00"],
    ["0,30 9,17 * * *", "At minute 0 and 30 past hours 9 and 17"],
    ["*/15 9-17 * * *", "Every 15 minutes between 09:00 and 17:59"],
    ["* 9 * * *", "Every minute past hour 9"],
    ["0 */2 * * *", "At minute 0 past every 2nd hour"],
    ["0-15 * * * *", "Every minute from 0 through 15 past every hour"],
    ["0 0 1 * *", "At 00:00 on the 1st of the month"],
    ["0 0 1,15 * *", "At 00:00 on the 1st and 15th of the month"],
    ["0 0 */2 * *", "At 00:00 every 2nd day of the month"],
    ["0 0 1 1 *", "At 00:00 on the 1st of the month in January"],
    ["0 0 * JAN-MAR *", "At 00:00 in January through March"],
    ["0 0 * */3 *", "At 00:00 every 3rd month"],
    ["0 0 * * 0", "At 00:00 on Sunday"],
    ["0 0 * * 1,3,5", "At 00:00 on Monday, Wednesday and Friday"],
    ["0 0 1 * 1", "At 00:00 on the 1st of the month or on Monday"],
    ["0 0 */2 * 1", "At 00:00 every 2nd day of the month and on Monday"],
    ["1,15-20,*/10 * * * *", "At minute 1, 15 through 20 and every 10th minute past every hour"],
    ["0 0 * * 1-5/2", "At 00:00 on every 2nd day of the week from Monday through Friday"],
  ];
  it.each(cases)("%s → %s", (expr, text) => {
    expect(describeCron(parse(expr))).toBe(text);
  });

  it("summarises single fields", () => {
    const s = parse("*/5 9-17 1,15 * 1-5");
    expect(describeField(s.fields.minute, "minute")).toBe("Every 5th minute");
    expect(describeField(s.fields.hour, "hour")).toBe("9 through 17");
    expect(describeField(s.fields.dom, "dom")).toBe("The 1st and 15th of the month");
    expect(describeField(s.fields.month, "month")).toBe("Every month");
    expect(describeField(s.fields.dow, "dow")).toBe("Monday through Friday");
  });
});

describe("nextRuns", () => {
  it("finds simple runs in UTC", () => {
    // Thursday 1 Jan 2026 10:07 UTC.
    const from = utc(2026, 1, 1, 10, 7);
    expect(nextRuns(parse("*/15 * * * *"), from, 3, "UTC")).toEqual([utc(2026, 1, 1, 10, 15), utc(2026, 1, 1, 10, 30), utc(2026, 1, 1, 10, 45)]);
    expect(nextRuns(parse("30 9 * * 1-5"), from, 2, "UTC")).toEqual([utc(2026, 1, 2, 9, 30), utc(2026, 1, 5, 9, 30)]);
    expect(nextRuns(parse("0 0 29 2 *"), from, 1, "UTC")).toEqual([utc(2028, 2, 29)]);
  });

  it("is strictly after the start minute", () => {
    const from = utc(2026, 1, 1, 10, 0);
    expect(nextRuns(parse("0 10 * * *"), from, 1, "UTC")).toEqual([utc(2026, 1, 2, 10, 0)]);
    expect(nextRuns(parse("0 10 * * *"), from - 1, 1, "UTC")).toEqual([from]);
  });

  it("ORs day-of-month and day-of-week when both are restricted, ANDs with a star", () => {
    const from = utc(2026, 1, 1); // Thursday
    // 1st of month or Monday: Mon 5 Jan comes before Sun 1 Feb.
    expect(nextRuns(parse("0 0 1 * 1"), from, 2, "UTC")).toEqual([utc(2026, 1, 5), utc(2026, 1, 12)]);
    // Every day that is both odd-numbered and a Monday.
    expect(nextRuns(parse("0 0 */2 * 1"), from, 2, "UTC")).toEqual([utc(2026, 1, 5), utc(2026, 1, 19)]);
  });

  it("gives up on dates that never come", () => {
    expect(nextRuns(parse("0 0 30 2 *"), utc(2026, 1, 1), 1, "UTC")).toEqual([]);
  });

  it("reads the fields as local time in the zone", () => {
    // 09:00 London in summer is 08:00 UTC; in winter 09:00 UTC.
    expect(nextRuns(parse("0 9 * * *"), utc(2026, 7, 1), 1, "Europe/London")).toEqual([utc(2026, 7, 1, 8)]);
    expect(nextRuns(parse("0 9 * * *"), utc(2026, 1, 1), 1, "Europe/London")).toEqual([utc(2026, 1, 1, 9)]);
    expect(nextRuns(parse("0 9 * * *"), utc(2026, 1, 1), 1, "America/New_York")).toEqual([utc(2026, 1, 1, 14)]);
    expect(nextRuns(parse("30 18 * * *"), utc(2026, 1, 1), 1, "Asia/Kolkata")).toEqual([utc(2026, 1, 1, 13)]);
  });

  it("skips the hour lost when clocks go forward and runs once when they go back", () => {
    // London: 29 Mar 2026 01:00 UTC clocks jump 01:00 → 02:00 local. 01:30 local never happens.
    const spring = nextRuns(parse("30 1 * * *"), utc(2026, 3, 28, 12), 2, "Europe/London");
    expect(spring).toEqual([utc(2026, 3, 30, 0, 30), utc(2026, 3, 31, 0, 30)]);
    // 25 Oct 2026: 01:00 UTC clocks fall back 02:00 → 01:00 local, so 01:30 local happens twice; the first is 00:30 UTC.
    const autumn = nextRuns(parse("30 1 * * *"), utc(2026, 10, 24, 12), 2, "Europe/London");
    expect(autumn).toEqual([utc(2026, 10, 25, 0, 30), utc(2026, 10, 26, 1, 30)]);
  });
});

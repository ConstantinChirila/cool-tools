import type { ToolContent } from "@/lib/tool-content";

export const content: ToolContent = {
  intro: [
    "Most of us know our commute in minutes and never in years. This calculator turns a one-way journey time, the days you travel in, and your days off into the total hours and full days a year, then shows what working from home a few days a week would give back.",
    "Switch on the cost section to add fares, fuel and parking or a season ticket, and pick a horizon to see what the same commute adds up to over 10, 20 or 40 years.",
  ],
  sections: [
    {
      heading: "How the yearly commute is worked out",
      paragraphs: [
        "The maths is deliberately simple so you can check it. Your round trip is the outbound time plus the return time (the same figure twice unless you say otherwise). Trips a year is the days you travel in each week times 52, minus your days off. Time a year is the round trip times the trips.",
        "Days off are quoted the way UK leave is quoted, in 5-day-week working days, and scaled to your commuting pattern. If you travel in 3 days a week, a 28-day holiday allowance only removes 3/5 of 28 trips, because some of those days off would have fallen on home-working days anyway.",
      ],
      bullets: [
        "**Round trip** = there + back, in minutes",
        "**Trips a year** = days a week x 52 - days off x (days a week ÷ 5)",
        "**Hours a year** = round trip x trips a year ÷ 60",
        "**Full days** divide by 24; **working days** divide by 8; **working weeks** divide by 40",
      ],
    },
    {
      heading: "What to count as commute time",
      paragraphs: [
        "Use door to door, not timetable to timetable. Walking to the station, waiting on the platform, finding a parking space and the walk into the building are all time you would not spend if you did not have to travel, and they add up to more than most people expect.",
        "If the way home is reliably slower, because of evening traffic or a worse connection, turn on the separate return time rather than averaging. Twenty minutes extra each evening is over 75 hours a year on a 5-day pattern.",
      ],
    },
    {
      heading: "Hybrid working: how much time you get back",
      paragraphs: [
        "The home-working row reruns the same calculation with fewer days a week and shows the difference. Because the yearly total scales with days travelled, every day a week you stay home saves the same share of the total: two days out of five gives back 40% of your commuting time.",
        "For a typical 45 minute each way, 5-day commute with 28 days off, that is 348 hours a year, and two home days return 139 of them, close to six full days. The time is only a saving if you use it, but it is a fair figure to have in front of you when weighing up a hybrid role or negotiating a pattern.",
      ],
    },
    {
      heading: "What commuting costs",
      paragraphs: [
        "Choose per day if you buy tickets on the day, drive, or pay for parking: enter everything a single day in costs and the calculator multiplies it by the trips you actually make. Choose monthly pass for a season ticket or a travel pass, which is charged whether you travel or not and is simply multiplied by 12.",
        "That difference matters for hybrid working. Per-day costs fall in step with the days you stay home, while a monthly pass does not, which is why the home-working saving only shows a cost figure in per-day mode. If you have moved to two or three office days, compare the yearly figure for your pass against paying daily; in England, flexi season tickets covering 8 days in 28 exist for exactly this pattern.",
      ],
    },
    {
      heading: "How does your commute compare?",
      paragraphs: [
        "Surveys of UK workers generally put the average daily round trip at about an hour, with London and the South East noticeably higher and small towns lower. At an hour a day on a 5-day pattern with 28 days off, that is about 232 hours a year, or just under ten full days.",
        "A commute over an hour and a half each way is in the top few percent nationally. If your yearly total surprises you, the equivalents at the bottom of the calculator (film marathons, nights of sleep, long-haul flights) are there to make the number concrete rather than to make a point.",
      ],
    },
    {
      heading: "Worked example",
      paragraphs: [
        "Take 45 minutes each way, 5 days a week, 28 days off. The round trip is 90 minutes. Trips a year are 5 x 52 - 28 = 232. Time a year is 90 x 232 ÷ 60 = 348 hours, which is 14.5 full days, 43.5 working days or 8.7 working weeks.",
        "Add a cost of 12 a day and the year costs 2,784. Work from home two days a week and the trips fall to 139.2, saving 139.2 hours and 1,113.60 a year. Over 10 years at the original pattern, that commute is 3,480 hours, or 145 full days.",
      ],
    },
  ],
  faqs: [
    {
      question: "How many hours a year do people spend commuting?",
      answer:
        "It depends on the journey and the pattern. An hour a day round trip, five days a week with 28 days off, is about 232 hours a year. Ninety minutes a day on the same pattern is 348 hours, nearly 15 full days.",
    },
    {
      question: "Why does the calculator use 260 working days and 28 days off?",
      answer:
        "Five days a week for 52 weeks is 260 days, and 28 days is the UK statutory minimum paid leave for a full-time worker, bank holidays included. Both are adjustable, and days off are scaled to the number of days you travel in.",
    },
    {
      question: "Does working from home reduce the cost of a season ticket?",
      answer:
        "Not on its own: a monthly pass or season ticket costs the same however often you use it, so the calculator only shows a cost saving in per-day mode. If you are in the office two or three days a week, compare the pass against paying daily or a flexi season ticket.",
    },
    {
      question: "Should I count walking to the station or parking as commute time?",
      answer:
        "Yes. Use door to door, including walking, waiting and parking. That is the time you would actually have back if you did not travel, and it is usually 10 to 20 minutes more each way than the timetable suggests.",
    },
    {
      question: "How much time does hybrid working save?",
      answer:
        "Each home day a week saves the same share of your yearly total: two days out of five saves 40%. On a 45 minute each way commute that is about 139 hours a year, close to six full days.",
    },
    {
      question: "Can I share or save my result?",
      answer:
        "Yes. Your inputs are written into the page address as you change them, so copying the link from the address bar shares the exact calculation.",
    },
  ],
};

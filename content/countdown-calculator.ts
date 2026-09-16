import type { ToolContent } from "@/lib/tool-content";

export const content: ToolContent = {
  intro: [
    "Pick a date, add a time if it matters, and this countdown calculator shows the days, hours, minutes and seconds left, ticking live. Underneath it turns the same gap into the figures people actually ask for: how many weeks, how many sleeps, how many weekends, and how many working days to go.",
    "Give the occasion a name and the address bar becomes a shareable countdown link. Dates in the past work too, so it doubles as a days-since calculator.",
  ],
  sections: [
    {
      heading: "How the countdown is worked out",
      paragraphs: [
        "Everything runs in your device's local time zone, so a countdown to midnight means your midnight. The clock at the top counts whole calendar days first and shows the hours, minutes and seconds left after those days; when the clocks change between now and the target, that hour is absorbed into a day rather than showing up as a 23 or 25 hour day.",
        "The calendar line steps through months the way a diary would: from 31 January, one month lands on 28 February (29 in a leap year), not on 3 March. Total hours, minutes and seconds are exact elapsed time, so across a clock change they can differ from the days-and-hours figure by an hour. Both are right, they just answer different questions.",
      ],
      bullets: [
        "**Days** on the clock = whole local days between now and the target",
        "**Sleeps** = midnights you will cross, so an event later today is 0 sleeps and one tomorrow morning is 1",
        "**Working days** = dates after today up to and including the target that fall Monday to Friday, with no bank holidays removed",
        "**Weekends** = full Saturday and Sunday pairs in that same range",
      ],
    },
    {
      heading: "Does it count today, and does it count the day itself?",
      paragraphs: [
        "The clock counts the time between this exact second and the target time, so it never counts a whole day for today or for the target day: a countdown to 9am tomorrow from 9am today is exactly 1 day. Sleeps, weekends and working days are date-based instead. They count the dates after today up to and including the target date, which matches the way people say \"three more sleeps\" or \"ten working days to get it done\".",
        "If you want the number of days inclusive of both ends, as some deadlines and rental contracts define it, add one to the days figure.",
      ],
    },
    {
      heading: "Time zones and daylight saving",
      paragraphs: [
        "The target is interpreted in the time zone your browser reports, which is shown under the clock. If you share a link with someone in another country, they will see a countdown to the same date and time on their own clock, not the same instant. For a launch or a call at a fixed moment, say the zone in the name so nobody is caught out.",
        "Daylight saving changes are handled for you. A countdown that crosses the switch in March or October still counts calendar days correctly, and the total-hours figure includes the hour gained or lost.",
      ],
    },
    {
      heading: "Counting down to Christmas, New Year and the weekend",
      paragraphs: [
        "The quick picks fill in the next occurrence of the usual targets: New Year at midnight, Christmas Day at midnight, 5pm on Friday, 9am on Monday, the last moment of the current month, and a date 100 days from now. Once a preset is in, you can still edit the time or the name.",
        "For birthdays, anniversaries and other yearly dates, enter the next occurrence directly. The link keeps the date, so you can bookmark it and it will keep counting.",
      ],
    },
    {
      heading: "Days since a date",
      paragraphs: [
        "Enter a date in the past and the heading flips to \"Since\", with the same clock and the same breakdown. That gives you days since a start date, weeks since a purchase for a warranty, or working days since a letter was sent.",
        "Working days here are plain weekdays. If you need business days for a legal or HR deadline, remember to knock off any bank holidays in the range, and check whether your contract counts the start date as day one.",
      ],
    },
  ],
  faqs: [
    {
      question: "How many days until a date?",
      answer:
        "Enter the date above and the clock shows the whole days left, then the hours, minutes and seconds beyond that. The figure updates every second and uses your device's local time.",
    },
    {
      question: "Does the countdown include today?",
      answer:
        "The clock measures the exact time from now to the target, so today only counts for the hours left in it. The sleeps, weekends and working days figures count the dates after today up to and including the target date.",
    },
    {
      question: "What counts as a sleep?",
      answer:
        "One sleep is one midnight between now and the target in your local time. Something later today is 0 sleeps; tomorrow morning is 1 sleep; a week on Saturday from a Saturday is 7 sleeps.",
    },
    {
      question: "Are bank holidays excluded from working days?",
      answer:
        "No. Working days are every Monday to Friday in the range. Bank holidays differ by country and year, so subtract any that fall in your range if you need a business-day count.",
    },
    {
      question: "Why is the months figure different from the days divided by 30?",
      answer:
        "The calendar line steps through real months, which are 28 to 31 days long, so 3 months from 16 September is 16 December whatever the day counts in between. Dividing days by 30 gives an average, not a calendar answer.",
    },
    {
      question: "Can I share the countdown?",
      answer:
        "Yes. The date, time and name are kept in the page address, so copy the link from the share button and anyone who opens it sees the same countdown running in their own time zone.",
    },
  ],
};

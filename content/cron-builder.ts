import type { ToolContent } from "@/lib/tool-content";

export const content: ToolContent = {
  intro: [
    "A cron expression is five fields separated by spaces: minute, hour, day of month, month and day of week. Type one in the box to read it back in plain English and see exactly when it will next fire, or open a field and build the schedule with buttons. The expression and the builder stay in step, so you can start either way.",
    "It covers the standard crontab format used by Linux and macOS cron, GitHub Actions schedules, Kubernetes CronJobs and most hosted schedulers. Everything runs in your browser.",
  ],
  sections: [
    {
      heading: "The five fields",
      paragraphs: [
        "Read left to right, the fields are **minute** (0-59), **hour** (0-23), **day of month** (1-31), **month** (1-12 or JAN-DEC) and **day of week** (0-6 or SUN-SAT, where both 0 and 7 mean Sunday). A job runs when the current minute, hour and month all match, and the day matches as described below.",
        "Each field accepts the same small grammar. A star means any value. A number means that value exactly. A comma list picks several (1,15). A dash gives a range (9-17, MON-FRI). A slash after a star or a range gives a step: */15 is every 15 minutes, 1-23/6 is 1, 7, 13 and 19. Steps count from the start of the field or range, so */7 in the minute field fires at 0, 7, 14 ... 56 and then at 0 again, with a 4-minute gap at the end of the hour.",
      ],
    },
    {
      heading: "Day of month and day of week together",
      paragraphs: [
        "This is the part of cron that catches people out. When both day fields are restricted, for example 0 0 1 * 1, cron runs when **either** matches: on the 1st of every month, and on every Monday. It does not mean \"the first Monday\". There is no standard cron syntax for \"first Monday of the month\"; the usual workaround is 0 0 1-7 * 1 with a check in the script, or in cron itself: 0 0 1-7 * * [ $(date +\\%u) = 1 ] && your-command.",
        "The rule has one twist. Vixie cron, the version most Linux distributions descend from, only ORs the two fields when neither is written with a leading star. 0 0 */2 * 1 therefore ANDs them (odd-numbered days that are also Mondays) because the day-of-month field starts with a star even though it is restricted. The tool follows the Vixie rule and flags both cases next to the next-run list.",
      ],
    },
    {
      heading: "Time zones",
      paragraphs: [
        "A crontab has no time zone of its own. The daemon reads the fields against the machine's clock, so 0 9 * * * means 09:00 wherever the server thinks it is. Many servers run in UTC; your laptop almost certainly does not. The next-run list defaults to your browser's zone and lets you switch, so you can check what 09:00 on a UTC server looks like locally.",
        "Daylight saving causes two classic surprises. When clocks go forward, an hour of wall time never happens, so a job set for 01:30 in that zone has no 01:30 to run at. When clocks go back, the hour repeats. What happens next depends on the daemon: Vixie cron 4 and cronie run a skipped fixed-time job straight after the jump (so at 02:00) and do not run a job twice in the repeated hour; simpler schedulers that just compare the wall clock miss the first and double the second. This tool lists wall times that exist, so around a change it shows the next real 01:30 rather than guessing the daemon's behaviour. Schedule anything important for a time that exists every day, such as 03:30, or run the server in UTC.",
        "GitHub Actions and Kubernetes CronJobs (unless the job sets a timeZone) always read schedules in UTC, so pick UTC in the zone picker when checking those.",
      ],
    },
    {
      heading: "Nicknames and what is not supported",
      paragraphs: [
        "Most crons accept @hourly, @daily (or @midnight), @weekly, @monthly and @yearly (or @annually) in place of the five fields; type one and the tool expands it. @reboot runs a job once at startup and has no schedule, so it is rejected with a note.",
        "Six- and seven-field expressions belong to Quartz (used by Java schedulers, Spring and some cloud products) and start with a seconds field. Quartz also adds ?, L (last), W (nearest weekday) and # (nth weekday). None of that is standard cron and the tool says so rather than guessing. AWS EventBridge uses its own six-field variant with a year, also not covered here.",
      ],
    },
    {
      heading: "Common schedules",
      paragraphs: ["A few expressions worth knowing by heart:"],
      bullets: [
        "*/5 * * * *  every five minutes",
        "0 * * * *  on the hour, every hour",
        "0 9 * * 1-5  09:00 on weekdays",
        "30 2 * * *  02:30 every day, a safe time for backups",
        "0 0 1 * *  midnight on the first of the month",
        "0 0 * * 0  midnight on Sunday (the start of the week in cron's eyes)",
        "0 */6 * * *  every six hours at 00:00, 06:00, 12:00 and 18:00",
        "15 14 1 * *  14:15 on the first of every month",
      ],
    },
    {
      heading: "Putting it in a crontab",
      paragraphs: [
        "Run crontab -e to edit your own crontab, then add a line with the expression followed by the command: 30 9 * * 1-5 /home/you/bin/report.sh. Use full paths for commands and files, because cron starts with almost no environment and a minimal PATH. Redirect output if you want to keep it (>> /var/log/report.log 2>&1); otherwise cron tries to email it to you. A percent sign in the command line means newline to cron, so escape it as \\% (the date example above does this).",
      ],
    },
  ],
  faqs: [
    {
      question: "What does * * * * * mean?",
      answer:
        "Every minute of every hour, every day. Five stars is the most frequent schedule standard cron can express; there is no seconds field.",
    },
    {
      question: "How do I run a cron job every 5 minutes?",
      answer:
        "*/5 * * * *. The step counts from minute 0, so it fires at :00, :05, :10 and so on. For every 90 seconds or anything under a minute you need a different tool, such as a systemd timer or a loop inside the script.",
    },
    {
      question: "Does 0 0 1 * 1 run on the first Monday of the month?",
      answer:
        "No. Because both day fields are restricted, cron runs on the 1st of the month and on every Monday. Standard cron has no first-Monday syntax; schedule 0 0 1-7 * 1 and have the script check the date, or use the date test shown above.",
    },
    {
      question: "Is 7 a valid day of week?",
      answer:
        "Yes in Vixie cron, cronie and most modern crons: 0 and 7 both mean Sunday, so 1-7 is Monday to Sunday. A few old implementations only accept 0-6, so prefer 0 for Sunday if the crontab has to travel.",
    },
    {
      question: "What time zone does cron use?",
      answer:
        "The system time zone of the machine running the daemon, unless the crontab sets a CRON_TZ or TZ variable and the cron supports it. GitHub Actions and Kubernetes CronJobs use UTC by default. The next-run list here can be switched to any zone to compare.",
    },
    {
      question: "What happens to a 01:30 job on the clocks-forward night?",
      answer:
        "01:30 never happens that night: the clocks go from 00:59 straight to 02:00. Vixie cron 4 and cronie notice and run the job at 02:00 instead; simpler schedulers skip it. Pick a time that exists every day, or run the server in UTC, and you never have to find out which kind you have.",
    },
    {
      question: "Can I write seconds in a cron expression?",
      answer:
        "Not in standard cron, which starts at minutes. Six-field expressions with a leading seconds field are Quartz syntax, used by Java schedulers and some cloud services, and are not accepted by crontab.",
    },
  ],
};

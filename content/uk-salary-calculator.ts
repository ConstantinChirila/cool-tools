import type { ToolContent } from "@/lib/tool-content";

const content: ToolContent = {
  intro: [
    "This is a UK salary calculator for 2026/27 that turns a gross salary into take-home pay, working through Income Tax, National Insurance, pension contributions and student loan repayments the way a payslip does. Enter a salary as a yearly, monthly, weekly, daily or hourly figure, add a pension, student loan plan or bonus, and switch on Scottish rates if that's where you live.",
    "Use it as a take home pay calculator, a net salary calculator, or a salary after tax UK check, when comparing job offers or asking how much tax will I pay on my salary.",
  ],
  sections: [
    {
      heading: "How take-home pay is worked out",
      paragraphs: [
        "The calculator follows PAYE's own order. Starting from your **gross** pay (salary plus bonus, overtime or cash allowance), a workplace pension is applied first: depending on the scheme type it comes off before tax, before tax and NI, or after tax with relief added back. What's left is your **taxable pay**.",
        "**Income Tax** applies your personal allowance and the relevant bands (rest of UK or Scottish) to taxable pay. **National Insurance** is worked out separately, on gross pay minus anything taken by salary sacrifice, using its own thresholds. Student loan and postgraduate loan repayments come off next, as a percentage above your plan's threshold. What's left is net, take-home pay.",
      ],
    },
    {
      heading: "Income tax bands for 2026/27",
      paragraphs: [
        "For England, Wales and Northern Ireland, the personal allowance and tax bands for 2026/27:",
      ],
      bullets: [
        "**Personal allowance**: £12,570 tax-free",
        "**Basic rate**: 20% on taxable income up to £37,700 above the allowance (up to £50,270 of total income)",
        "**Higher rate**: 40% from £37,700 to £125,140 above the allowance",
        "**Additional rate**: 45% above £125,140 above the allowance",
      ],
    },
    {
      heading: "Scottish income tax",
      paragraphs: [
        "Switch on the Scotland setting (or use an S-prefixed tax code) to apply the Scottish bands instead. For 2026/27, on taxable income after your personal allowance:",
      ],
      bullets: [
        "**Starter rate**: 19% on the first £3,967",
        "**Basic rate**: 20% from £3,967 to £16,956",
        "**Intermediate rate**: 21% from £16,956 to £31,092",
        "**Higher rate**: 42% from £31,092 to £62,430",
        "**Advanced rate**: 45% from £62,430 to £125,140",
        "**Top rate**: 48% above £125,140",
      ],
    },
    {
      heading: "National Insurance",
      paragraphs: [
        "National Insurance isn't devolved, so it's the same UK-wide. For 2025/26 and 2026/27, on NI-able pay:",
      ],
      bullets: [
        "No National Insurance below £12,570 a year (the primary threshold)",
        "8% between £12,570 and £50,270 (the upper earnings limit)",
        "2% above £50,270",
        "Employers separately pay 15% above £5,000, which doesn't reduce your take-home but counts toward their total cost",
      ],
    },
    {
      heading: "Pensions, student loans and salary sacrifice",
      paragraphs: [
        "Auto-enrolment and a standard employer scheme (net pay) come off before tax, so you get tax relief but no NI saving. **Salary sacrifice** reduces your contractual salary instead, coming off before tax and NI too, usually leaving more take-home for the same pension pot. A personal pension only gets basic-rate relief added automatically; the calculator extends your basic-rate band for higher-rate relief, as HMRC does.",
        "Student loan repayments are 9% of NI-able earnings above your plan's threshold: £26,900 (Plan 1), £29,385 (Plan 2), £33,795 (Plan 4), £25,000 (Plan 5) for 2026/27. A postgraduate loan adds 6% above £21,000, stacking with any plan.",
      ],
    },
    {
      heading: "The £100,000 personal allowance taper",
      paragraphs: [
        "Once adjusted net income passes £100,000, you lose £1 of personal allowance for every £2 above that, gone completely by £125,140. Between those points, every extra £1 is taxed at 40%, loses 50p of allowance (itself taxed at 40%), and picks up 2% NI, roughly 60p to 62p in the pound, sometimes called the 60% tax trap.",
        "A pension contribution lowers adjusted net income, so paying more in can pull you back under £100,000. This is information, not advice: confirm your position on gov.uk before changing contributions to manage the taper.",
      ],
    },
    {
      heading: "What this calculator doesn't include",
      paragraphs: ["A few simplifications keep this usable without becoming a full payroll system:"],
      bullets: [
        "NI and tax are worked out annually; a bonus is often charged more NI in its actual pay period than this shows",
        "Taxable benefits in kind are one annual figure, not calculated from P11D rules",
        "Wales currently uses the same rates as England and Northern Ireland",
        "Only employee PAYE is covered, not Class 2 or 4 National Insurance for the self-employed",
        "It's a planning tool, not your payslip: confirm figures with a payslip or your HMRC tax account",
      ],
    },
    {
      heading: "Worked example",
      paragraphs: [
        "Take a £45,000 salary in England for 2026/27, with a 5% auto-enrolment pension and no student loan. The personal allowance stays at £12,570, well under the £100,000 taper. The pension comes to £1,938 a year, deducted before tax but not before NI (auto-enrolment doesn't save NI).",
        "Taxable pay is £30,492, entirely inside the basic rate band, giving Income Tax of £6,098.40. NI is charged on the full £45,000 above the £12,570 threshold at 8%, giving £2,594.40. Take-home comes to £34,369.20 a year, £2,864.10 a month, an effective rate of 19.3%. The employer separately pays a 3% pension contribution of £1,162.80, which doesn't touch take-home.",
      ],
    },
  ],
  faqs: [
    {
      question: "How much tax do I pay on £30,000 or £50,000?",
      answer:
        "On £30,000 in 2026/27 (standard tax code, no pension), you'd pay £3,486 Income Tax and £1,394.40 NI, taking home about £2,093 a month. On £50,000, that's £7,486 Income Tax and £2,994.40 NI, taking home about £3,293 a month.",
    },
    {
      question: "What is the personal allowance for 2026/27?",
      answer:
        "£12,570, unchanged from 2025/26. It tapers away above £100,000 of adjusted net income, £1 lost per £2 earned, gone completely by £125,140.",
    },
    {
      question: "When do I start paying 40% tax?",
      answer:
        "In England, Wales and Northern Ireland, once taxable income passes £37,700 above the allowance, £50,270 of gross income on a standard tax code. In Scotland the 42% rate starts lower, at £31,092 taxable, around £43,662 gross.",
    },
    {
      question: "Why is my take-home lower than my friend's on the same salary?",
      answer:
        "Usually a different pension type or rate, a student loan plan, Scottish rates versus the rest of the UK, or a different tax code. £45,000 with no pension is £6,882.05 Income Tax in Scotland for 2026/27, against £6,486.00 in the rest of the UK.",
    },
    {
      question: "How does salary sacrifice reduce tax?",
      answer:
        "You give up part of your salary for the contribution, so it never counts as pay for tax or NI, unlike auto-enrolment or net pay, which only save tax.",
    },
    {
      question: "Do I pay National Insurance on my pension contributions?",
      answer:
        "Only if it isn't salary sacrifice. Auto-enrolment, net pay and personal pensions are deducted after NI is worked out on your full pay.",
    },
    {
      question: "Is this calculator accurate for Scotland?",
      answer:
        "The Scotland setting applies the six Scottish bands (19%, 20%, 21%, 42%, 45%, 48%) instead of the three rest-of-UK bands. NI, the personal allowance and student loan rules are set at Westminster, so they work the same everywhere.",
    },
  ],
};

export default content;

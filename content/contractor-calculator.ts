import type { ToolContent } from "@/lib/tool-content";

export const content: ToolContent = {
  intro: [
    "This calculator turns a UK day rate into a year of take-home pay three ways (through your own limited company, through an umbrella company, and as a sole trader) and puts each next to a permanent salary. Enter your day rate, the days you expect to be off, and the job you are comparing against; costs, pension and umbrella fees are under the options.",
    "The comparison counts take-home plus pension by default, because an employer's pension contribution is real money that a contractor has to pay for themselves. Switch it to take-home only to compare cash in your pocket.",
  ],
  sections: [
    {
      heading: "How many days a contractor really works",
      paragraphs: [
        "A permanent salary pays you for 52 weeks. A contractor is only paid for the days they work, so the first job is to count them. There are 260 weekdays in a year. Take off holidays, bank holidays, sick days and training, and the time between contracts, and what is left is what you invoice.",
        "The defaults are 25 days of holiday, 8 bank holidays, 5 days of sickness or training and 10 days between contracts, which leaves 212 paid days. Every 10 days you add to the bench costs roughly £2,400 of take-home at £500 a day, so it is worth being honest about gaps.",
      ],
    },
    {
      heading: "Limited company (outside IR35)",
      paragraphs: [
        "Your company invoices the client, pays its costs, pays you a small salary and pays the rest out as dividends after corporation tax. The calculator follows the usual pattern:",
      ],
      bullets: [
        "**Director's salary** of £12,570, the personal allowance. With no other employees the company cannot claim the Employment Allowance, so it pays 15% employer NI on the salary above £5,000 (£1,135.50), but the salary and that NI both reduce corporation tax.",
        "**Corporation tax** at 19% on profits up to £50,000 and 25% from £250,000, with marginal relief in between that makes the rate on each extra pound 26.5%.",
        "**Dividends** taxed after the £500 dividend allowance at 10.75% in the basic band, 35.75% in the higher band and 39.35% above £125,140 for 2026/27 (8.75% and 33.75% for 2025/26).",
        "**Pension** paid by the company comes out before corporation tax and is not taxed as your income, which makes it the most efficient money a director can take.",
      ],
    },
    {
      heading: "Umbrella company (inside IR35)",
      paragraphs: [
        "If a contract is inside IR35, or you would rather not run a company, an umbrella employs you and pays you through PAYE. The agency pays the umbrella your full rate, and the umbrella takes its margin, employer NI at 15% and usually the 0.5% apprenticeship levy out of it before working out your gross pay. What is left is taxed like any salary.",
        "That is why the umbrella column is always the lowest: you pay both sides of National Insurance. The calculator treats pension as salary sacrifice, which most umbrellas offer, so it saves employer NI as well as your tax and NI.",
      ],
    },
    {
      heading: "Sole trader",
      paragraphs: [
        "A sole trader pays income tax on the profit plus Class 4 NI at 6% between £12,570 and £50,270 and 2% above it. Class 2 NI is no longer payable at these profit levels. Pension contributions are paid personally: you pay 80%, the provider claims 20% from HMRC, and higher-rate relief comes through a wider basic-rate band.",
        "Many agencies and larger clients will not engage a sole trader directly, which is why most day-rate contractors use a company or an umbrella, but the tax comparison is still useful.",
      ],
    },
    {
      heading: "Why a sole trader can beat a limited company",
      paragraphs: [
        "When a company pays out every pound of profit, each extra pound between £50,000 and £250,000 of profit pays 26.5% corporation tax and then 35.75% dividend tax: about 53p in total. A sole trader in the same place pays 40% income tax and 2% NI: 42p. Add accountancy and employer NI on the director's salary and, with the higher dividend rates from April 2026, a company that pays out everything often ends up behind.",
        "A company still comes out ahead when you leave profit in it for a later year, pay more into a pension from it, or need limited liability. This calculator assumes everything is paid out so it compares like with like against a salary.",
      ],
    },
    {
      heading: "Worked examples (2026/27, England, default days and costs, no pension)",
      paragraphs: ["212 paid days, £1,000 expenses, £1,500 company running costs, £600 sole trader accountancy, £25 a week umbrella margin:"],
      bullets: [
        "**£300 a day** (£63,600): limited company £46,714, umbrella £42,339, sole trader £47,271",
        "**£400 a day** (£84,800): limited company £56,851, umbrella £52,985, sole trader £59,567",
        "**£500 a day** (£106,000): limited company £66,862, umbrella £63,631, sole trader £70,983",
        "**£650 a day** (£137,800): limited company £80,599, umbrella £75,792, sole trader £84,726",
      ],
    },
    {
      heading: "What day rate matches my salary?",
      paragraphs: [
        "Using the same defaults and comparing take-home only, the day rate needed to match a permanent salary (limited company, umbrella, sole trader):",
      ],
      bullets: [
        "**£40,000**: £205, £219, £193",
        "**£50,000**: £252, £274, £239",
        "**£70,000**: £343, £383, £332",
        "**£90,000**: £459, £492, £426",
      ],
    },
  ],
  faqs: [
    {
      question: "What is IR35?",
      answer:
        "IR35 is the set of rules that decides whether a contractor working through their own company is really a disguised employee. If a contract is inside IR35, the client or agency deducts PAYE tax and NI as if you were employed, so the limited company route no longer applies and the umbrella figures are the realistic ones.",
    },
    {
      question: "How many days a year does a contractor work?",
      answer:
        "Usually somewhere between 200 and 225. There are 260 weekdays a year; take off around 33 days of holiday and bank holidays, a few sick or training days and any gaps between contracts. This calculator starts at 212.",
    },
    {
      question: "What is the rule of thumb for converting a day rate to a salary?",
      answer:
        "Outside IR35 through a limited company, a day rate of about 0.5% of a salary gives similar take-home once holidays and gaps are counted, so £350 a day is roughly a £70,000 job. Inside IR35 you need around 10% more.",
    },
    {
      question: "Is £12,570 the best director's salary?",
      answer:
        "For a one-person company it usually is. The salary uses your personal allowance, costs no income tax or employee NI, and together with its employer NI it saves corporation tax that is worth more than the NI costs. You can change it under Business costs.",
    },
    {
      question: "Does VAT change my take-home?",
      answer:
        "Not directly. A VAT-registered company charges VAT on top of the day rate and passes it to HMRC, so enter the rate before VAT. The Flat Rate Scheme can leave a small gain, which this calculator does not include.",
    },
    {
      question: "Why does the comparison include pension?",
      answer:
        "An employer pension contribution is part of your pay even though it never reaches your bank account. To compare fairly, the calculator assumes you pay the same amount into a pension while contracting; change it or switch the comparison to take-home only.",
    },
  ],
};

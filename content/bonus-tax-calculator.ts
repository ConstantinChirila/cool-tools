import type { ToolContent } from "@/lib/tool-content";

export const content: ToolContent = {
  intro: [
    "This calculator shows how much of a UK bonus reaches your bank account after Income Tax, National Insurance and student loan repayments for 2026/27, and what changes if you swap some of it for a pension contribution. Enter the bonus and your normal salary; Scottish rates, pensions, student loans and tax codes are under the options.",
    "A bonus is not taxed at a special rate. It is ordinary pay, stacked on top of your salary, so it is taxed at whatever rates apply above what you already earn. That is why the same £5,000 bonus is worth about £3,850 to someone on £40,000 and much less to someone on £95,000.",
  ],
  sections: [
    {
      heading: "How a bonus is taxed",
      paragraphs: [
        "Your employer pays a bonus through payroll like any other pay, and three things can come out of it:",
      ],
      bullets: [
        "**Income Tax** at your marginal rate: 20% for a basic-rate taxpayer, 40% once total income passes £50,270, and 45% above £125,140. Scotland has its own bands, with 42%, 45% and 48% at the upper end.",
        "**National Insurance** at 8% on pay up to the upper earnings limit and 2% above it. For a bonus, which limit applies is decided month by month, not over the year (see below).",
        "**Student loan** at 9% of pay above your plan's threshold, plus 6% if you also have a postgraduate loan.",
      ],
    },
    {
      heading: "Why National Insurance on a bonus is usually lower than you expect",
      paragraphs: [
        "Income Tax is cumulative across the tax year, but employee National Insurance is not. It is worked out on each pay period on its own. For a monthly-paid employee the 8% rate applies to pay between £1,048 and £4,189 in the month, and anything above £4,189 in that month is charged at 2%.",
        "A bonus arrives in a single month, so most of it lands above £4,189. Take a £40,000 salary and a £10,000 bonus. Treating the bonus as extra annual salary suggests £800 of NI (8% of £10,000). Payroll actually charges about £251: 8% on the £856 that fills the rest of the month's main-rate band, and 2% on the remaining £9,144. This calculator uses the pay-period method, which is why its NI figure can be lower than an annual salary calculator's.",
        "The exception is **company directors**, whose NI is assessed over the whole year. Switch on the director option and the annual figure is used instead.",
      ],
    },
    {
      heading: "The £100,000 trap",
      paragraphs: [
        "Once your adjusted net income passes £100,000 you lose £1 of the £12,570 personal allowance for every £2 above it, until it is gone at £125,140. Income in that range is taxed at 40% and also drags £1 of previously tax-free income into tax for every £2 earned, which works out at an effective 60% Income Tax rate, or 62% with NI.",
        "A bonus is the most common reason people fall into it. On a £95,000 salary, a £20,000 bonus costs £11,000 in Income Tax and £400 in NI, leaving £8,600: you keep 43%. Sacrificing £15,000 of that bonus into a pension brings income back to £100,000, keeps the full allowance, and leaves £2,900 in your pocket plus £15,000 in your pension, against £8,600 and nothing.",
      ],
    },
    {
      heading: "Bonus sacrifice: cash or pension?",
      paragraphs: [
        "With bonus sacrifice you agree to give up part of the bonus before it is paid, and your employer puts that amount into your pension instead. Because you never receive it as pay, it escapes Income Tax, NI and student loan repayments entirely. A higher-rate taxpayer who would keep £5,800 of a £10,000 bonus can instead have the whole £10,000 in their pension.",
        "Three conditions apply. Your employer has to offer it; it must be agreed before you become entitled to the bonus, not after it is announced; and your total pension contributions for the year, including your employer's, count against the annual allowance (£60,000 for most people, lower for very high earners). Your employer also saves 15% employer NI on the sacrificed amount, and some pass part of that saving into your pension, which this calculator shows separately but does not assume.",
        "The trade-off is access. Pension money cannot be touched until at least age 55 (57 from April 2028), and most of it is taxed as income when you draw it. It is tax deferred and often reduced, not tax removed.",
      ],
    },
    {
      heading: "Student loans and a bonus",
      paragraphs: [
        "Student loan repayments are also calculated on each pay period alone. On Plan 2 the monthly threshold is about £2,449, so a bonus month pays 9% of everything above it. If you are already over the threshold, that is a straightforward 9% of the bonus: £900 on a £10,000 bonus.",
        "If your salary is under the annual threshold, a bonus can still trigger a repayment in the month it is paid. When your total income for the tax year ends up below the annual threshold, you can ask the Student Loans Company to refund it after the year ends.",
      ],
    },
    {
      heading: "Worked examples (2026/27, England, no pension or loan)",
      paragraphs: ["Monthly-paid employees, bonus paid in one month:"],
      bullets: [
        "**£30,000 salary, £3,000 bonus**: £600 tax, £161 NI, you keep £2,239 (75%)",
        "**£40,000 salary, £5,000 bonus**: £1,000 tax, £151 NI, you keep £3,849 (77%)",
        "**£60,000 salary, £10,000 bonus**: £4,000 tax, £200 NI, you keep £5,800 (58%)",
        "**£60,000 salary, £10,000 bonus, Plan 2 loan**: a further £900 to the loan, you keep £4,900 (49%)",
        "**£60,000 salary, £10,000 bonus, Scotland**: £4,200 tax at 42%, you keep £5,600 (56%)",
        "**£95,000 salary, £20,000 bonus**: £11,000 tax, £400 NI, you keep £8,600 (43%)",
      ],
    },
    {
      heading: "What this calculator does not cover",
      paragraphs: [
        "It models one bonus paid in a single pay period to an employee with one job, and reports the tax the bonus adds across the year. It is an estimate, not payroll.",
      ],
      bullets: [
        "The tax shown on the bonus payslip itself can differ, because a cumulative tax code spreads your allowance across the year; it evens out by the end of the tax year",
        "Emergency or week 1 / month 1 codes can over-tax a bonus in the month, with the difference refunded later",
        "The High Income Child Benefit Charge, which starts at £60,000 of adjusted net income, is not included",
        "Student loan thresholds and NI are not rounded to whole pounds the way payroll software does, so expect differences of a pound or two",
        "Bonuses paid in shares, or spread over several months, are taxed differently",
      ],
    },
  ],
  faqs: [
    {
      question: "Is a bonus taxed more than normal salary?",
      answer:
        "No. A bonus is taxed as ordinary pay at the same rates as salary. It can feel heavier because it sits on top of your salary, so all of it is taxed at your highest rate, with no tax-free allowance left to use.",
    },
    {
      question: "How much tax will I pay on a £5,000 bonus?",
      answer:
        "On a £40,000 salary in England for 2026/27, a £5,000 bonus costs £1,000 in Income Tax and about £151 in National Insurance, leaving £3,849. A higher-rate taxpayer pays £2,000 in tax and £100 in NI on the same bonus, leaving £2,900.",
    },
    {
      question: "Why is the NI on my bonus lower than 8%?",
      answer:
        "Employee NI is calculated on each pay period alone. In the month a bonus is paid most of it falls above that month's upper earnings limit of £4,189, where the rate is 2% rather than 8%. Company directors are the exception, as their NI is assessed annually.",
    },
    {
      question: "Why did my bonus payslip show more tax than this calculator?",
      answer:
        "PAYE works cumulatively, so a large payment early in the tax year can be taxed heavily in that month and balanced by lower tax in later months. This calculator shows the tax the bonus adds over the whole year. An emergency or month 1 tax code can also over-tax a bonus until HMRC corrects it.",
    },
    {
      question: "Can I put my bonus into my pension to avoid tax?",
      answer:
        "Yes, if your employer offers bonus sacrifice and you agree it before the bonus is awarded. The sacrificed amount goes into your pension free of Income Tax, NI and student loan repayments, subject to the pension annual allowance. The money is locked away until at least age 55 (57 from 2028) and is taxed when you take it out.",
    },
    {
      question: "What is the 60% tax trap on a bonus?",
      answer:
        "Between £100,000 and £125,140 you lose £1 of personal allowance for every £2 of income, so each extra pound is effectively taxed at 60%, or 62% with NI. A bonus that pushes you into that range is hit hardest. Pension contributions that bring adjusted net income back under £100,000 restore the allowance.",
    },
    {
      question: "Does a bonus count towards student loan repayments?",
      answer:
        "Yes. Repayments are 9% of pay above the threshold in each pay period, so a bonus month repays 9% of the bonus if you are already over the threshold. If your income for the whole tax year is under the annual threshold, you can claim back what was taken.",
    },
  ],
};

import type { ToolContent } from "@/lib/tool-content";

const content: ToolContent = {
  intro: [
    "This compound interest calculator shows how a lump sum, plus a regular monthly contribution, grows once interest starts earning interest on itself. Set an initial deposit, a monthly amount, a rate and a term, and it plots the balance year by year so you can see how much is your own money versus growth.",
    "Use it to sanity-check a savings goal or compare what happens at different rates and contribution levels over time.",
  ],
  sections: [
    {
      heading: "How compound interest is calculated",
      paragraphs: [
        "The classic compound interest formula is A = P x (1 + r/n)^(n x t). Here A is the final balance, P is your initial deposit (the principal), r is the annual interest rate written as a decimal (7% becomes 0.07), n is how many times per year interest compounds, and t is the number of years.",
        "That formula assumes a single lump sum with no further deposits. This calculator also handles regular monthly contributions: each contribution is added at the start of the month, so it starts earning interest straight away, and interest is then applied at whichever compounding frequency you've chosen. Because of that, the calculator works through the plan month by month rather than plugging numbers into the formula once.",
      ],
    },
    {
      heading: "Compounding frequency: does it matter?",
      paragraphs: [
        "It matters less than people expect, at least at typical savings rates. Take £10,000 with no further contributions, growing at 5% a year for 10 years. Compounded monthly it grows to £16,470.09; compounded yearly it grows to £16,288.95, a difference of only about £181 over a decade.",
        "The frequency shifts the result at the margins, but your interest rate, how much you contribute, and how long you leave it invested do far more of the work. Don't chase a monthly-compounding account over a yearly one if the underlying rate is lower; check the AER instead (more on that below).",
      ],
    },
    {
      heading: "Why starting early matters",
      paragraphs: [
        "Time in the market, or time in a savings account, is one of the biggest levers you have. Contributing £200 a month at 7%, compounded monthly, from age 25 to 65 (40 years) with no starting balance grows to £528,024.96. Start the same plan 10 years later, at 35, and you only get 30 years, ending at £245,417.50.",
        "The extra 10 years of contributions is £24,000 (£96,000 paid in versus £72,000), but the final balance is £282,607.46 higher. Almost all of that gap is compounding on money that's had longer to grow, not extra money paid in.",
      ],
    },
    {
      heading: "Using this for ISAs, savings accounts and investments",
      paragraphs: [
        "For savings accounts, look at the **AER (Annual Equivalent Rate)** rather than the headline rate: it restates the compounding frequency as if it compounded once a year, so you can compare accounts fairly. Plug the AER into this calculator's rate field for a like-for-like estimate.",
        "A cash ISA works the same way as a savings account, just without the tax question. For a stocks and shares ISA or any investment account, remember the rate is a fixed assumption: real returns are not guaranteed and can fall as well as rise. Inflation also erodes what a balance can buy by the time you reach it, so treat the output as a projection, not a promise.",
      ],
    },
    {
      heading: "What this calculator doesn't include",
      paragraphs: [
        "This tool deliberately leaves some things out, to keep the maths transparent:",
      ],
      bullets: [
        "Tax on interest or investment growth outside an ISA or your allowances",
        "Account fees, platform charges or investment management costs",
        "Interest rates changing over the term: it assumes one fixed rate throughout",
        "Inflation, so results are shown in today's money, not adjusted for future purchasing power",
      ],
    },
    {
      heading: "Worked example",
      paragraphs: [
        "Set an initial deposit of £10,000, a monthly contribution of £250, an annual rate of 7%, monthly compounding, and a term of 20 years. Over that period you pay in £70,000 in total (the £10,000 initial deposit plus £250 a month for 240 months), and the balance grows to £171,378.74.",
        "That means £101,378.74 of the final balance is interest, roughly 59% of the total. Try the same numbers over 10 or 30 years to see how much of that growth is concentrated in the later years.",
      ],
    },
  ],
  faqs: [
    {
      question: "What is the difference between simple and compound interest?",
      answer:
        "Simple interest is paid only on the amount you started with, so it grows in a straight line. Compound interest is paid on your principal plus any interest already earned, so it grows faster over time: £10,000 at 5% for 10 years reaches £15,000 with simple interest but £16,288.95 with interest compounded yearly.",
    },
    {
      question: "What does AER mean?",
      answer:
        "AER stands for Annual Equivalent Rate. It's a standardised figure UK banks quote so you can compare accounts that compound at different frequencies (daily, monthly, yearly) on equal terms, as if each compounded once a year.",
    },
    {
      question: "How often do UK savings accounts compound?",
      answer:
        "It varies by provider and account type: easy access accounts often compound monthly or daily, while fixed-rate bonds and notice accounts more often compound annually. The AER is the easiest way to compare them without working out the compounding schedule yourself.",
    },
    {
      question: "Is compound interest taxed in the UK?",
      answer:
        "Interest earned outside an ISA counts towards your Personal Savings Allowance, which for 2025/26 is £1,000 for basic rate taxpayers, £500 for higher rate taxpayers, and £0 for additional rate taxpayers; interest above that is taxable. Interest earned inside a cash ISA is tax free. These figures are current for the 2025/26 tax year and can change.",
    },
    {
      question: "What is the rule of 72?",
      answer:
        "Divide 72 by your annual interest rate to estimate how many years it takes a lump sum to double, with no further contributions. At 6%, that's 72 ÷ 6 = 12 years; running £10,000 at 6% compounded yearly for 12 years in this calculator gives £20,121.96, close enough for a rough estimate.",
    },
  ],
};

export default content;

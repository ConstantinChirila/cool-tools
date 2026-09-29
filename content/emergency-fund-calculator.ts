import type { ToolContent } from "@/lib/tool-content";

export const content: ToolContent = {
  intro: [
    "This emergency fund calculator shows how long your savings would last if your pay stopped tomorrow: at your normal spending, and cut back to the essentials. List what you spend each month, mark what you could stop paying for, and add any money that would still come in, such as redundancy pay, a partner's contribution or New Style Jobseeker's Allowance.",
    "It also sets a goal, three to twelve months of essential spending, and works out how long it takes to get there at what you can put away each month.",
  ],
  sections: [
    {
      heading: "How the runway is worked out",
      paragraphs: [
        "The calculator starts with your savings, adds any one-off money on day one, then goes month by month: each month takes off your spending and puts back whatever income is still coming in. The month the money runs out counts as the part of it your savings covered, so £5,000 against £2,000 a month lasts two and a half months.",
        "With the starting figures, £5,000 of savings against £2,400 a month of spending lasts **2 months**. Drop the £390 of subscriptions, eating out and extras marked as things you could cut, and the £2,010 of essentials stretch it to **2 months 2 weeks**. The dates shown count from today.",
        "Income that stops part way through, like JSA after six months or a side job you expect to lose, is handled month by month, so you can see the balance fall faster once it ends in the chart under the calculator.",
      ],
    },
    {
      heading: "What counts as essential?",
      paragraphs: [
        "Essential spending is what you'd still have to pay with no income: rent or mortgage, energy, water and council tax, food, insurance, the minimum payments on any debts, and whatever transport and phone costs you need to look for work. Everything else, from streaming to takeaways, is something you could pause for a few months.",
        "Be honest about both lists. Most people find a few costs they'd happily cut, and some they'd forgotten, like annual bills that come round once a year (divide those by 12). If you'd stop commuting, your transport cost may drop too.",
      ],
    },
    {
      heading: "How big should an emergency fund be?",
      paragraphs: [
        "The usual rule of thumb is **three to six months of essential spending**, and the calculator's goal is measured in months of essentials for that reason. Three months suits someone with a stable job, a second income in the household and no dependants. Six months or more is safer if you're self-employed, the only earner, have children, or work in a field where finding a new job takes a while.",
        "With the starting figures, six months of £2,010 is **£12,060**. With £5,000 saved that's £7,060 to go, which takes **3 years** at £200 a month.",
        "If you listed income that would carry on, the calculator also shows how much savings would cover the same number of months once it's counted. With New Style JSA for someone 25 or over, six months of those essentials needs £9,576 instead of £12,060, because JSA pays about £414 a month of it.",
      ],
    },
    {
      heading: "Money that keeps coming in",
      paragraphs: [
        "Add only what would really carry on without your job, after tax:",
        "Adding £3,000 of redundancy pay and New Style JSA to the starting figures stretches the essentials runway from 2 months 2 weeks to **5 months**.",
      ],
      bullets: [
        "**Redundancy or notice pay**: arrives as a lump sum on day one. up to £30,000 of redundancy pay is tax-free, but notice pay and holiday pay are taxed like wages",
        "**Partner's contribution**: what they could put towards the costs you listed, not their whole salary",
        "**Side income**: freelance work, rent from a lodger, anything you'd keep. Set how many months it lasts if it might stop",
        "**New Style JSA**: see below. Only offered with pounds selected",
        "**Other one-off or monthly money**: a sale, a loan from family, sick pay or income protection insurance",
      ],
    },
    {
      heading: "New Style JSA and Universal Credit",
      paragraphs: [
        "**New Style Jobseeker's Allowance** is paid to people who have paid enough Class 1 National Insurance in recent tax years. In 2026/27 it's up to **£95.55 a week** if you're 25 or over and £75.65 if you're under 25, for up to 182 days (about six months). Your savings and a partner's income don't affect it, but earnings from part-time work and pension income can reduce it. The calculator converts the weekly rate to a monthly one (£95.55 a week is about £414 a month) and stops it after six months.",
        "**Universal Credit** works differently: it's means-tested, and savings count. The first £6,000 is ignored, each £250 (or part of £250) between £6,000 and £16,000 takes £4.35 a month off your payment, and with more than £16,000 you can't get it at all. So a big emergency fund may mean living on it until it drops below £16,000. The calculator shows this note when pounds are selected, but doesn't try to work out a UC award, which depends on rent, children, a partner's earnings and more.",
      ],
    },
    {
      heading: "Where to keep an emergency fund",
      paragraphs: [
        "An emergency fund needs to be safe and quick to reach, so it usually sits in an easy-access savings account or a cash ISA, not in shares that could be down just when you need them. In the UK, up to £120,000 per person per bank or building society is protected by the Financial Services Compensation Scheme (banks in one group can share a licence, and so a limit).",
        "It's fine to earn interest on it, but chasing a slightly better rate with a long notice period defeats the point. Money above your goal is often better off working harder elsewhere, once any expensive debt is paid off.",
      ],
    },
    {
      heading: "What this calculator doesn't cover",
      paragraphs: ["It's a quick way to see your cushion, not a full budget, so bear in mind:"],
      bullets: [
        "Interest on savings and price rises are left out",
        "Spending is treated as the same every month; annual bills and one-off costs are best spread across the year",
        "Universal Credit, housing support and council tax reduction aren't calculated",
        "Tax on redundancy or notice pay isn't worked out: enter what you'd actually receive",
        "Everything happens in whole months from today, so dates are a guide, not a forecast",
      ],
    },
  ],
  faqs: [
    {
      question: "How many months should my emergency fund cover?",
      answer:
        "The usual advice is three to six months of essential spending. Aim for the higher end if you're self-employed, the only earner in your home, or have dependants.",
    },
    {
      question: "Should an emergency fund cover all my spending or just essentials?",
      answer:
        "Most rules of thumb use essential spending, because in an emergency you'd cut the extras. The calculator shows both runways so you can see how much cutting back buys you.",
    },
    {
      question: "Does my emergency fund affect benefits?",
      answer:
        "Savings don't affect New Style JSA. They do affect Universal Credit: savings over £6,000 reduce it by £4.35 a month for each £250, and over £16,000 you can't claim it.",
    },
    {
      question: "How much is New Style JSA?",
      answer:
        "In 2026/27 it's up to £95.55 a week if you're 25 or over and £75.65 a week if you're under 25, for up to 182 days. You need to have paid enough Class 1 National Insurance in recent tax years.",
    },
    {
      question: "Is redundancy pay taxed?",
      answer:
        "The first £30,000 of redundancy pay is tax-free. Notice pay, holiday pay and any bonus paid when you leave are taxed like normal wages, so enter the amount you'd actually receive.",
    },
    {
      question: "Where should I keep my emergency fund?",
      answer:
        "In an easy-access savings account or cash ISA, so the money is safe and you can reach it within a day or two. Up to £120,000 per person per bank or building society is protected by the FSCS.",
    },
  ],
};

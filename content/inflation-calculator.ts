import type { ToolContent } from "@/lib/tool-content";

export const content: ToolContent = {
  intro: [
    "This inflation calculator uses official UK price data from the Office for National Statistics to show what an amount of money from one year is worth in another. Pick any year from 1988 with CPI, or back to 1800 with the long-run RPI series, and it restates the amount in the other year's prices, with the total price rise and the average inflation rate in between.",
    "Two more modes answer the questions people usually ask next: has my pay kept up with prices, and what will things cost in ten or twenty years if inflation carries on at a given rate.",
  ],
  sections: [
    {
      heading: "How the calculation works",
      paragraphs: [
        "The ONS publishes a price index: a number that tracks the cost of a typical basket of goods and services over time. To move an amount from one year to another you multiply it by the ratio of the two years' index values. CPI averaged 72.7 in 2000 and 138.4 in 2025, so £100 in 2000 is worth £100 x 138.4 / 72.7 = £190.37 in 2025 prices.",
        "That is a total price rise of 90.4% over 25 years. The calculator also shows the **average inflation rate**: the steady yearly rate that would produce the same total rise. For 2000 to 2025 that is 2.6% a year, a touch above the Bank of England's 2% target.",
        "Each year uses the ONS **annual average** index, which smooths out month-to-month noise. The current year has no full average yet, so it uses the latest month published and says so next to the year.",
      ],
    },
    {
      heading: "CPI or RPI?",
      paragraphs: [
        "**CPI (Consumer Prices Index)** is the measure the Bank of England targets and the one quoted in the news. Figures start in 1988. It is the right choice for anything from the late 1980s on.",
        "**RPI (Retail Prices Index)** is older and the ONS has a long-run version of it going back to 1800, which is why the calculator switches to it for earlier years. The ONS no longer regards RPI as a good measure of inflation, because the way it averages prices pushes it higher than CPI. Over 2000 to 2025, RPI says £100 became £236.47, against £190.37 on CPI. RPI is still used for student loan interest, some older pensions and index-linked gilts.",
        "Before 1947, when the RPI proper began, the long-run series is built by the ONS from older price records, so figures from the 1800s and early 1900s are best read as a rough guide.",
      ],
    },
    {
      heading: "Has my pay kept up with inflation?",
      paragraphs: [
        "The **My pay** mode takes what you earned in an earlier year, restates it in today's prices, and compares it with what you earn now. If your pay now is higher than the restated figure you have had a real-terms rise; if it is lower, your pay buys less than it used to.",
        "For example, £30,000 in 2021 is £37,204 in 2025 prices on CPI. A 2025 salary of £35,000 looks like a 16.7% rise in cash, but it is a 5.9% real-terms cut, about £2,204 short of keeping pace. The inflation spike of 2022 (9.1% on annual averages) and 2023 (7.2%) is why so many pay rises from that period fell behind.",
        "The comparison uses pay before tax. Frozen income tax thresholds mean take-home pay can fall behind even when gross pay keeps up with prices, so for the full picture run both salaries through the UK salary calculator as well.",
      ],
    },
    {
      heading: "Projecting future prices",
      paragraphs: [
        "The **Future** mode assumes prices rise at one steady rate. At the Bank of England's 2% target, something that costs £100 today costs £121.90 in ten years, and £100 kept as cash buys only £82.03 of today's shopping. Quick buttons set the rate to 2%, the latest CPI figure, or CPI's average since 1988 (about 2.8% a year).",
        "Real inflation moves around a lot, from under 1% in 2015 to over 9% in 2022, so treat a projection as a sense of scale rather than a forecast. It is most useful for seeing why cash savings that earn less than inflation lose value, and why long-term goals need to be set in future pounds.",
      ],
    },
    {
      heading: "A few surprises in the long-run data",
      paragraphs: [
        "Prices did not always rise. On the long-run RPI series prices fell by about a third across the 1800s: £1 in 1800 bought what 68p did in 1900. Most of the rise since then came after 1940. The worst single years were 1917, in the First World War, when prices rose 25.4%, and 1975, at 24.2%.",
        "Over the whole span, £1 in 1900 is worth about £173 in 2025 prices, and £1 in 1950 about £48.",
      ],
    },
    {
      heading: "What this calculator doesn't cover",
      paragraphs: ["It measures general prices for a typical household, so bear in mind:"],
      bullets: [
        "Your own inflation rate depends on what you buy: rent, energy, food and petrol have all moved very differently from the average",
        "House prices are not in CPI or RPI, so it will not tell you what a house from 1980 would cost now",
        "Figures are UK-wide; there are no separate regional price indices",
        "Months within a year are not modelled: each year is its annual average, apart from the latest one",
      ],
    },
  ],
  faqs: [
    {
      question: "Where does the inflation data come from?",
      answer:
        "The Office for National Statistics consumer price inflation dataset: CPI (series D7BT, from 1988) and the long-run RPI series (CDKO, from 1800), using annual averages. The page shows which ONS release the figures come from.",
    },
    {
      question: "What is £100 from 2000 worth today?",
      answer:
        "On CPI, £100 in 2000 is worth £190.37 in 2025 prices, a 90.4% rise, or 2.6% a year on average. On RPI the same £100 comes to £236.47.",
    },
    {
      question: "Why does RPI give a bigger answer than CPI?",
      answer:
        "The two indices average price changes in different ways, and RPI's method pushes it higher, by roughly half to one percentage point a year in recent decades. RPI also includes some housing costs, such as mortgage interest, that CPI leaves out.",
    },
    {
      question: "Why is the current year marked with a month?",
      answer:
        "A full-year average only exists once December's figure is published. Until then the calculator uses the latest month available, so the current year's figure is that month rather than an average.",
    },
    {
      question: "What does a real-terms pay cut mean?",
      answer:
        "It means your pay has risen by less than prices, so it buys less than it did, even if the number on your payslip went up. The My pay mode shows the rise you would have needed to stand still.",
    },
    {
      question: "What inflation rate should I use for the future?",
      answer:
        "The Bank of England targets 2% CPI, which is a reasonable long-run assumption. CPI has averaged about 2.8% a year since 1988, so using 3% gives a more cautious picture.",
    },
  ],
};

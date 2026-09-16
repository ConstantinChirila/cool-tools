import type { ToolContent } from "@/lib/tool-content";

const content: ToolContent = {
  intro: [
    "This mortgage repayment calculator works out how much will my mortgage cost per month for any loan amount, interest rate and term, plus how much of that goes to interest over the life of the loan. Switch between repayment and interest-only to see how the two compare, and open the yearly breakdown to watch the balance fall.",
    "Use it when comparing lenders or deals, testing how a shorter term or bigger deposit changes your monthly payment, or when you want the full year-by-year split of interest and principal before you commit to a mortgage.",
  ],
  sections: [
    {
      heading: "How the calculation works",
      paragraphs: [
        "A repayment mortgage uses the same amortising loan formula banks use to set your monthly payment. Written out, it's:",
        "M = P x r x (1 + r)^n / ((1 + r)^n - 1)",
        "Here, **M** is the monthly repayment, **P** is the principal (the amount borrowed), **r** is the monthly interest rate (your annual rate divided by 12 and by 100), and **n** is the total number of monthly payments (the term in years multiplied by 12). The formula spreads the loan into equal monthly payments, with each one split differently between interest and principal.",
        "For interest-only mortgages, the maths is simpler: your monthly payment is just the balance multiplied by the monthly rate, since none of it reduces what you owe.",
      ],
    },
    {
      heading: "What the results mean",
      paragraphs: [
        "The monthly repayment is the fixed amount you'd pay every month: part interest, part principal. Total interest is the sum of every interest payment across the term, and total repaid adds that to the original loan amount.",
        "The amortisation table and chart show how the split changes year by year. Because interest is charged on whatever balance is left, early payments are mostly interest and later payments are mostly principal, even though the monthly amount stays fixed. On a £250,000 loan at 4.5% over 25 years, year one costs about **£11,137** in interest against £5,538 off the balance, but by year 25 interest has shrunk to roughly £399 while over £16,000 clears the loan.",
      ],
    },
    {
      heading: "Repayment vs interest-only",
      paragraphs: [
        "A repayment mortgage reduces your balance every month so it reaches zero at the end of the term: that's what most people mean by a mortgage repayment calculator. Interest-only keeps the balance exactly where it started; your payment only covers the interest, so you need a separate plan to clear the capital when the term ends.",
        "On the same £250,000 loan at 4.5% over 25 years, interest-only comes to **£937.50** a month against £1,389.58 for repayment, a big difference in cash flow. But you'd still owe the full £250,000 at the end, and because the balance never falls, total interest over the term ends up higher overall.",
      ],
    },
    {
      heading: "Things this calculator doesn't include",
      paragraphs: [
        "This tool is for comparing the shape of a mortgage, not a substitute for a lender's illustration. It's worth knowing what's left out:",
      ],
      bullets: [
        "Arrangement, valuation, and legal fees charged when you take out or switch a mortgage",
        "Rate changes: most UK deals are fixed or discounted for 2 to 5 years, then revert to a lender's standard variable rate or a new deal, but this calculator assumes one constant rate for the whole term",
        "Offset mortgages, where linked savings reduce the balance interest is charged on",
        "Buildings, life, or mortgage protection insurance",
        "Stamp duty land tax and other purchase costs",
        "Early repayment charges if you overpay or switch deals, covered by the Mortgage Overpayment Calculator",
      ],
    },
    {
      heading: "Worked example",
      paragraphs: [
        "Borrow **£250,000** at 4.5% over a 25-year term. As a repayment mortgage, the monthly payment works out at £1,389.58, total interest over the full term comes to £166,874.36, and total repaid is £416,874.36.",
        "Switch the same loan to interest-only and the monthly payment drops to £937.50, but you'd still owe the full £250,000 when the 25 years are up, and total interest paid over that time comes to £281,250.00, more than the repayment version, because the balance never reduces.",
      ],
    },
  ],
  faqs: [
    {
      question: "How is a mortgage repayment calculated?",
      answer:
        "Lenders use the standard amortising loan formula: your loan amount, monthly interest rate, and number of payments determine one fixed monthly payment that clears the balance exactly at the end of the term. This calculator uses the same formula.",
    },
    {
      question: "What happens when my fixed rate ends?",
      answer:
        "You'll typically move to your lender's standard variable rate or arrange a new deal, and your payment is recalculated at the new rate against your remaining balance and term. Rerun this calculator with the new rate and balance to see the new payment.",
    },
    {
      question: "Is it better to have a shorter or longer mortgage term?",
      answer:
        "A shorter term means higher monthly payments but less total interest, because the loan is cleared faster. A longer term lowers the monthly cost but you'll pay more interest overall, since the balance stays higher for longer. Try a few term presets in the calculator to see the trade-off on your numbers.",
    },
    {
      question: "How much of my payment goes to interest?",
      answer:
        "Most of it, early on. Interest is charged on whatever you currently owe, so in the first few years, when the balance is largest, most of each payment goes to interest. That balance flips gradually, and by the final years almost the whole payment reduces the balance.",
    },
    {
      question: "What's the difference between repayment and interest-only?",
      answer:
        "A repayment mortgage pays off interest and capital each month, so the balance reaches zero at the end of the term. Interest-only covers only the interest, so the balance never falls and you need a separate way to repay the capital.",
    },
    {
      question: "Does this calculator include stamp duty or lender fees?",
      answer:
        "No. It shows the repayment figures for the loan itself. Arrangement charges, valuation and legal fees, and stamp duty land tax are separate and should be added on top when budgeting for a purchase or remortgage.",
    },
  ],
};

export default content;

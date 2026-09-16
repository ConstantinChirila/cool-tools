import type { ToolContent } from "@/lib/tool-content";

const content: ToolContent = {
  intro: [
    "This mortgage overpayment calculator UK borrowers use to see how paying extra each month, or adding a one-off lump sum, changes the total interest you pay and how much sooner the loan is cleared. Enter a monthly overpayment, a lump sum, or both, and compare that schedule against the same mortgage with no overpayments.",
    "Use it before deciding how much can I overpay on my mortgage without running into your lender's allowance, or to see whether a monthly habit or a single lump sum makes the bigger difference to the interest you'll pay overall.",
  ],
  sections: [
    {
      heading: "Monthly overpayments vs lump sums",
      paragraphs: [
        "Your scheduled monthly payment is worked out the normal way and stays the same size throughout. Any overpayment, monthly or lump sum, goes straight to reducing the balance rather than covering interest, so less interest accrues and the loan finishes before the original term ends. Overpayments are capped at whatever balance is still outstanding, so you never pay more than you owe.",
        "On a £250,000 mortgage at 4.5% over 25 years, overpaying **£200** a month cuts total interest from £166,874.36 to £128,416.49, a saving of £38,457.87, and clears the loan 5 years 1 month early. A one-off £10,000 lump sum in month one saves £19,477.62 in interest and pays off 1 year 9 months early.",
        "Money paid earlier saves more interest per pound, because it stops accruing interest sooner for the rest of the term. Consistent monthly overpayments often add up to more total saving than a single lump sum of the same size paid partway through.",
      ],
    },
    {
      heading: "How overpayments change the maths",
      paragraphs: [
        "The scheduled payment itself still comes from the standard amortising formula, M = P x r x (1 + r)^n / ((1 + r)^n - 1), where P is the loan amount, r is the monthly interest rate, and n is the number of monthly payments. What changes is the balance: each month, any amount above that month's interest, including your overpayment, comes off the balance faster than the original schedule assumed.",
        "This calculator always models keeping your monthly payment the same and shortening the term, which is what most lenders do by default. Some let you instead keep the term and lower future payments; that option isn't modelled here. For the scheduled payment alone, without overpayments, see the Mortgage Calculator.",
      ],
    },
    {
      heading: "Early repayment charges and the 10% rule",
      paragraphs: [
        "Many UK lenders let you overpay a portion of your outstanding balance each year, commonly **10%**, without triggering an early repayment charge (ERC), while inside a fixed or discounted deal. This calculator checks your overpayments against 10% of each year's opening balance and warns you if you'd likely go over.",
        "For example, on a £250,000 loan, 10% of the balance in year one is £25,000, about £2,083 a month, so a £200 monthly overpayment sits well within a typical allowance. It's usually large lump sums, or generous overpayments on a big balance, that risk crossing the limit. The exact percentage and fee vary by lender, so check your mortgage offer.",
      ],
    },
    {
      heading: "Things this calculator doesn't include",
      paragraphs: [
        "This tool is for comparing overpayment strategies, not a substitute for your lender's own figures. It's worth knowing what's left out:",
      ],
      bullets: [
        "The exact early repayment charge percentage or fee, which varies by lender and deal",
        "The option to keep the original term and reduce future payments instead of shortening the term",
        "Rate changes once your current fixed or tracker deal ends",
        "Whether your allowance resets on the calendar year or your mortgage anniversary",
        "Whether overpaying beats saving or investing elsewhere, which depends on your rate versus likely returns after tax",
        "Any fees to set up, increase, or exit an overpayment arrangement",
      ],
    },
    {
      heading: "Worked example",
      paragraphs: [
        "Take a **£250,000** mortgage at 4.5% over 25 years. Without overpaying, it costs £166,874.36 in total interest over the full 300 months. Add a £200 monthly overpayment and total interest drops to £128,416.49 (a saving of £38,457.87), paid off in 239 months, 19 years 11 months, instead of 25 years.",
        "Using the same loan with a £10,000 lump sum instead, and no monthly overpayment, total interest falls to £147,396.74, a saving of £19,477.62, and the term shortens to 279 months, about 1 year 9 months earlier than the original 25 years.",
      ],
    },
  ],
  faqs: [
    {
      question: "Can I overpay my mortgage without a fee?",
      answer:
        "Usually yes, up to a limit. Most UK lenders allow overpayments of around 10% of your outstanding balance each year, free of charge, while on a fixed or discounted deal. Overpaying beyond that can trigger an early repayment charge, so check your lender's terms.",
    },
    {
      question: "Is it better to overpay or reduce the term?",
      answer:
        "They're two sides of the same thing. This calculator keeps your monthly payment the same and lets the term shorten, which is how most lenders apply overpayments by default. Some lenders let you instead keep the term and lower future payments, which suits people who want lower bills now rather than finishing early.",
    },
    {
      question: "Should I overpay or save/invest the money instead?",
      answer:
        "It depends on your mortgage rate versus what you could realistically earn elsewhere after tax, and how much you value a guaranteed return equal to your mortgage rate. This depends on personal circumstances, so it's worth getting independent financial advice rather than relying on a calculator.",
    },
    {
      question: "Does a lump sum or monthly overpayment save more interest?",
      answer:
        "It depends on the total amount and how early it's paid. Money that comes off the balance sooner stops accruing interest for longer, so regular monthly overpayments, even modest ones, often outperform a single lump sum of the same total paid partway through the term. Try both scenarios with your own numbers.",
    },
    {
      question: "What is an early repayment charge?",
      answer:
        "An early repayment charge (ERC) is a fee some lenders apply if you pay off more than your agreed allowance during a fixed, tracker, or discounted deal. It's designed to recover some of the interest the lender expected to earn during that period, and it can also apply if you clear the whole mortgage early.",
    },
  ],
};

export default content;

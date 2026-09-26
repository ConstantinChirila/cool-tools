import type { ToolContent } from "@/lib/tool-content";

export const content: ToolContent = {
  intro: [
    "This car finance calculator puts PCP, hire purchase (HP), a personal loan and a personal lease side by side for the same car, price, deposit and term. For each one you get the monthly payment, what you pay up front and at the end, the total paid, and the real cost once you count what the car is still worth.",
    "Use it when a dealer quotes you a low PCP monthly payment and you want to know what it really costs, when you're deciding between dealer finance and a bank loan, or when a lease deal looks cheap and you want to check it against buying.",
  ],
  sections: [
    {
      heading: "How each type of car finance works",
      paragraphs: [
        "All four spread the cost of a car over time, but they end very differently. Two leave you owning the car, one gives you the choice, and one never does.",
      ],
      bullets: [
        "**Hire purchase (HP)**: you pay a deposit, then equal monthly payments that cover the whole price plus interest. The car belongs to the lender until the last payment and a small option to purchase fee, then it is yours.",
        "**Personal contract purchase (PCP)**: the lender guesses what the car will be worth at the end (the guaranteed minimum future value, or GMFV) and leaves that amount as an optional final payment, the balloon. Your monthly payments only cover the gap, plus interest on the whole amount. At the end you pay the balloon to keep the car, or hand it back and owe nothing more.",
        "**Personal loan**: you borrow from a bank and buy the car outright, so it is yours from day one and you can sell it whenever you like. Loan rates are often lower than dealer finance, but you need a good credit score for the best ones.",
        "**Personal lease (personal contract hire, PCH)**: you rent the car. You pay an initial rental of several months up front, then a fixed monthly rental, and the car goes back at the end. There is no option to buy it.",
      ],
    },
    {
      heading: "Real cost vs total paid",
      paragraphs: [
        "Total paid is every payment you make: deposit, monthly payments, fees and anything due at the end. It is the cash that leaves your account, but it flatters PCP and leasing, because HP and a loan leave you with a car you can sell.",
        "Real cost subtracts what you are left with at the end. For HP, a loan and a PCP you keep, that is the car's value. For a PCP you hand back, it is any equity: if the car is worth more than the balloon, the dealer will usually put the difference towards your next car. A lease leaves you with nothing, so its real cost is its total paid.",
        "The car's value at the end is an estimate. The calculator starts at 20% off each year (51% of the price left after three years), which is a rough rule of thumb for a new car. Look up what a similar car of that age and mileage sells for and enter it for a better answer.",
      ],
    },
    {
      heading: "How the payments are calculated",
      paragraphs: [
        "HP and loan payments use the standard repayment formula: the amount borrowed is cleared in equal monthly payments. A PCP uses the same formula but leaves the balloon outstanding at the end, so each payment is smaller:",
        "M = (P x (1 + r)^n - B) x r / ((1 + r)^n - 1)",
        "Here **M** is the monthly payment, **P** is the price less your deposit, **B** is the balloon (zero for HP and a loan), **n** is the number of months, and **r** is the monthly rate. UK APRs are annual effective rates, so the monthly rate is (1 + APR)^(1/12) - 1 rather than APR divided by 12.",
        "Because the balloon is borrowed for the whole term, you pay interest on it every month even though you never pay it off. That is why a PCP costs more in interest than HP at the same APR.",
        "A lease is not worked out from a rate: the leasing company sets the monthly rental. Enter your quote, including the initial rental. A profile of 6+35 means six rentals up front, then 35 monthly rentals, for a 36-month lease.",
      ],
    },
    {
      heading: "Worked example",
      paragraphs: [
        "A **£25,000** car with a £2,500 deposit over 36 months, dealer finance at 9.9% APR, a personal loan at 6.5% and a lease at £349 a month with six months up front and a £250 fee. The car is expected to be worth £12,750 (51%) at the end, and the PCP balloon is £10,250 (41%).",
      ],
      bullets: [
        "**PCP**: £473.23 a month, £19,536 paid in total if you hand it back, £4,786 of it interest. The car is worth £2,500 more than the balloon, so the real cost is **£17,036**.",
        "**HP**: £720.50 a month, £28,448 paid in total including the £10 option fee. You own a car worth £12,750, so the real cost is **£15,698**.",
        "**Personal loan**: £687.70 a month, £27,257 paid in total with £2,257 of interest. The real cost is **£14,507**, the cheapest here.",
        "**Lease**: £2,344 up front, then 35 rentals of £349, £14,559 in total. You have no car at the end, so the real cost is also **£14,559**.",
      ],
    },
    {
      heading: "What PCP equity and negative equity mean",
      paragraphs: [
        "When a PCP ends, compare what the car is worth with the balloon. If it is worth more, you have equity: you can sell or part-exchange the car, settle the balloon and keep the difference. In the example above that is £2,500, which is why keeping or handing back cost almost the same.",
        "If the car is worth less than the balloon, the GMFV protects you: hand it back and you owe nothing more, as long as it is within the mileage allowance and in fair condition. Paying the balloon to keep a car worth less than it costs you the difference. With the example car worth 35% at the end, handing back costs £19,536 and keeping it costs £21,046.",
      ],
    },
    {
      heading: "Things this calculator doesn't include",
      paragraphs: [
        "It compares the cost of the finance itself, assuming you keep the deal to the end. Worth knowing:",
      ],
      bullets: [
        "Insurance, road tax, servicing and fuel, which cost much the same however you pay",
        "Dealer deposit contributions and discounts: take them off the price or add them to the deposit",
        "Damage charges when a PCP or lease car goes back, beyond fair wear and tear",
        "Early settlement or voluntary termination part way through the term",
        "Lower resale value from high mileage on a car you own: enter a lower end value yourself",
        "Maintenance packages bundled into some lease quotes",
      ],
    },
  ],
  faqs: [
    {
      question: "Is PCP or HP cheaper?",
      answer:
        "At the same APR, HP usually costs less overall because you pay interest on a balance that falls to zero, while a PCP charges interest on the balloon for the whole term. PCP has lower monthly payments, and suits you if you want a new car every few years rather than owning one.",
    },
    {
      question: "What is a balloon payment?",
      answer:
        "It is the optional final payment on a PCP, set at the guaranteed minimum future value: the lender's estimate of what the car will be worth at the end. Pay it and the car is yours; hand the car back and you don't pay it.",
    },
    {
      question: "Is it cheaper to lease or buy a car?",
      answer:
        "Leasing often has the lowest monthly payment and total paid, but you end with nothing. Buying with a loan or HP costs more in cash but leaves you a car to sell, so compare the real cost. It depends mostly on the lease price you're quoted and how much the car holds its value.",
    },
    {
      question: "Why use APR rather than the flat rate?",
      answer:
        "Dealers sometimes quote a flat rate, which charges interest on the full amount borrowed for the whole term and looks about half the APR. The APR is the true annual cost of the borrowing and the figure lenders must show, so it's the one to compare.",
    },
    {
      question: "What happens if I go over the mileage allowance?",
      answer:
        "On a PCP or lease you pay an excess charge for every mile over the allowance when the car goes back, often between 5p and 30p a mile. Driving 13,000 miles a year on a 10,000 allowance for three years at 10p a mile adds £900.",
    },
    {
      question: "Can I end car finance early?",
      answer:
        "Yes. You can settle HP, PCP or a loan early for the balance plus some interest, and under the Consumer Credit Act you can hand back an HP or PCP car once you have paid half the total amount payable. Leases are harder to end early and usually charge a large fee.",
    },
  ],
};

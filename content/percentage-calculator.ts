import type { ToolContent } from "@/lib/tool-content";

const content: ToolContent = {
  intro: [
    "This percentage calculator covers the four questions people actually search for: what X% of a number is, what percentage one number is of another, the percentage change between two numbers, and what a number looks like after you increase or decrease it by a percentage.",
    "Switch between the four tabs above for discounts, VAT, pay rises, exam marks, tips, or working out a percentage change without doing the arithmetic by hand.",
  ],
  sections: [
    {
      heading: "The four percentage calculations",
      paragraphs: [
        "Each tab in the calculator above answers a different question, and each has its own plain formula:",
      ],
      bullets: [
        "**X% of Y**: (X ÷ 100) x Y. For example, 15% of 200 is (15 ÷ 100) x 200 = 30.",
        "**X is what % of Y**: (X ÷ Y) x 100. For example, 40 is (40 ÷ 250) x 100 = 16% of 250.",
        "**Percentage change from X to Y**: ((Y - X) ÷ |X|) x 100, where |X| means the absolute (positive) value of the starting number. Dividing by the absolute value keeps the result sensible even when the starting number is negative.",
        "**Increase or decrease Y by X%**: Y x (1 + X/100) to increase, or Y x (1 - X/100) to decrease. For example, 80 increased by 25% is 80 x 1.25 = 100.",
      ],
    },
    {
      heading: "How to work out a percentage without a calculator",
      paragraphs: [
        "The quickest mental trick is finding 10% first, then scaling. To find 10% of a number, move the decimal point one place left: 10% of 340 is 34. From there, 5% is half of that (17), 20% is double it (68), and 15% is 10% plus 5% (34 + 17 = 51).",
        "For 1%, move the decimal point two places left instead of one, then scale up or down the same way. It's slower than a calculator, but it's fast enough to check a bill or a discount in your head.",
      ],
    },
    {
      heading: "Percentage change vs percentage points",
      paragraphs: [
        "This is a genuinely common mix-up, especially in news coverage of interest rates and tax. If a savings rate rises from 5% to 7%, that's a rise of **2 percentage points**, because you just subtract one percentage from the other (7 - 5 = 2).",
        "But expressed as a percentage change, it's a rise of 40%, because the rate has gone up by 2 out of an original 5: (2 ÷ 5) x 100 = 40%. Both statements describe the same change; they just answer different questions, so it's worth checking which one a headline or a contract actually means.",
      ],
    },
    {
      heading: "Common uses",
      paragraphs: [
        "A percentage calculator earns its keep on everyday numbers, not just homework:",
      ],
      bullets: [
        "Working out a discount, like 30% off a sale price",
        "Adding VAT at the UK standard rate of 20%",
        "Comparing a pay rise or a bonus as a percentage of your current salary",
        "Turning an exam or test score into a percentage",
        "Working out a tip on a restaurant bill",
      ],
    },
    {
      heading: "Worked examples",
      paragraphs: [
        "15% of 200 is 30, using (15 ÷ 100) x 200. 40 is 16% of 250, using (40 ÷ 250) x 100.",
        "Going from 50 to 65 is a percentage change of 30%, using ((65 - 50) ÷ 50) x 100. Increasing 80 by 25% gives 100, using 80 x 1.25. You can plug any of these straight into the tabs above to check them.",
      ],
    },
  ],
  faqs: [
    {
      question: "How do I calculate a percentage of a number?",
      answer:
        "Divide the percentage by 100 and multiply by the number. 20% of 60 is (20 ÷ 100) x 60 = 12. Use the \"% of a number\" tab above to check any figure instantly.",
    },
    {
      question: "How do I work out percentage change?",
      answer:
        "Subtract the starting number from the ending number, divide by the absolute value of the starting number, then multiply by 100. Going from 50 to 60 is ((60 - 50) ÷ 50) x 100 = 20% increase.",
    },
    {
      question: "What is the difference between percentage and percentage points?",
      answer:
        "A percentage point is a simple subtraction between two percentages, while a percentage change compares that difference to the original value. A rate moving from 5% to 7% is a 2 percentage point rise, but a 40% increase relative to the original 5%.",
    },
    {
      question: "How do I add 20% VAT?",
      answer:
        "Multiply the price before VAT by 1.2. A £50 item becomes £50 x 1.2 = £60 including VAT at the UK standard rate.",
    },
    {
      question: "How do I find the original price before a discount?",
      answer:
        "Divide the discounted price by (1 minus the discount as a decimal). If a jacket costs £80 after a 20% discount, the original price was £80 ÷ 0.8 = £100.",
    },
  ],
};

export default content;

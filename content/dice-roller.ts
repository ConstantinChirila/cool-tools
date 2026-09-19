import type { ToolContent } from "@/lib/tool-content";

export const content: ToolContent = {
  intro: [
    "Roll one to five dice at once, from a four-sided d4 up to a d20, and the total is added up for you. Or switch to the coin, call heads or tails, and flip.",
    "Every throw uses your browser's cryptographic random number generator, so each face of a die and each side of the coin is exactly as likely as any other. Nothing is sent anywhere: the roll happens on your device.",
  ],
  sections: [
    {
      heading: "The dice, and what each is used for",
      paragraphs: [
        "These six shapes are the standard set sold for tabletop role-playing games. A die is named d followed by its number of faces, and a roll is written as the number of dice, then the die: 3d6 means three six-sided dice added together.",
      ],
      bullets: [
        "**d4**: a four-sided pyramid. It has no top face, so it is read at the top corner: the number standing upright at the point is the roll.",
        "**d6**: the ordinary cube, marked with pips. Used by most board games.",
        "**d8**: an octahedron, two pyramids base to base.",
        "**d10**: ten kite-shaped faces. Here it is numbered 1 to 10; many physical d10s read 0 to 9, with the 0 counted as 10.",
        "**d12**: a dodecahedron with twelve pentagonal faces.",
        "**d20**: an icosahedron with twenty triangular faces. The die that decides most things in Dungeons & Dragons.",
      ],
    },
    {
      heading: "Dice odds worth knowing",
      paragraphs: [
        "On a single fair die every face is equally likely, so the chance of any one number is 1 divided by the number of faces: about 16.7% on a d6, 5% on a d20. The average roll of a die is half of its highest face plus one, so 3.5 on a d6 and 10.5 on a d20.",
        "Adding dice together changes the picture. With two d6, the totals are not equally likely: there is one way to make 2 (1 + 1) but six ways to make 7, so 7 comes up in 6 of the 36 combinations, about 16.7% of the time, while 2 and 12 come up just 2.8% of the time each. The more dice you add, the more the totals bunch around the middle.",
        "Rolling two d20 and keeping the higher one, which D&D calls **advantage**, lifts the average from 10.5 to 13.825 and nearly doubles the chance of a 20, from 5% to 9.75%. Keeping the lower one (disadvantage) drops the average to 7.175.",
      ],
    },
    {
      heading: "Is a coin flip really 50/50?",
      paragraphs: [
        "This one is: heads and tails are each drawn with a probability of exactly one half, and no flip has any memory of the ones before it. After five heads in a row, the chance of heads on the next flip is still 50%. Expecting tails to be due is the gambler's fallacy.",
        "Streaks are far more common than they feel. In 100 fair flips there is roughly an 81% chance of seeing the same side at least six times in a row somewhere in the sequence, and about a 54% chance of a run of seven. The tally beside the coin tracks your longest streak, so you can watch this happen.",
      ],
    },
    {
      heading: "Settling things fairly",
      paragraphs: [
        "A coin is the simplest fair way to choose between two options: pick who calls, call it before the flip, and agree beforehand that the result stands. For more than two options, give each a number and roll a die with at least that many faces, rolling again if a spare number comes up.",
      ],
      bullets: [
        "Two options: flip the coin",
        "Three options: roll a d6, with 1 to 2, 3 to 4 and 5 to 6 as the three choices",
        "Up to twenty options: number them and roll the d20, re-rolling any number with no option attached",
        "Picking who goes first in a game: everyone rolls the same die, highest goes first, ties roll again",
      ],
    },
  ],
  faqs: [
    {
      question: "Are the dice rolls really random?",
      answer:
        "Yes. Each roll is drawn from your browser's cryptographic random number generator, and draws that would make some faces slightly more likely than others are thrown away and redrawn. The animation is decoration: the result is decided first, then the die is shown landing on it.",
    },
    {
      question: "How do I read the d4?",
      answer:
        "Read the number at the top corner. A four-sided die always lands with a point up rather than a face, so the roll is the number standing upright at that point, which is the same on each face you can see.",
    },
    {
      question: "Can I roll more than one die at once?",
      answer:
        "Yes, up to five of the same kind. The big number is the total and the line beside it shows what each die rolled, so 3d6 might read 4 + 6 + 2 with a total of 12.",
    },
    {
      question: "What is the most likely total on two six-sided dice?",
      answer:
        "Seven. Six of the 36 possible combinations add up to 7, which is about a 16.7% chance, more than any other total. The least likely totals are 2 and 12, at about 2.8% each.",
    },
    {
      question: "Is heads or tails more likely?",
      answer:
        "Neither. Each flip here is exactly 50/50 and independent of the last, so a run of heads does not make tails more likely next time. Over many flips the split drifts towards even, but short runs of one side are normal.",
    },
    {
      question: "Does the page remember my rolls?",
      answer:
        "Only while it is open. The last eight throws and the coin tally are kept on the page and vanish when you reload or press Clear. The page address does keep your setup (dice or coin, how many dice, which die), so a shared link opens the same way.",
    },
  ],
};

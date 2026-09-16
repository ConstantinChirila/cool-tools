import type { ToolContent } from "@/lib/tool-content";

export const content: ToolContent = {
  intro: [
    "This arrow spine calculator shows how cutting a shaft or changing point weight shifts an arrow's effective spine away from the label, and whether the modified setup acts stiffer or weaker. It also gives a nearest standard spine size and a rough draw-weight equivalent.",
    "Use it when cutting arrows to a new draw length, trying a different point weight, or asking what spine arrow do I need after changing either one.",
  ],
  sections: [
    {
      heading: "Static spine vs dynamic spine",
      paragraphs: [
        "The number on a shaft, like 500, is its **static spine**, defined by the ASTM F2031 test: support the shaft on a 28-inch span, hang a 1.94 lb weight from the middle, and measure the deflection in thousandths of an inch. A 500 spine shaft deflects 0.500 inches; a 400 shaft, stiffer, deflects only 0.400 inches.",
        "That's measured on a bare, standard-length shaft, not your arrow. Dynamic (effective) spine is how it behaves once you account for cut length and point weight, the dynamic spine vs static spine gap this calculator estimates.",
      ],
    },
    {
      heading: "How arrow length changes effective spine",
      paragraphs: [
        "A shaft behaves like a beam, and beam stiffness scales with the cube of the unsupported length, so even a small trim has an outsized effect. The calculator scales static spine by (new length ÷ old length) cubed. Cutting a 500 spine, 29-inch shaft to 28 inches, point weight unchanged, drops it to about 450, roughly 50 stiffer than the label.",
      ],
    },
    {
      heading: "How point weight changes effective spine",
      paragraphs: [
        "A heavier point adds mass at the front, increasing the load the shaft resists as it flexes off the string, so it acts weaker. The calculator uses the field heuristic of about 25 spine per 25 grains on a mid-range (400) shaft, scaled to your shaft's own spine: on a 500 spine shaft, 100 to 125 grains adds about 31 effective spine. It's an averaged heuristic, not manufacturer data.",
      ],
    },
    {
      heading: "Reading the result",
      paragraphs: [
        "The headline number is the **effective spine**, what static spine your modified arrow now behaves like. Alongside it sit the nearest standard commercial size and a draw-weight equivalent, a rough guide to how much draw weight would need to change for a similar effect. Neither is a tuning target by itself, they show the size and direction of the change.",
      ],
    },
    {
      heading: "What this calculator doesn't include",
      paragraphs: ["Several big factors in effective spine aren't modelled here:"],
      bullets: [
        "Bow type and cam aggressiveness, string material, and release style (finger vs mechanical)",
        "Nock, insert and fletching weight",
        "Differences between manufacturers' own spine charts, which don't always agree with each other or this heuristic",
      ],
    },
    {
      heading: "Worked example",
      paragraphs: [
        "Start with a 500 spine shaft, 29 inches, 100 grain point, the calculator's own default. Cutting to 28 inches alone makes it about 50 stiffer; a 125 grain point alone weakens it by about 28 to 31 spine. Combined, they don't fully cancel: the arrow ends up at an effective spine of about 478, close to a 500 spine shaft, and about 1.3 lb stiffer in draw-weight terms. Confirm any build with paper or bare-shaft tuning.",
      ],
    },
  ],
  faqs: [
    {
      question: "Does cutting an arrow make it stiffer or weaker?",
      answer:
        "Stiffer. Shortening the unsupported length lowers how far the shaft deflects under load, and a lower number means a stiffer arrow.",
    },
    {
      question: "What happens if my arrow spine is too weak?",
      answer:
        "A too-flexible arrow bends excessively around the rest or riser, usually showing as poor groups, visible porpoising or fishtailing.",
    },
    {
      question: "What happens if my arrow spine is too stiff?",
      answer:
        "It doesn't flex enough to clear the riser cleanly, which tends to push groups the other way at different distances.",
    },
    {
      question: "How much does 25 grains of point weight change spine?",
      answer:
        "Roughly 25 spine on a mid-range (400) shaft. It scales with your shaft's own spine, so on a 500 spine shaft the same 25 grains works out closer to 31 spine.",
    },
    {
      question: "Should I trust this over the manufacturer's chart?",
      answer:
        "No. Use it to understand the direction and rough size of a change, not as a replacement for the chart or for paper and bare-shaft tuning.",
    },
    {
      question: "What is the difference between 400 and 500 spine?",
      answer:
        "Under ASTM F2031, a 400 spine shaft deflects 0.400 inches and a 500 deflects 0.500 inches under the same test, so 400 is stiffer, generally matched to higher draw weights.",
    },
  ],
};

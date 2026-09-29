import type { ToolContent } from "@/lib/tool-content";

export const content: ToolContent = {
  intro: [
    "This raised bed calculator works out how much soil fills your beds and splits it into a mix of topsoil, compost and manure. Put in the inside length, width and soil depth, how many beds you're building, and the mix you want.",
    "It gives the volume of each ingredient, the cheapest way to buy it in bags or bulk bags, the scaffold boards, sleepers or decking boards and posts to build the beds with a cut list, and an estimate of the whole cost.",
  ],
  sections: [
    {
      heading: "How much soil does a raised bed need?",
      paragraphs: [
        "Multiply the **inside** length by the inside width by the depth of soil, all in metres. Measure inside the boards, because that's the space you fill: on a bed made of 38 mm scaffold boards, the outside is 7.6 cm bigger each way.",
        "**Example**: a bed 2.4 m long and 1.2 m wide, filled 45 cm deep, holds 2.4 × 1.2 × 0.45 = **1.296 m³**, or about 1,300 litres. Add 15% for settling and you need **1.49 m³**. Two beds that size need twice as much.",
        "Raised beds take more soil than people expect. That one bed is 30 bags of 50 litres, which is why the calculator compares bags with bulk bags for each ingredient.",
      ],
    },
    {
      heading: "What soil mix to use",
      paragraphs: [
        "There's no single right mix, but most follow the same idea: topsoil gives the bed body and holds water, compost and manure feed it and keep it open. The calculator starts with three common mixes you can adjust:",
      ],
      bullets: [
        "**Classic, 50% topsoil, 30% compost, 20% manure**: a good all-round mix for vegetables.",
        "**Topsoil and compost, 60/40**: simpler to buy, fine for flowers, herbs and most veg.",
        "**All compost**: how no-dig growers fill beds. It's lighter and richer, but sinks more as it breaks down, so expect to top it up.",
      ],
    },
    {
      heading: "Working out each ingredient",
      paragraphs: [
        "Work out the total volume first, including the extra, then take each ingredient's share of it. For the 1.49 m³ bed above in the classic mix: **0.75 m³** of topsoil (50%), **0.45 m³** of compost (30%) and **0.30 m³** of manure (20%).",
        "If your percentages don't add up to 100, the calculator treats them as parts: 2, 1 and 1 is the same as 50%, 25% and 25%. The bar above the boxes always shows the real split, and you can drag its handles to change it.",
        "Use manure that is **well rotted**: dark, crumbly and hardly smelling. Fresh manure can scorch roots.",
      ],
    },
    {
      heading: "Bags or bulk bags?",
      paragraphs: [
        "Each ingredient is priced on its own, because the cheapest way to buy one isn't always the cheapest for another. A large share of topsoil usually works out cheaper in a bulk bag, while a small share of manure is cheaper in a few 50 litre bags.",
        "**Example** at the starting prices: 0.75 m³ of topsoil is one 750 litre bulk bag (£95) rather than 30 bags of 25 litres (£105); 0.45 m³ of compost is 9 bags of 50 litres (£54); 0.30 m³ of manure is 6 bags of 50 litres (£36). That's **£185** of soil for one bed.",
        "The prices are rough 2026 UK figures to get you started. Put in your own supplier's, and leave a price blank to rule that way of buying out.",
      ],
    },
    {
      heading: "How much timber you need",
      paragraphs: [
        "The bed needs enough rows of boards to reach the soil depth: a 45 cm deep bed is two scaffold boards (225 mm each) high. On each row, one pair of sides runs past the ends of the other pair, so those pieces are cut twice the board thickness longer.",
        "The calculator lists every piece, then fits them into the board lengths you buy with room for a saw cut, trying the sides both ways round to use the fewest boards. A 2.4 × 1.2 m bed two boards high comes out of **four 3.9 m scaffold boards**: each gives one 2.476 m side and one 1.2 m end.",
        "Scaffold and decking boards are screwed to posts inside the corners, with extra posts along sides longer than 1.5 m so they don't bow. The 2.4 × 1.2 m bed needs six posts 45 cm long, which come out of two 2.4 m lengths. Sleepers are heavy enough to stack without posts.",
      ],
    },
    {
      heading: "Common raised bed timber",
      paragraphs: ["The calculator starts with these standard UK sizes. You can change the height, thickness, length and price of any of them:"],
      bullets: [
        "**Scaffold boards**: 225 × 38 mm, in lengths up to 3.9 m. Cheap and chunky. Reclaimed boards are cheaper still, but check they're free of paint, oil and splits.",
        "**Sleepers**: 200 × 100 mm, 2.4 m long. Heavy, sturdy and easy to stack. Use new, untreated or pressure-treated softwood sleepers for veg, not old railway sleepers soaked in creosote.",
        "**Decking boards**: 144 × 28 mm, 2.4 to 4.8 m long. Light, easy to cut and sold in long lengths, but thinner than scaffold boards.",
      ],
    },
    {
      heading: "What this calculator assumes",
      paragraphs: ["It's a planning tool, not a quote. It assumes:"],
      bullets: [
        "Rectangular beds, all the same size, filled to an even depth.",
        "15% extra for settling by default. New beds sink as the soil firms and the compost and manure break down.",
        "Weights use typical damp densities (topsoil 1.3, compost 0.7, manure 0.7 t/m³). Real loads vary with moisture.",
        "Posts are treated 47 × 50 mm timber from 2.4 m lengths, cut to the height of the boards. If you want them to go into the ground, buy longer ones.",
        "Screws, brackets, liners and membrane are up to you: add them as other bits per bed.",
      ],
    },
  ],
  faqs: [
    {
      question: "How much soil do I need for a 2.4 × 1.2 m raised bed?",
      answer:
        "At 45 cm deep, a 2.4 × 1.2 m bed holds 1.296 m³, about 1,300 litres. With 15% extra for settling, buy about 1.5 m³.",
    },
    {
      question: "What's a good soil mix for a raised vegetable bed?",
      answer:
        "A common mix is 50% topsoil, 30% compost and 20% well-rotted manure. A simpler 60% topsoil and 40% compost also works, and no-dig growers often use compost alone.",
    },
    {
      question: "How deep should a raised bed be?",
      answer:
        "Most vegetables grow well in 30 to 45 cm of soil. Deeper beds suit root crops and poor ground underneath, but take a lot more soil to fill.",
    },
    {
      question: "How many scaffold boards do I need for a raised bed?",
      answer:
        "A 2.4 × 1.2 m bed two boards (45 cm) high takes four 3.9 m scaffold boards: each one gives a long side and an end. The calculator works it out for any size and gives a cut list.",
    },
    {
      question: "Should I buy soil in bags or bulk bags?",
      answer:
        "Once you need most of a bulk bag of one ingredient, the bulk bag is usually cheaper than the same amount in bags. For small amounts, bags win. The calculator compares both for each ingredient, including delivery.",
    },
    {
      question: "Why add extra soil?",
      answer:
        "A freshly filled bed sinks as the soil settles and the organic matter breaks down. About 15% extra keeps the level near the top of the boards.",
    },
  ],
};

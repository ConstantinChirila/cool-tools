import type { ToolContent } from "@/lib/tool-content";

export const content: ToolContent = {
  intro: [
    "This drip irrigation calculator plans a tap-fed watering system for pots, grow bags, hanging baskets, beds and shrubs. Time how fast your tap fills a bucket, group your plants into zones, and it works out how many drippers each zone can run, how long each zone needs on the timer, and how much water it all uses.",
    "It also gives the daily and weekly water and what that costs on a meter, draws the system from the tap to the last dripper, and tells you how much your pipes hold and how long they take to flush.",
  ],
  sections: [
    {
      heading: "Start with the bucket test",
      paragraphs: [
        "A drip system can only run as many drippers at once as your tap can feed. The way to find out is Hozelock's own method: fit the kit's pressure reducer, open the tap fully and time how long it takes to fill a bucket. Litres × 3,600 ÷ seconds gives litres per hour, the unit drippers are sold in.",
        "**Example**: a 10 litre bucket in 40 seconds is 15 litres a minute, or **900 L/h**. Hozelock's worked example is 9 litres in 15 seconds, which is 2,160 L/h.",
        "Water companies must supply at least 0.7 bar at your boundary, and Ofwat's reference level is about 9 litres a minute. If your tap is slower than that, check it's fully open and the filter is clean before blaming the pressure.",
      ],
    },
    {
      heading: "How many drippers per zone?",
      paragraphs: [
        "Don't plan to use every last litre the tap gives: the drippers at the far end need some pressure left. Irrigation designers work to about **75%** of the supply (Rain Bird's rule for a water meter, which carries over well to a garden tap). On a 900 L/h tap that leaves 675 L/h.",
        "Divide that by each dripper's flow for the most drippers a zone can run. **Example**: 675 L/h ÷ 4 L/h is **168 drippers**, or 337 of the 2 L/h kind.",
        "Some kits cap the flow too. Gardena's Master Unit 1000 passes about 1,000 L/h and the 2000 about 2,000 L/h, so the smaller of the kit's limit and your tap is what counts. Hozelock doesn't publish a limit and points you to the bucket test.",
        "If a zone needs more than that, split it: two zones on the same tap run one after the other, and each gets the full flow. **Example**: a 100 m² veg bed with four 2 L/h drippers per m² draws 800 L/h, more than 675, so it becomes **2 zones**.",
      ],
    },
    {
      heading: "How long to run each zone",
      paragraphs: [
        "Run time is the water a plant needs divided by how fast its drippers give it: litres ÷ (drippers per plant × L/h), times 60 for minutes. If you water twice a day, each run gives half.",
        "**Example**: a tomato plant that needs 1.5 litres a day on one 4 L/h dripper needs 1.5 ÷ 4 = 0.375 hours: **about 23 minutes**. Ten pots on the same settings also take about 23 minutes, and four hanging baskets on 2 L/h drippers needing 0.4 litres each take 12. Run one after another from 06:00, the whole garden is done by 06:57.",
        "A long run time isn't wrong, but if a zone runs for more than an hour, a second dripper per plant or a bigger one shortens it.",
      ],
    },
    {
      heading: "How much water plants need",
      paragraphs: [
        "There's no single right figure: it depends on the weather, the pot size and whether the plants are under glass. The starting points in the calculator are:",
      ],
      bullets: [
        "**Hanging baskets**: an RHS trial watered 30 cm baskets with 140 to 380 ml a day, and found a little every day works best. The calculator starts at 0.4 L.",
        "**Pots**: about a tenth of the pot's volume a day in summer, a tip attributed to the RHS. A 30 cm pot holds about 15 litres, so 1.5 L.",
        "**Tomatoes**: 1.5 L a plant a day in high summer, a rule of thumb (a grow bag of three is often given about 2 litres a day in July, more in a hot greenhouse).",
        "**Veg beds**: the RHS suggests about 24 L/m² every 7 to 10 days for a densely planted bed, roughly 3 L/m² a day.",
        "**Shrubs**: 4 L a day is a rough figure for young shrubs in dry weather. Established shrubs in the ground rarely need watering at all.",
      ],
    },
    {
      heading: "Water use and cost",
      paragraphs: [
        "Every litre the drippers give is a litre through your meter, so the daily water is just plants × litres each, added up across the zones.",
        "**Example**: 6 tomatoes, 10 pots and 4 baskets use 9 + 15 + 1.6 = **25.6 litres a day**, about three watering cans, or 179 litres a week.",
        "On a meter you pay for water and sewerage together, garden water included: about £4.20 per 1,000 litres with Thames Water and £5.51 with United Utilities in 2026/27. At £4.50, that week costs **about 81p**. Drip is about as cheap as watering gets, because the water goes straight to the roots.",
      ],
    },
    {
      heading: "Flushing the pipes",
      paragraphs: [
        "Grit and algae settle in drip lines and block drippers. To flush, take the end caps off and run the water until it comes out clear, which should take a minute or two. University of California advice is to flush at the start of the season and every 2 to 3 weeks, more often if it takes longer to clear.",
        "Flushing only works if the water moves fast enough to lift the grit: at least **0.3 m/s** (1 foot a second), the figure in the ASAE drip standard. In a 13 mm supply pipe, about 10.4 mm inside, that takes about 92 L/h, which almost any tap manages.",
        "**Example**: 15 m of 13 mm supply pipe holds 1.27 litres and 10 m of 4 mm micro tube another 0.13, so 1.4 litres in all. A 900 L/h tap pushes that through in about 6 seconds, so keep it running until it's clear rather than timing it.",
      ],
    },
    {
      heading: "What this calculator assumes",
      paragraphs: ["It's a planning tool for small tap-fed kits, not a design for a pumped system. It assumes:"],
      bullets: [
        "Every dripper in a zone gives its rated flow. Pressure-compensating drippers do, cheap ones give less at the far end of a long line.",
        "Zones run one after another, never together, as they do on a multi-outlet tap timer.",
        "Plant water figures are summer starting points. Watch the plants and the soil, and change them.",
        "Pipe inside diameters are 10.4 mm for 13 mm supply pipe (worked out from Hozelock's 1.3 mm wall), 13.6 mm for 16 mm LDPE and 4 mm for micro tube.",
      ],
    },
  ],
  faqs: [
    {
      question: "How many drippers can I run off one tap?",
      answer:
        "Time a bucket filling with the tap fully open, work out litres per hour, then take 75% of it and divide by the dripper flow. A tap that fills 10 litres in 40 seconds gives 900 L/h, enough for about 168 drippers of 4 L/h at once.",
    },
    {
      question: "How long should I run a drip irrigation system?",
      answer:
        "Divide the water a plant needs by the dripper flow. A tomato needing 1.5 litres a day on one 4 L/h dripper needs about 23 minutes; on a 2 L/h dripper, 45 minutes.",
    },
    {
      question: "What is a drip irrigation zone?",
      answer:
        "A group of plants on one line that the timer waters together. Plants with similar needs share a zone, and zones run one after another so each gets the tap's full flow.",
    },
    {
      question: "How much water does a drip system use?",
      answer:
        "Exactly what the plants get: plants × litres each. Six tomatoes, ten pots and four hanging baskets use about 25.6 litres a day, around 81p a week on a meter at £4.50 per 1,000 litres.",
    },
    {
      question: "How do I flush drip irrigation lines?",
      answer:
        "Take the end caps off and run water through until it comes out clear, usually a minute or two. Do it at the start of the season and every 2 to 3 weeks while the system is in use.",
    },
    {
      question: "Should I water in the morning or the evening?",
      answer:
        "Early morning is best: less water is lost to the sun and the leaves dry before night. In a heatwave, pots and grow bags may need a second run in the evening.",
    },
  ],
};

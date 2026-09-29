import type { ToolContent } from "@/lib/tool-content";

export const content: ToolContent = {
  intro: [
    "This lawn calculator works out how much grass seed or how many rolls of turf your lawn needs. Measure the lawn as one or more rectangles, circles or known areas, then take out paths, beds, sheds and ponds as cut-outs.",
    "Pick a new lawn from seed, a new lawn from turf, or overseeding an old one. It adds the topsoil or top dressing, starter feed and water to get the grass going, and gives the cheapest way to buy each and the cost of the whole job.",
  ],
  sections: [
    {
      heading: "Measuring your lawn",
      paragraphs: [
        "Break the lawn into simple shapes and measure each in metres (or feet). A rectangle is length times width; a round lawn is worked out from the distance across. If you already know the area, type it in.",
        "Then add a cut-out for anything inside the lawn that won't be grass: a shed base, a path, a flower bed or a pond. Each one is taken off the total.",
        "**Example**: a garden 8 m by 5 m is 40 m². Take out a 2 × 1.5 m shed (3 m²) and there's **37 m²** of lawn.",
      ],
    },
    {
      heading: "How much grass seed do you need?",
      paragraphs: [
        "Multiply the lawn's area by the sowing rate on the packet. Johnsons, one of the UK's biggest seed brands, sows a new lawn at **35 g per m²** and overseeds at **25 g per m²**. Other brands range from about 30 to 50 g/m² for a new lawn, so check yours.",
        "**Example**: 37 m² at 35 g/m² is 1,295 g, about **1.3 kg**: one 1.5 kg pack. Overseeding the same lawn at 25 g/m² takes 925 g.",
        "The RHS suggests sowing half as much again where birds take the seed. Sowing much thicker than the packet says doesn't give a better lawn: the seedlings crowd each other out.",
      ],
    },
    {
      heading: "How much turf do you need?",
      paragraphs: [
        "A standard UK turf roll is 1.64 m long and 0.61 m wide, which is **1 m²**. So the number of rolls is the lawn's area in m², plus a little extra for cutting round edges.",
        "Rolawn, one of the largest UK turf growers, adds **5%** for cutting and shaping, and up to 10% for curves and awkward corners.",
        "**Example**: 37 m² plus 5% is 38.85 m², so order **39 rolls**. At about £5 a roll delivered, that's around £195.",
        "Turf is priced on a sliding scale: under about 40 m² it costs more per roll, because delivery is built into the price, and many growers won't deliver fewer than 10 rolls.",
      ],
    },
    {
      heading: "Topsoil and top dressing",
      paragraphs: [
        "Grass needs good soil underneath. Rolawn wants the ground under a new lawn cultivated to at least 10 cm, ideally 15 cm. If your soil is decent, dig it over and use what's there. If it's poor, stony or needs levelling up, spread new topsoil.",
        "**Example**: 10 cm of topsoil over 37 m² is 3.7 m³, or about 4.3 m³ with 15% extra for settling. That's a lot of soil, several bulk bags, and it's often the biggest cost of a new lawn, which is why it's switched off to start with.",
        "Overseeding is different. After sowing, brush a thin **top dressing** of sandy loam, sharp sand and a little compost into the lawn. The RHS uses **2–3 kg per m²**, about a shovelful, which is only 2 mm or so deep: enough to cover the seed without smothering the grass. For 37 m² at 2.5 kg/m², that's 92.5 kg, or four 25 kg bags.",
      ],
    },
    {
      heading: "Starter feed",
      paragraphs: [
        "A pre-seed or pre-turf feed, raked into the surface just before you sow or lay, gives young roots the phosphate they need. Rolawn's is spread at **40 g per m²**, and the RHS suggests about 35 g/m² before laying turf.",
        "**Example**: 37 m² at 40 g/m² is 1.48 kg: one 2 kg box. Johnsons also feeds on the day it overseeds.",
      ],
    },
    {
      heading: "How much water a new lawn needs",
      paragraphs: [
        "New turf and seed both need watering until the grass roots into the soil below. Turf growers agree on how often, but not on how much, so the calculator uses a rule of thumb for dry weather:",
      ],
      bullets: [
        "**Turf**: 10 litres per m² every day for two weeks, then three times a week for another two. Rolawn waters daily for the first fortnight, Lindum twice a day for the first week.",
        "**New seed**: 5 litres per m² every day for two weeks to keep the seed bed moist, then 10 litres per m² twice a week until week six.",
        "**Overseeding**: the same as new seed, but for four weeks.",
      ],
    },
    {
      heading: "What the water costs",
      paragraphs: [
        "One litre per m² is the same as 1 mm of rain. For the 37 m² lawn, the turf plan adds up to 7,400 litres and the seed plan to 5,550 litres.",
        "On a water meter you pay for water and sewerage together, even for water used in the garden: about £4.20 per 1,000 litres with Thames Water and £5.50 with United Utilities in 2026/27. At £4.50, watering in new turf on the 37 m² lawn costs about **£33**. Every day it rains, you save a watering.",
      ],
    },
    {
      heading: "What happens next",
      paragraphs: [
        "The RHS says seed germinates in 7 to 10 days and comes up best sown in early autumn or mid-spring, when the soil is warm and moist. Give a new seeded lawn its first cut when it's 5–7.5 cm tall, taking off no more than a third, and use it as little as you can for about eight months.",
        "Turf is a lawn on day one, but keep off it for about two weeks while it roots, and give it its first cut about three weeks after laying.",
      ],
    },
    {
      heading: "What this calculator assumes",
      paragraphs: ["It's a planning tool, not a quote. It assumes:"],
      bullets: [
        "Prices are rough 2026 UK figures to get you started. Put in your own supplier's.",
        "Seed is bought as the cheapest mix of your small and big pack sizes; feed in whole packs.",
        "Top dressing weighs about 1.5 tonnes per m³ and topsoil 1.3, for the bag counts and weights.",
        "The watering litres are a rule of thumb for dry weather. Real needs depend on the weather, the soil and the season.",
      ],
    },
  ],
  faqs: [
    {
      question: "How much grass seed do I need per square metre?",
      answer:
        "Johnsons sows a new lawn at 35 g per m² and overseeds at 25 g per m². Other brands suggest 30 to 50 g/m² for a new lawn, so follow the rate on your packet.",
    },
    {
      question: "How many turf rolls do I need?",
      answer:
        "A standard UK roll covers 1 m², so you need one roll per square metre of lawn plus about 5% for cutting. A 37 m² lawn takes 39 rolls.",
    },
    {
      question: "How do I take a shed or path out of my lawn area?",
      answer:
        "Measure the whole area, then add the shed, path, bed or pond as a cut-out. The calculator takes each cut-out off the total before working out seed or turf.",
    },
    {
      question: "How much top dressing do I need when overseeding?",
      answer:
        "The RHS uses 2 to 3 kg per m², about a shovelful, brushed into the grass. That's only about 2 mm deep, so a 40 m² lawn needs around 100 kg.",
    },
    {
      question: "How much water does new turf need?",
      answer:
        "Water it the day it's laid, then every day for about two weeks in dry weather, then a few times a week until it roots. As a rule of thumb, 10 litres per m² each time.",
    },
    {
      question: "Is seed or turf cheaper?",
      answer:
        "Seed is far cheaper: a 37 m² lawn needs about £18 of seed against about £195 of turf. Turf gives you a lawn straight away and is usable in a few weeks; seed takes months.",
    },
  ],
};

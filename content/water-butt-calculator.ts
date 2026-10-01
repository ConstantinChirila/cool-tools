import type { ToolContent } from "@/lib/tool-content";

export const content: ToolContent = {
  intro: [
    "This water butt calculator works out how much rain your roof sends down a downpipe, what size of water butt suits your garden, how often it would overflow or run dry, and what it saves on a water meter.",
    "Pick the roof, measure it from above, choose the nearest of 13 UK places for its rainfall and say how much water the garden takes in a dry summer week. The calculator runs a butt through 30 years of simulated daily weather and shows a typical year day by day.",
  ],
  sections: [
    {
      heading: "How much rain does a roof collect?",
      paragraphs: [
        "One millimetre of rain on one square metre is one litre. So the rain off a roof is its area times the year's rainfall, less what never reaches the butt: rain that soaks into the roof, evaporates or blows off, and what the downpipe diverter or filter lets go past.",
        "Measure the roof's **plan area**, its footprint as seen from above, not the sloping surface. Rain falls more or less straight down, so a steep roof catches no more than a flat one of the same footprint. The British Standard for rainwater harvesting (BS 8515, now BS EN 16941-1) works the same way.",
        "Most house roofs drain into two or more downpipes, and a butt only gets its own downpipe's share. A 10 × 5 m roof split front and back between two downpipes gives each one 25 m².",
        "**Example**: 25 m² of tiled roof in London, where the Met Office average is 615 mm a year. Tiles shed about 90% of the rain and a diverter passes about 90% of that: 25 × 615 × 0.9 × 0.9 is about **12,450 litres a year**. That's far more than most gardens use: the catch is that most of it falls in autumn and winter.",
      ],
    },
    {
      heading: "Roof types and runoff",
      paragraphs: ["The runoff coefficient is the share of rain that reaches the gutter. The calculator uses the BS 8515 and CIRIA C753 figures:"],
      bullets: [
        "**Metal sheet**: 0.95",
        "**Tiles or slate**: 0.9 (the Environment Agency uses 0.8, so a tiled roof may give a little less)",
        "**Flat, smooth membrane or bitumen**: 0.8",
        "**Flat with gravel**: 0.6",
        "**Green (sedum) roof**: 0.5",
        "**Greenhouse glass and shed felt**: no standard gives these, so glass is taken as metal (0.95) and felt as a smooth flat roof (0.8)",
      ],
    },
    {
      heading: "What size water butt do you need?",
      paragraphs: [
        "A bigger butt catches more of the rain that would otherwise overflow, so it carries the garden through longer dry spells. But each extra litre of size helps less than the last: once the butt holds enough to bridge a typical dry spell, the rest sits full and unused.",
        "The calculator tries every size from nothing to 2,000 litres in the same weather, and recommends the smallest common size (100, 160, 210, 250, 300, 350, 500 or 1,000 litres, or several linked) that gets 90% of the water 2,000 litres would. The chart under the result shows that curve, so you can see where it flattens.",
        "**Example**: the London roof above, with a patio of pots and baskets that takes 80 litres in a dry summer week. A **210 litre** butt covers about 93% of the garden's water; going bigger adds almost nothing. A veg patch at 300 litres a week needs far more: a 210 litre butt covers under 60% of it, and it takes about 1,500 litres of butts to get close to what's possible.",
        "BS 8515's quick rule sizes a tank at 5% of the yearly yield or the yearly use, whichever is less (about 18 days' worth). It's meant for toilets and washing machines that use water every day, so it undersizes a garden butt, whose water is all needed in summer.",
      ],
    },
    {
      heading: "How the simulation works",
      paragraphs: [
        "A yearly total can't say how often a butt overflows or runs dry: that depends on how the rain falls, day by day. So the calculator builds 30 years of daily weather from the Met Office 1991–2020 averages for your place: how much rain falls each month and on how many days it rains at least 1 mm.",
        "Wet days cluster into spells, and each month is wetter or drier from year to year, so some summers have long dry runs and some are washouts. Each day, rain runs into the butt first and anything over the brim overflows; then, on a dry day, the garden takes what it needs. The butt starts full on 1 January.",
        "Garden use follows the season: your dry summer week in July, about 90% of it in June and August, 60% in May, half in September, less in spring and autumn and nothing from November to February. A day with 1 mm of rain or more needs no watering. These shares are a rule of thumb, not measured.",
        "The weather is made up from averages, not real records, so treat overflow and dry days as a guide. Real droughts like 2018 and 2022 can be longer than anything the simulation throws up.",
      ],
    },
    {
      heading: "How much does a water butt save?",
      paragraphs: [
        "Only if you're on a water meter. Metered households in England and Wales pay for the water and for sewerage on most of it, garden water included: in 2026/27 that's about £4.21 per 1,000 litres with Thames Water and £5.51 with United Utilities. Some companies charge sewerage on 90–95% of the water, so the true saving is a little less.",
        "**Example**: the 210 litre butt above gives the pots about 1,060 litres a year, worth about **£4.80** at £4.50 per 1,000 litres. Even the big veg garden saves only £10 to £20 a year, so a butt takes a few years to pay for itself. The bigger wins are water in a hosepipe ban and plants that prefer rainwater, especially acid lovers like blueberries and camellias.",
        "Households in Scotland and Northern Ireland don't pay by the litre, so a butt saves water but not money there.",
      ],
    },
    {
      heading: "Getting the most from a water butt",
      bullets: [
        "Fit a **downpipe diverter**: it fills the butt and sends rain down the drain once it's full, so nothing spills over the lid.",
        "Put a butt on **every downpipe** you can reach, including the shed and greenhouse. Two small butts on two roofs beat one big butt on one.",
        "**Link butts** with a connector kit to add capacity on one downpipe.",
        "Stand the butt on a **stand or blocks** so a watering can fits under the tap.",
        "Keep the **lid on**: it keeps out light (no algae), leaves, mosquitoes and children.",
      ],
      paragraphs: [],
    },
  ],
  faqs: [
    {
      question: "How much water does a roof collect?",
      answer:
        "About 1 litre for every square metre of roof (measured from above) for every millimetre of rain, less 10–20% that never reaches the butt. A 25 m² roof in London, at 615 mm a year, sends about 12,450 litres a year to its downpipe.",
    },
    {
      question: "What size water butt should I get?",
      answer:
        "For a garden of pots and baskets, a standard 200–250 litre butt usually covers most of the summer. Veg patches and greenhouses need much more, often 500–1,000 litres or several butts linked together. Put your garden in the calculator to see where more size stops helping.",
    },
    {
      question: "How often will my water butt overflow?",
      answer:
        "Often, and mostly in winter: a typical 210 litre butt on half a house roof is full and overflowing on around 100 days a year. That's normal. A diverter sends the extra down the drain instead of over the lid.",
    },
    {
      question: "Does a water butt save money?",
      answer:
        "Only on a water meter, and not much: a few pounds to about £20 a year for most gardens at 2026/27 prices. The bigger benefits are water during a hosepipe ban and rainwater for plants that dislike hard tap water.",
    },
    {
      question: "Should I measure the sloping roof or the footprint?",
      answer: "The footprint, the area seen from above. Rain falls roughly straight down, so the slope doesn't change how much a roof catches.",
    },
  ],
};

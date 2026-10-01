import type { ToolContent } from "@/lib/tool-content";

export const content: ToolContent = {
  intro: [
    "This solar panel and battery payback calculator works out what a system on your roof would generate, how much of it your home would actually use, what that saves on the bill and earns from export, and how many years it takes to pay for itself.",
    "Set the panels, the nearest of 14 UK places, how much electricity you use and when, your tariff and a battery if you want one. The calculator runs every hour of a year, solar to the home first, then the battery, then the grid, and plays it back as a day you can scrub through.",
  ],
  sections: [
    {
      heading: "How much electricity do solar panels generate in the UK?",
      paragraphs: [
        "About 800 to 1,100 kWh a year for every kWp of panels, depending on where you are and which way the roof faces. The calculator uses PVGIS, the European Commission's solar database, for a south-facing roof at 35°: 1,019 kWh per kWp in London, 1,122 in Plymouth, 947 in Leeds, 853 in Glasgow and 810 in Inverness (run on 1 October 2026 with the usual 14% system losses).",
        "Facing matters almost as much as place. Against a south-facing roof, south-east or south-west gives about 94%, east or west about 79%, a flat roof with panels on low frames about 86%, and north about 53%. Shade from a chimney, a tree or the house next door knocks off more: the calculator's three shade settings are a rough guide, and an installer's survey is the real answer.",
        "**Example**: 4 kWp (about nine panels) on a south-facing London roof makes about **4,080 kWh a year**. December gives a tenth of what June does, and the same roof in Glasgow makes about 3,400 kWh.",
      ],
    },
    {
      heading: "How much of it will you use?",
      paragraphs: [
        "This is the number that decides payback, and the one most quotes gloss over. Panels make power in the middle of the day; most homes use it in the morning and evening. Without a battery, a home that's out all day uses only about a fifth of what the panels make, and the rest is exported for a few pence.",
        "The calculator builds an hourly year for your home from how much you use and when you're in: out in the day, home in the day, or out on weekdays. It then runs the panels' hourly output against it, day by day, with cloudy and clear days thrown in, rather than assuming a flat share.",
        "**Example**: the London roof above with a medium home (2,500 kWh a year, Ofgem's figure from July 2026) that's out on weekdays. The home uses about **950 kWh** of the 4,080 directly (23%) and exports the rest. Home all day it uses about 1,200 kWh (30%); out every day about 850 (21%).",
        "MCS, the installers' standard, gives lower figures still in its self-consumption tables (14–23% for a 4 kWp array without a battery), because real use comes in short spikes, a kettle here and a shower there, that an hourly model smooths out. Treat the calculator's self-use as the optimistic end.",
      ],
    },
    {
      heading: "What do solar panels save?",
      paragraphs: [
        "Two things: the electricity you don't buy, at your import price, and the electricity you sell, at your export price. At the October 2026 price cap of 26.3p a kWh, the 950 kWh used at home saves about **£250 a year**. The 3,100 kWh exported earns about **£375** at 12p, the rate Octopus pays its own customers (most suppliers pay 12–16p to their own customers and 3–6p to everyone else).",
        "So the panels save about **£625 in the first year** against a bill of about £660. With prices rising 3% a year and the panels fading 0.5% a year, that adds up to about £21,600 over 25 years, less £1,000 for a new inverter around year 12.",
        "Payback is where the savings catch up with the cost. The DESNZ/MCS cost data for 2025/26 puts a 4 kWp system at about **£7,100** fitted (there's no VAT until 31 March 2027), so the London roof pays for itself in about **10 years** and ends 25 years about £13,500 ahead.",
        "Export price makes a bigger difference than most people expect. At 4p instead of 12p, the same panels save £375 a year and take 17 years to pay back. If your supplier pays a few pence, switching to one that pays 12–16p is worth more than any extra panel.",
      ],
    },
    {
      heading: "Is a home battery worth it?",
      paragraphs: [
        "A battery stores the day's surplus for the evening, so more of the solar is used at home at 26p instead of being sold at 12p. That gap, 14p a kWh, is all a battery earns on a flat tariff. Adding a 5 kWh battery to the London roof lifts self-use from 23% to about 54%: the bill saving roughly doubles, to about £550, but export income falls to about £225, so the system saves about **£770 a year** instead of £625.",
        "That extra £150 a year has to pay for a battery costing about £3,250 fitted, and a replacement when it wears out (warranties run 10–12 years to 70% capacity). On a flat tariff it never does: the whole system pays back in about **16 years** instead of 10, and ends 25 years about £4,800 worse off than the panels alone.",
        "Batteries come into their own on a **cheap overnight tariff**. EV tariffs such as Octopus Go, E.ON Next Drive and EDF GoElectric charge about 6.5–9.5p a kWh for five to seven hours after midnight and about 30p the rest of the day. A battery fills up at night for the next day and shifts most of the home's use to the cheap rate, as well as storing solar. On such a tariff the 5 kWh battery pays its way: the system saves about £885 a year and pays back in about 10 years, and a battery on its own saves about £395 a year.",
        "The \"Is a bigger battery worth it?\" chart shows the saving at every size from none to 20 kWh. It flattens quickly: once the battery holds a summer day's surplus, extra kWh sit idle. For most homes that's around one day's use, 5–10 kWh.",
      ],
    },
    {
      heading: "How the simulation works",
      paragraphs: [
        "Generation: PVGIS gives each month's output for the place, so December is a tenth of June. Each day gets a cloud factor (seeded from the place, so the same inputs always give the same answer) and its output is spread between sunrise and sunset in a hump that peaks at solar noon.",
        "Use: the home's yearly electricity is spread over the year (winter about 1.4 times summer, as smart-meter studies show) and over the day by the pattern you choose: a morning rush, a quiet house and an evening peak for a home that's out, a flatter day for one that's in.",
        "Each hour, solar serves the home first. Any surplus charges the battery (a tenth is lost on the way) and the rest is exported. Any shortfall comes from the battery, then the grid. In a cheap overnight window the home runs on the grid and the battery charges from it, but only by as much as the coming day would otherwise buy at the day rate, which assumes a perfect forecast; smart tariffs come close.",
        "Each year the panels lose 0.5%, the battery 3% of its capacity, and prices rise by the rate you set. The inverter is replaced in the year you choose and the battery when it reaches the end of its life, at today's price. Payback is the point where savings so far cover everything spent.",
      ],
    },
    {
      heading: "Things to check before you sign",
      bullets: [
        "**Export rates**: the Smart Export Guarantee needs MCS-certified kit and a smart meter, and covers Great Britain only. In Northern Ireland, export is paid through your supplier's own scheme, if at all.",
        "**Connection**: up to 3.68 kW of export (16 A on one phase) connects first and is notified afterwards (G98). Bigger systems need the network operator's approval first (G99), and it may cap export at 3.68 kW.",
        "**VAT**: 0% on solar panels and batteries, fitted, until 31 March 2027, then 5%.",
        "**Finance**: the Warm Homes Loan, from autumn 2026, lends up to £15,000 for panels and £15,000 for a battery at a low or zero rate through MCS installers.",
        "**The quote's own estimate**: an MCS certificate states the expected annual generation. Type it into the calculator in place of the roof figure.",
        "**Standing charge**: solar cuts the unit rate you pay, never the standing charge.",
      ],
      paragraphs: [],
    },
  ],
  faqs: [
    {
      question: "How long do solar panels take to pay for themselves in the UK?",
      answer:
        "About 9 to 13 years for a typical home at 2026 prices: a 4 kWp system costs about £7,100 fitted and saves £550 to £700 a year with a decent export rate. A poor export rate, a north-facing roof or a home that's out all day stretches it; a cheap overnight tariff or working from home shortens it.",
    },
    {
      question: "Is a solar battery worth it?",
      answer:
        "On a flat tariff, usually not: a 5 kWh battery adds about £150 a year to a 4 kWp system's savings and costs about £3,250, plus a replacement inside 25 years. On an EV tariff with a cheap overnight rate it pays its way, because it shifts most of the home's use to the cheap hours as well as storing solar.",
    },
    {
      question: "How much of my solar power will I use myself?",
      answer:
        "Without a battery, about 20–30% for a 4 kWp system on a medium home, more if you're in during the day. A 5 kWh battery lifts that to about 50–60%. The rest is exported.",
    },
    {
      question: "What is the Smart Export Guarantee rate?",
      answer:
        "Suppliers set their own rates. In 2026 most pay 12–16p a kWh to customers who also buy their electricity from them (Octopus pays 12p), and 3–6p a kWh to everyone else.",
    },
    {
      question: "How many kWh do solar panels generate per kWp?",
      answer:
        "About 800 to 1,100 kWh a year per kWp on a south-facing roof, according to PVGIS: 1,019 in London, 1,122 in Plymouth, 947 in Leeds, 853 in Glasgow. East or west facing gives about a fifth less, north about half.",
    },
    {
      question: "Does the calculator include VAT?",
      answer:
        "The typical costs are without VAT, because solar panels and batteries are zero-rated in the UK until 31 March 2027. The electricity prices are what you pay per kWh; electricity VAT is also 0% from October 2026 to March 2027.",
    },
  ],
};

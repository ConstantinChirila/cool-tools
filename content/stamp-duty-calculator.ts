import type { ToolContent } from "@/lib/tool-content";

export const content: ToolContent = {
  intro: [
    "This stamp duty calculator works out the tax on buying a home anywhere in the UK: Stamp Duty Land Tax (SDLT) in England and Northern Ireland, Land and Buildings Transaction Tax (LBTT) in Scotland and Land Transaction Tax (LTT) in Wales. Pick where the property is and how you're buying, and it shows the tax band by band, what other buyers would pay for the same home, and the total cash you need on completion day.",
    "Use it before you make an offer, to see how much a first-time buyer saves, what the second-home surcharge costs, or whether a few thousand pounds off the price drops you into a lower band.",
  ],
  sections: [
    {
      heading: "How stamp duty is worked out",
      paragraphs: [
        "All three taxes are charged in slices, like income tax. Each rate only applies to the part of the price inside its band, so going over a threshold never makes the whole price dearer: only the pounds above it are taxed at the higher rate. The exception is first-time buyer relief in England and Northern Ireland, which is lost on the whole price above £500,000.",
        "**Example**: a £295,000 home in England bought by someone moving home. The first £125,000 is taxed at 0%, the next £125,000 at 2% (£2,500) and the last £45,000 at 5% (£2,250), so the stamp duty is **£4,750**, 1.6% of the price. The tax is rounded down to the pound.",
      ],
    },
    {
      heading: "Stamp duty rates in England and Northern Ireland",
      paragraphs: [
        "SDLT rates for homes bought from 1 April 2025, when the temporary higher thresholds ended:",
      ],
      bullets: [
        "**Up to £125,000**: 0%",
        "**£125,001 to £250,000**: 2%",
        "**£250,001 to £925,000**: 5%",
        "**£925,001 to £1.5 million**: 10%",
        "**Over £1.5 million**: 12%",
      ],
    },
    {
      heading: "First-time buyer relief",
      paragraphs: [
        "In England and Northern Ireland, first-time buyers pay nothing up to £300,000 and 5% on the part between £300,000 and £500,000. A £450,000 first home costs **£7,500** instead of £12,500. Above £500,000 the relief disappears completely and normal rates apply to the whole price, so a £510,000 home costs £15,500 against £10,000 at £500,000: here £10,000 off the price saves £15,500 in all.",
        "In Scotland, first-time buyer relief raises the 0% band from £145,000 to £175,000, which saves up to £600 at any price. Wales has no first-time buyer relief, but its 0% band already runs to £225,000 for everyone.",
        "Everyone buying must be a first-time buyer, meaning they have never owned a home anywhere in the world, including one they inherited, and the home must be where they'll live.",
      ],
    },
    {
      heading: "Second homes and buy-to-let",
      paragraphs: [
        "If you'll own more than one home when you complete, a surcharge applies on purchases of £40,000 or more. Each nation does it differently:",
      ],
      bullets: [
        "**England and NI**: 5% on top of every band, so 5%, 7%, 10%, 15% and 17%. A £300,000 buy-to-let costs **£20,000**.",
        "**Scotland**: the Additional Dwelling Supplement (ADS) adds a flat 8% of the whole price to the normal LBTT. On £300,000 that is £24,000 plus £4,600 LBTT, **£28,600**.",
        "**Wales**: a separate higher-rates table starting at 5% from the first pound, then 8.5%, 10%, 12.5%, 15% and 17%. A £300,000 second home costs **£19,950**.",
      ],
    },
    {
      heading: "Replacing your main home",
      paragraphs: [
        "If you buy a new main home before selling the old one, you pay the surcharge at first. Sell the old home within three years (36 months in Scotland) and you can claim it back. If you sell the old home before or on the day you complete the new one, the surcharge doesn't apply at all. Married couples and civil partners count as one household, so if either owns another home the surcharge applies.",
      ],
    },
    {
      heading: "Non-UK residents",
      paragraphs: [
        "In England and Northern Ireland, buyers who spent fewer than 183 days in the UK in the 12 months before buying pay an extra 2% on every band. It stacks with the other rates: a non-resident first-time buyer pays 2% and 7%, and a non-resident buying a second home pays 7% to 19%. A £300,000 second home costs £26,000 instead of £20,000. Scotland and Wales have no non-resident surcharge.",
      ],
    },
    {
      heading: "Scotland and Wales rates",
      paragraphs: [
        "**LBTT in Scotland**: 0% up to £145,000, 2% to £250,000, 5% to £325,000, 10% to £750,000 and 12% above. A £300,000 home costs £4,600, or £4,000 for a first-time buyer.",
        "**LTT in Wales**: 0% up to £225,000, 6% to £400,000, 7.5% to £750,000, 10% to £1.5 million and 12% above. A £300,000 home costs £4,500.",
      ],
    },
    {
      heading: "The cash you need to buy",
      paragraphs: [
        "Stamp duty is only part of the money due on completion. The calculator adds your deposit, legal fees, a survey and mortgage fees to show the total. With the starting figures, a £300,000 home in England with a £30,000 deposit needs **£38,299**: the deposit, £5,000 stamp duty, £1,800 legal fees, a £500 survey and a £999 mortgage fee.",
        "Your solicitor or conveyancer normally files the return and pays the tax for you from money you send them. It is due within 14 days of completion in England and Northern Ireland, and within 30 days in Scotland and Wales.",
      ],
    },
    {
      heading: "What this calculator doesn't cover",
      paragraphs: ["It covers buying a residential home as a person. It leaves out:"],
      bullets: [
        "Companies buying homes, including the 17% rate on homes over £500,000",
        "Commercial, mixed-use and agricultural property, and leases with rent",
        "Shared ownership, right to buy and buying several homes in one transaction",
        "Past rates: the calculator uses the rates for completions from 1 April 2025",
      ],
    },
  ],
  faqs: [
    {
      question: "How much stamp duty will I pay on a £300,000 house?",
      answer:
        "In England and Northern Ireland, £5,000 if you're moving home, nothing as a first-time buyer, and £20,000 for a second home or buy-to-let. In Scotland it is £4,600 (£4,000 first-time), and in Wales £4,500.",
    },
    {
      question: "Do first-time buyers pay stamp duty?",
      answer:
        "In England and Northern Ireland, not on homes up to £300,000. Between £300,000 and £500,000 they pay 5% on the part above £300,000, and above £500,000 they pay the normal rates on everything.",
    },
    {
      question: "What is the stamp duty threshold in 2026?",
      answer:
        "In England and Northern Ireland, homes up to £125,000 pay no stamp duty, or up to £300,000 for first-time buyers. The thresholds are £145,000 (£175,000 first-time) in Scotland and £225,000 in Wales.",
    },
    {
      question: "How much is stamp duty on a second home?",
      answer:
        "In England and Northern Ireland it is 5% more on every band, in Scotland an extra 8% of the whole price, and in Wales a separate table from 5% to 17%. None of the surcharges apply to properties under £40,000.",
    },
    {
      question: "Can I get the second home surcharge back?",
      answer:
        "Yes, if you were replacing your main home and sell the old one within three years of buying (36 months in Scotland). Claim the refund from HMRC, Revenue Scotland or the Welsh Revenue Authority.",
    },
    {
      question: "When do I pay stamp duty?",
      answer:
        "The return and payment are due within 14 days of completion in England and Northern Ireland, and 30 days in Scotland and Wales. Your solicitor usually handles both.",
    },
  ],
};

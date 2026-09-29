import type { ToolContent } from "@/lib/tool-content";

export const content: ToolContent = {
  intro: [
    "This garden materials calculator works out how much topsoil, compost, mulch, bark, gravel or sand you need for a bed, lawn, path or driveway. Add each area as a rectangle, a circle or a size you already know, cut out anything in the way like a pond or patio, and set the depth by dragging the layer in the side view.",
    "It gives the amount in cubic metres, litres and tonnes, then how many bags or bulk bags that is and the cheapest way to buy it, including a mix of bulk bags topped up with a few bags.",
  ],
  sections: [
    {
      heading: "How to work out how much you need",
      paragraphs: [
        "Every garden material works the same way: **area × depth = volume**. Measure the area in metres, turn the depth from centimetres into metres (divide by 100), and multiply. Then add a little extra for waste and settling.",
        "**Example**: a new border 4 m long and 1.5 m wide, filled with topsoil 25 cm deep, is 4 × 1.5 × 0.25 = **1.5 m³**. Topsoil settles as it firms, so add 15%: **1.725 m³**, or 1,725 litres.",
        "For a round bed, the area is π × radius², or 0.785 × the distance across squared. A bed 3 m across is about **7.07 m²**. For odd shapes, split them into rectangles and circles, or measure the area on a map app and type it in.",
      ],
    },
    {
      heading: "How deep should it be?",
      paragraphs: ["The right depth depends on the job more than the material. These are the depths the calculator suggests:"],
      bullets: [
        "**Topsoil for a new lawn**: 10 to 15 cm. The RHS says at least 10 cm under new turf or seed.",
        "**Topsoil for new beds and borders**: 20 to 30 cm. The RHS suggests about 20 cm or more.",
        "**Lawn top dressing**: about 2 mm (the RHS uses 2 to 3 kg per m², about a shovelful), brushed into the grass.",
        "**Compost dug in to improve soil**: spread 7.5 cm on clay, 5 cm on chalk or 3 cm on sandy soil, then dig it in (Rolawn's guidance).",
        "**Mulch**: the RHS says at least 5 cm and ideally 7.5 cm, or weeds push through.",
        "**Bark on beds and borders**: 5 to 10 cm. Play-grade bark is usually laid 30 cm deep; check the product's fall-height rating.",
        "**Gravel**: 2.5 to 4 cm on a path, 3 to 5 cm on a border over membrane, about 5 cm on a driveway over a compacted sub-base.",
        "**Sharp sand under a patio**: 2.5 to 5 cm, laid loose before compacting.",
      ],
    },
    {
      heading: "Litres, cubic metres and tonnes",
      paragraphs: [
        "One cubic metre is **1,000 litres**. Soil, compost, mulch and bark are sold by the litre in bags and by the litre or cubic metre in bulk bags, so for these the sums are simple: 1.5 m³ is 25 bags of 60 L.",
        "Gravel and sand are sold by weight, so you need the **density** to turn a volume into kilograms. Gravel and sharp sand weigh about 1.6 tonnes per cubic metre, which means an 800 kg bulk bag only holds about **half a cubic metre**, and a 22.5 kg bag is about 14 litres.",
        "Typical densities the calculator uses: bark 0.25 t/m³, green-waste mulch 0.6, compost 0.7, topsoil 1.3, gravel and sand 1.6. Wet material is heavier; you can change the figure under Weight and delivery.",
      ],
    },
    {
      heading: "Bags or bulk bags?",
      paragraphs: [
        "Bags are easy to carry through the house and good for small jobs. Past about half a cubic metre, a bulk bag is usually cheaper per litre and saves dozens of trips, but it arrives on a lorry and has to be left somewhere firm near the road, because it can't be moved once full.",
        "The cheapest option is often a mix: enough bulk bags to cover most of the job and a few bags to finish it, rather than a whole extra bulk bag for the last 200 litres. The calculator tries every combination and shows the cheapest, including any delivery charge.",
        "**Example**: 1.725 m³ of topsoil is 69 bags of 25 L at £3.50 (£241.50), or 3 bulk bags of 750 L at £95 (£285). Two bulk bags and 9 bags covers it for **£221.50**.",
      ],
    },
    {
      heading: "How much extra to allow",
      paragraphs: [
        "Loose topsoil settles by roughly 10 to 15% once it's firmed or rained on, so allow 15% extra for new lawns and beds. Bark settles by 5 to 10% (Melcourt). Gravel and sand barely settle, so 5% is enough for spills and uneven ground.",
        "The extra is added before the bags are counted. The last bag or bulk bag in the result is drawn part full, so you can see how much will be left over.",
      ],
    },
    {
      heading: "What this calculator assumes",
      paragraphs: ["It's a planning tool, not a quote. It assumes:"],
      bullets: [
        "A flat, even depth over each area. On sloping or uneven ground, measure the depth in a few places and use the average.",
        "Typical UK densities for each material. Real loads vary with moisture and grade, so weights are estimates.",
        "Prices start at rough 2026 UK figures. Put in your supplier's prices, and leave one blank to rule that way of buying out.",
        "A 90 litre wheelbarrow carrying at most 140 kg, so heavy materials like sand take more trips than their volume suggests.",
      ],
    },
  ],
  faqs: [
    {
      question: "How much topsoil do I need for a new lawn?",
      answer:
        "At least 10 cm, so 0.1 m³ for every square metre, plus about 15% for settling. A 50 m² lawn at 10 cm needs 5 m³, or about 5.75 m³ with the extra.",
    },
    {
      question: "How many bags of bark do I need per square metre?",
      answer:
        "At 7.5 cm deep, each square metre takes 75 litres of bark, so about one and a quarter 60 litre bags. Add 10% for settling.",
    },
    {
      question: "How much does a bulk bag of gravel cover?",
      answer:
        "An 800 kg bulk bag of gravel holds about 0.5 m³, which covers about 12.5 m² at 4 cm deep or 10 m² at 5 cm.",
    },
    {
      question: "How many litres are in a cubic metre?",
      answer: "1,000 litres. A 750 litre bulk bag is three quarters of a cubic metre, and 1.5 m³ is twenty-five 60 litre bags.",
    },
    {
      question: "How heavy is a cubic metre of topsoil?",
      answer:
        "About 1.3 tonnes when screened and damp, and up to 1.5 tonnes when wet. That's why a tonne bag of topsoil holds only about 0.75 m³.",
    },
    {
      question: "Is it cheaper to buy bags or a bulk bag?",
      answer:
        "For more than about half a cubic metre, a bulk bag is usually cheaper per litre, but not always once delivery is added. A mix of bulk bags and a few bags is often cheapest of all; the calculator compares every combination.",
    },
  ],
};

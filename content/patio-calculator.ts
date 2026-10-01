import type { ToolContent } from "@/lib/tool-content";

export const content: ToolContent = {
  intro: [
    "This patio calculator works out how many paving slabs to order by laying your patio out slab by slab, so every cut is counted and drawn on a plan. It then adds up everything underneath: the MOT Type 1 sub-base, the sharp sand and cement for a full mortar bed, jointing compound or mortar for the joints, and the fall to build in so rain runs off.",
    "Pick porcelain, Indian sandstone or concrete slabs, enter your patio as one or more rectangles, and cut out drains, trees or steps by dragging them on the plan. Prices start at rough 2026 UK figures and can be swapped for your supplier's.",
  ],
  sections: [
    {
      heading: "How the slabs are counted",
      paragraphs: [
        "Slabs are laid from the corner by the house, with the first row against the wall, so full slabs sit where they're seen most and the cuts fall on the far edges. Each slab takes up its own size plus one joint. With 600 × 600 mm porcelain and 5 mm joints, that's 605 mm per slab: a 4.8 m patio fits 7 whole slabs along the house with a 565 mm cut at the end, and 3.6 m away from the house fits 5 rows with a 575 mm row to finish.",
        "That comes to 35 whole slabs and 13 cut pieces. Where cut pieces are small enough to get two or more from one slab, allowing 3 mm for the saw blade, the calculator counts them that way; here every piece is too big to share, so the cuts use 13 slabs. Adding 5% for breakages gives **51 slabs** to order.",
        "Suppliers often tell you to add 10–15% to the area. That allowance covers cuts as well as breakages, so it's higher than you need once the cuts are counted properly. If the plan has lots of notched slabs or it's your first patio, raise the breakage figure.",
        "Offset rows, where every other row starts half a slab in, cut a piece at both ends of those rows. With 900 × 600 slabs on the same patio, offset rows use the same 33 slabs as a grid but make 13 cuts instead of 11.",
      ],
    },
    {
      heading: "Sub-base: MOT Type 1",
      paragraphs: [
        "A patio needs a firm, free-draining base of crushed stone, usually MOT Type 1, laid in two layers and compacted with a plate compactor. Marshalls and Wickes both give **100 mm** for a patio; driveways need 150–200 mm.",
        "Loose MOT compacts down, so the calculator follows Marshalls' method: the compacted volume, times 1.3 for compaction, plus 10% for waste, at 1.6 tonnes per cubic metre. A 4.8 × 3.6 m patio needs about 3.95 t, which is five 800 kg bulk bags. Marshalls' own example, 5 × 5 m at 100 mm, comes to 5.72 t, and so does this calculator.",
      ],
    },
    {
      heading: "Mortar bed: sharp sand and cement",
      paragraphs: [
        "Porcelain and natural stone should be laid on a **full bed of mortar**, not five dabs under each corner: Marshalls says vitrified paving should never go on a spot bed, as the gaps let slabs rock and crack. The usual bed is about 30 mm of sharp sand and cement mixed 4:1.",
        "To turn the bed into bags, the calculator uses Pavingexpert's rule of thumb that mortar needs about 2.1 tonnes of sand and cement per cubic metre, split by the mix. At 4:1 that's 1,680 kg of sand and 420 kg of cement per m³. The 4.8 × 3.6 m patio's 30 mm bed needs about 871 kg of sharp sand and 218 kg of cement, which is 9 bags of 25 kg.",
        "Porcelain has almost no suction, so it needs a primer (a slurry primer, or a mix of SBR, cement and water) brushed onto the back of each slab just before it's laid. Marshalls recommends priming natural stone too.",
      ],
    },
    {
      heading: "Joints: compound or mortar",
      paragraphs: [
        "**Brush-in jointing compound** is swept into the joints of a damp patio and sets in a day or so. It needs joints at least 3 mm wide and 25 mm deep, so under 20 mm porcelain the bed is raked out a little below the slab. Azpects' calculator puts a 12.5 kg tub of EASYJoint at about 6.9 litres of joint; the calculator adds 5% spare, as their coverage table does.",
        "The 4.8 × 3.6 m porcelain patio has about 49 m of joint inside it. At 5 mm wide and 25 mm deep that's 6.4 litres with the spare, so **one tub**. Sandstone with 10 mm joints on the same patio needs two.",
        "**Mortar pointing** suits sandstone and concrete: a wet 4:1 mix pressed into the joints and struck smooth, using the same sand and cement as the bed. Porcelain is normally jointed with compound or an exterior grout, as sand and cement doesn't grip its surface well.",
      ],
    },
    {
      heading: "How much fall does a patio need?",
      paragraphs: [
        "A patio should slope gently away from the house so water runs off. The usual guide is **1 in 60** for riven sandstone and concrete (about 17 mm per metre) and **1 in 80** for smooth porcelain. On the 4.8 × 3.6 m patio, falling across its 3.6 m width, that's 45 mm at 1:80 or 60 mm at 1:60.",
        "Build the fall into the sub-base, not the mortar bed, so the bed stays an even thickness. And keep the finished surface at least 150 mm below the house's damp-proof course, which Marshalls, Wickes and the RICS all give as the minimum.",
      ],
    },
    {
      heading: "Digging out",
      paragraphs: [
        "The dig depth is the slab, bed and sub-base added together: 20 + 30 + 100 = 150 mm for the starting porcelain patio, plus the fall at the low edge. Soil takes up more room once it's dug, about 1.2 to 1.4 times as much according to Pavingexpert, so the calculator multiplies by 1.3. The 4.8 × 3.6 m patio moves about 2.6 m³ of ground, or 3.4 m³ once it's loose: plan for a skip or several bulk bags of spoil.",
      ],
    },
    {
      heading: "What this calculator doesn't cover",
      paragraphs: ["It's built for a straightforward patio on a mortar bed, so bear in mind:"],
      bullets: [
        "Block paving and slabs laid on sand work differently and aren't covered",
        "Curves and circles aren't drawn; add a rectangle that covers them and treat the extra cuts as waste",
        "Two rectangles forming an L are each laid from their own corner, so the calculator may count a few more cuts where they meet than you'd make",
        "Edging, steps, drainage channels, weed membrane, primer and tool hire aren't priced",
        "Densities and coverage are typical figures; check the bags and tubs you actually buy",
      ],
    },
  ],
  faqs: [
    {
      question: "How many patio slabs do I need?",
      answer:
        "Work out how many fit along and across your patio allowing for joints, count a slab for every cut piece unless two pieces come from one, and add about 5% for breakages. A 4.8 × 3.6 m patio in 600 × 600 mm slabs with 5 mm joints needs 51.",
    },
    {
      question: "How deep should the sub-base be for a patio?",
      answer:
        "100 mm of compacted MOT Type 1 is the usual depth for a patio, laid in two layers. Driveways need 150–200 mm.",
    },
    {
      question: "What mix should I use to lay patio slabs?",
      answer:
        "Four parts sharp sand to one part cement is the most common mix for a full mortar bed, about 30 mm deep. Some guides use 5:1 or 6:1.",
    },
    {
      question: "How much fall should a patio have?",
      answer:
        "About 1 in 60 for sandstone and concrete, or 1 in 80 for porcelain, sloping away from the house. That's 17 mm per metre at 1:60 and 12.5 mm per metre at 1:80.",
    },
    {
      question: "How much jointing compound do I need?",
      answer:
        "It depends on the joint width, depth and slab size. A 12.5 kg tub of EASYJoint fills about 6.9 litres of joint, which covers around 13 m² of 600 × 600 slabs with 5 mm joints, 30 mm deep.",
    },
    {
      question: "How far below the damp-proof course should a patio be?",
      answer: "At least 150 mm, about two brick courses, so rain splashing off the patio can't bridge the DPC.",
    },
  ],
};

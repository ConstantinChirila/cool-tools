import type { ToolContent } from "@/lib/tool-content";

export const content: ToolContent = {
  intro: [
    "This TV viewing distance calculator works both ways: tell it your TV size and it shows where to put the sofa, or tell it how far away you sit and it shows what size TV to buy. Drag the sofa across the floor plan to see how much of your view the screen fills from each spot, and resize the TV by dragging its ends.",
    "It also shows whether you sit close enough to see the extra detail of 4K or 8K, so you can tell if a sharper screen is worth paying for in your room.",
  ],
  sections: [
    {
      heading: "How the distance is worked out",
      paragraphs: [
        "What matters is not the distance itself but the **viewing angle**: how wide the screen looks from your seat, measured from one side of the screen to the other. A 55-inch TV at 2 m and a 75-inch TV at 2.7 m look the same size to your eyes.",
        "The calculator uses the two best-known guidelines. **SMPTE**, the body that sets film and TV standards, recommends the screen fill at least **30°** of your view. **THX** recommends about **40°** for a cinema feel (and at least 36° from the back row of a cinema). Anywhere between the two is the sweet spot. In round numbers, that means sitting between **1.2 and 1.6 times the screen's diagonal** away.",
        "**Example**: a 65-inch TV is 1.44 m wide. It fills 40° of your view from 1.98 m and 30° from 2.69 m, so the sweet spot is roughly **2.0 to 2.7 m** from your eyes, with 2.3 m right in the middle.",
      ],
    },
    {
      heading: "Viewing distance for common TV sizes",
      paragraphs: ["The sweet spot (30° to 40°) for each size, measured from your eyes to the screen:"],
      bullets: [
        "**43-inch**: 1.3 to 1.8 m (4 ft 4 in to 5 ft 10 in)",
        "**50-inch**: 1.5 to 2.1 m (5 ft to 6 ft 9 in)",
        "**55-inch**: 1.7 to 2.3 m (5 ft 6 in to 7 ft 5 in)",
        "**65-inch**: 2.0 to 2.7 m (6 ft 6 in to 8 ft 10 in)",
        "**75-inch**: 2.3 to 3.1 m (7 ft 6 in to 10 ft 2 in)",
        "**85-inch**: 2.6 to 3.5 m (8 ft 6 in to 11 ft 6 in)",
      ],
    },
    {
      heading: "What size TV for your room",
      paragraphs: [
        "Turn it round and the same angles give a size range for any seat. From 2.5 m, a TV between **61 and 82 inches** lands in the sweet spot, so a 65 or 75-inch set. From 3 m it is 73 to 99 inches, and from 2 m it is 48 to 66 inches.",
        "Most people who upgrade find the new TV looks huge for a week and then normal. If you're torn between two sizes and the bigger one still lands in the sweet spot, it's usually the one you won't regret.",
      ],
    },
    {
      heading: "When can you see the difference with 4K?",
      paragraphs: [
        "Someone with 20/20 vision can make out detail down to about one arcminute, a sixtieth of a degree. Sit further back than the point where one row of pixels shrinks below that and extra resolution is lost on you.",
        "For Full HD (1080 rows) that point is about **1.56 times the diagonal**; for 4K it is half that. So on a 55-inch TV, you need to sit closer than about **2.2 m** to see any gain from 4K over Full HD, and within 1.1 m to see all of it. 8K only beats 4K within about 0.8 times the diagonal, which is closer than most people sit.",
        "In practice 4K still helps from further back, because 4K sets and streams tend to come with better colour, HDR and less compression. Resolution alone is only one part of a sharp picture, and people with better than 20/20 vision see detail from a little further away.",
      ],
    },
    {
      heading: "How high to mount the TV",
      paragraphs: [
        "Aim for the middle of the screen at your eye height when seated, which is about 1 to 1.1 m (40 to 42 in) off the floor on most sofas. Tilting your head back to look up at a TV over a fireplace gets uncomfortable over a film; if it has to go high, a tilting bracket helps.",
      ],
    },
    {
      heading: "What this calculator assumes",
      paragraphs: ["The numbers are guidelines, not rules. The calculator assumes:"],
      bullets: [
        "A flat 16:9 screen, the shape of almost every TV. Films in wider formats fill less of the height.",
        "Distance measured from your eyes, not from the front of the sofa or the wall behind it",
        "20/20 vision for the detail distances",
        "The 50° 'too close' and 20° 'too far' edges are a rule of thumb; only the 30° and 40° lines come from SMPTE and THX",
      ],
    },
  ],
  faqs: [
    {
      question: "How far should I sit from a 55-inch TV?",
      answer:
        "Between about 1.7 and 2.3 m (5 ft 6 in to 7 ft 5 in), where the screen fills 30° to 40° of your view. To see the extra detail of 4K over Full HD, sit closer than about 2.2 m.",
    },
    {
      question: "How far should I sit from a 65-inch TV?",
      answer:
        "Between about 2.0 and 2.7 m (6 ft 6 in to 8 ft 10 in), with 2.3 m in the middle of the range. 4K detail starts to show within about 2.6 m.",
    },
    {
      question: "What size TV should I get for a 3 m viewing distance?",
      answer:
        "Around 73 to 99 inches fills 30° to 40° of your view from 3 m, so a 75 or 85-inch TV. A 65-inch set fills about 27°, fine for everyday TV but less cinematic.",
    },
    {
      question: "Is there a simple rule for TV viewing distance?",
      answer:
        "Sit between 1.2 and 1.6 times the screen diagonal away. For a 55-inch TV that is 66 to 88 inches, or about 1.7 to 2.2 m.",
    },
    {
      question: "Can you sit too close to a TV?",
      answer:
        "It won't harm your eyes, but past about 50° of your view you'll need to turn your head to follow the action, and on a Full HD screen you may start to see pixels.",
    },
    {
      question: "Is 8K worth it?",
      answer:
        "Only if you sit very close to a very big screen. On a 75-inch TV you would need to be within about 1.5 m to see more detail than 4K, and there is still little 8K content to watch.",
    },
  ],
};

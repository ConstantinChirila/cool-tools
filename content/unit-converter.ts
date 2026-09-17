import type { ToolContent } from "@/lib/tool-content";

export const content: ToolContent = {
  intro: [
    "Type the number you have and pick the unit you want, or just write the question the way you would say it: 45 mpg in l/100km, 11 stone to kg, 6 ft in cm. The converter works out which units you mean, switches to the right category and shows the answer, then lists the same amount in every other unit of that category so you can compare at a glance.",
    "Three hundred units across thirty-two categories, from everyday length, weight, volume and temperature to fuel economy, running pace, pressure, energy, data sizes, blood glucose and more. Bare words follow UK usage, so a pint is 568 ml and mpg means the imperial gallon; the US versions are always named.",
  ],
  sections: [
    {
      heading: "How the conversions are worked out",
      paragraphs: [
        "Every category has one base unit, and each unit is defined by how it maps onto that base. Most are a simple multiplier: an inch is exactly 25.4 millimetres, a pound is exactly 0.45359237 kilograms, a UK gallon is exactly 4.54609 litres. Converting between two units multiplies into the base and divides back out, so the result is as exact as the definitions allow, and the line under the answer shows the factor used.",
        "Temperature scales are the exception because they do not share a zero. Celsius to Fahrenheit is multiply by 1.8 then add 32, and the converter shows that as an offset scale rather than a plain factor.",
      ],
    },
    {
      heading: "Miles per gallon to litres per 100 km",
      paragraphs: [
        "Fuel economy is the awkward one because the two common measures point in opposite directions: mpg counts distance per unit of fuel, while L/100km counts fuel per unit of distance. Doubling one halves the other, so there is no single factor to multiply by. For the imperial gallon the relationship is L/100km = 282.48 ÷ mpg; for the US gallon it is L/100km = 235.21 ÷ mpg.",
        "A car doing **45 mpg (UK)** is using about **6.28 L/100km**, and 30 mpg on the US scale is 7.84 L/100km. The converter marks these reciprocal pairs with a tag under the result, and the everything-at-once list shows the same figure as km per litre and miles per litre too.",
      ],
      bullets: [
        "**UK mpg to L/100km:** 282.48 ÷ mpg",
        "**US mpg to L/100km:** 235.21 ÷ mpg",
        "**UK mpg to US mpg:** multiply by 0.8327 (the US gallon is smaller)",
        "**km/L to L/100km:** 100 ÷ km/L",
      ],
    },
    {
      heading: "UK and US pints, gallons, cups and tons",
      paragraphs: [
        "Several names are shared between the imperial and US customary systems but mean different amounts. The UK pint is 568 ml and the US pint 473 ml; the UK gallon is 4.546 litres and the US gallon 3.785 litres; a US cup in recipes is 237 ml, a metric cup 250 ml. The long ton (UK) is 1,016 kg and the short ton (US) 907 kg.",
        "When you type a bare word the converter assumes the UK meaning. To get the US version, say so: us pint, us gallon, mpg us, short ton. Both versions always appear in the unit picker and in the full list under the result.",
      ],
    },
    {
      heading: "Stone and pounds, feet and inches",
      paragraphs: [
        "A stone is 14 pounds, or exactly 6.35029318 kg, so **11 stone is 69.85 kg** and 70 kg is a little over 11 stone. A foot is 30.48 cm, so 6 ft is 182.88 cm. To convert a mixed figure like 11 st 4 lb or 5 ft 11 in, convert the larger part and add the smaller: 11 st 4 lb is 11 × 6.35 + 4 × 0.4536 = 71.67 kg.",
      ],
    },
    {
      heading: "Gigabytes and gibibytes",
      paragraphs: [
        "Storage is sold in decimal units (1 GB = 1,000,000,000 bytes) but operating systems often report binary ones (1 GiB = 1,073,741,824 bytes), which is why a 500 GB drive shows up as about 466 GiB. The data size category keeps both families, plus bits for network speeds. A 100 Mbit/s connection moves 12.5 megabytes per second.",
      ],
    },
    {
      heading: "Running pace",
      paragraphs: [
        "Pace is another reciprocal unit: minutes per kilometre gets smaller as you run faster. Type it as you would read it off a watch, 5:00 min/km, and the converter reads the colon as minutes and seconds. 5:00 min/km is 12 km/h, 7.46 mph, or 8:03 per mile.",
      ],
    },
    {
      heading: "Precision and sharing",
      paragraphs: [
        "Results show eight significant figures by default and trim trailing zeros, so exact conversions look exact (1 mile is 1.609344 km) and inexact ones do not pretend. Switch to 2 or 4 decimal places for everyday figures, or Max to see fifteen figures. Very large and very small numbers move to exponent form.",
        "The address bar always holds the current category, units and value, so copying the link shares exactly what you are looking at.",
      ],
    },
  ],
  faqs: [
    {
      question: "How do I convert mpg to L/100km?",
      answer:
        "Divide 282.48 by the mpg figure for UK gallons, or 235.21 for US gallons. So 45 mpg (UK) is 6.28 L/100km and 30 mpg (US) is 7.84 L/100km. The relationship is reciprocal: doubling mpg halves the litres per 100 km.",
    },
    {
      question: "How many kg is 11 stone?",
      answer:
        "11 stone is 69.85 kg. One stone is 14 pounds, or exactly 6.35029318 kg, so multiply the stones by 6.35. Going the other way, divide kilograms by 6.35 to get stones.",
    },
    {
      question: "Is a UK pint the same as a US pint?",
      answer:
        "No. A UK (imperial) pint is 568 ml and a US liquid pint is 473 ml, about 17% smaller. The same applies to gallons: 4.546 litres in the UK and 3.785 litres in the US. The converter treats a bare pint or gallon as the UK measure and names the US ones explicitly.",
    },
    {
      question: "Why does my 500 GB drive show as 465 GB?",
      answer:
        "Manufacturers count gigabytes in decimal (1 GB = 1,000,000,000 bytes) while many operating systems count in binary gibibytes (1 GiB = 1,073,741,824 bytes). 500 GB is 465.66 GiB. Nothing is missing, the two units are just different sizes.",
    },
    {
      question: "How do I convert Fahrenheit to Celsius?",
      answer:
        "Subtract 32, then divide by 1.8. So 72 °F is 22.2 °C. The reverse is multiply by 1.8 and add 32. Temperature is the one category where units are offset scales rather than simple multiples.",
    },
    {
      question: "Can I type the whole conversion in one go?",
      answer:
        "Yes. Type something like 45 mpg in l/100km, 6 ft to cm or 5:00 min/km to mph into the value box and press Enter. The converter picks the units and category for you. It also understands common spellings such as kph, kmh, stone, litres per 100 km and fl oz.",
    },
  ],
};

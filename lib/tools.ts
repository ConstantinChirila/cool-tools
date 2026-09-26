import {
  ArrowLeftRight,
  Binary,
  Briefcase,
  Car,
  Dices,
  FileDiff,
  Gift,
  Hourglass,
  House,
  KeyRound,
  Percent,
  PiggyBank,
  Target,
  TrainFront,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type ToolCategory = "Finance" | "Maths" | "Sport" | "Everyday" | "Text";

export interface Tool {
  slug: string;
  name: string;
  shortName?: string;
  description: string;
  category: ToolCategory;
  icon: LucideIcon;
  /** Extra terms the search should match beyond name/description. */
  keywords: string[];
  /** Sticker fill for the tool tile: one of the --sticker-* palette colours. */
  tint: string;
  /** Search snippet: title under ~50 chars (the site name is appended), description under ~155. */
  seo: { title: string; description: string };
  /** ISO date of the last meaningful change, used for sitemap lastmod. */
  updated: string;
}

export const tools: Tool[] = [
  {
    slug: "uk-salary-calculator",
    name: "UK Salary Calculator",
    shortName: "UK Salary",
    description:
      "Take-home pay after income tax, National Insurance, pension and student loans, with Scottish rates, tax codes, bonuses and overtime.",
    category: "Finance",
    icon: Wallet,
    keywords: ["salary", "take home", "take-home", "wage", "paye", "income tax", "national insurance", "ni", "pension", "student loan", "net pay", "hmrc", "payslip", "tax code", "scotland", "gross", "hourly", "wages"],
    tint: "var(--sticker-mint)",
    seo: {
      title: "UK Salary Calculator 2026/27: Take-Home Pay",
      description:
        "Work out your take-home pay after income tax, National Insurance, pension and student loan for 2025/26 and 2026/27. Scottish rates, tax codes, bonuses and salary sacrifice.",
    },
    updated: "2026-09-18",
  },
  {
    slug: "bonus-tax-calculator",
    name: "Bonus After Tax Calculator",
    shortName: "Bonus Tax",
    description:
      "What a UK bonus is worth after income tax, National Insurance and student loan, and what you gain by sacrificing some of it into your pension.",
    category: "Finance",
    icon: Gift,
    keywords: ["bonus", "bonus tax", "after tax", "net bonus", "take home", "paye", "national insurance", "ni", "student loan", "bonus sacrifice", "salary sacrifice", "pension", "60% tax trap", "100k", "personal allowance", "commission", "one-off payment", "hmrc"],
    tint: "var(--sticker-mint)",
    seo: {
      title: "Bonus After Tax Calculator UK 2026/27",
      description:
        "See how much of your UK bonus you keep after income tax, National Insurance and student loan for 2026/27, with Scottish rates, the £100k trap and bonus sacrifice into a pension.",
    },
    updated: "2026-09-19",
  },
  {
    slug: "contractor-calculator",
    name: "Contractor Calculator",
    shortName: "Contractor",
    description:
      "What a day rate is worth through a limited company, an umbrella or as a sole trader, side by side with a permanent salary, holidays and pension included.",
    category: "Finance",
    icon: Briefcase,
    keywords: ["contractor", "contracting", "day rate", "daily rate", "freelance", "freelancer", "limited company", "ltd", "umbrella", "ir35", "inside ir35", "outside ir35", "sole trader", "self-employed", "dividends", "corporation tax", "perm vs contract", "permanent", "salary vs contract", "take home", "break even"],
    tint: "var(--sticker-yellow)",
    seo: {
      title: "Contractor Calculator UK 2026/27: Day Rate vs Salary",
      description:
        "Turn a day rate into take-home pay through a limited company, umbrella or as a sole trader, compare it with a permanent salary and find your break-even day rate.",
    },
    updated: "2026-09-26",
  },
  {
    slug: "car-finance-calculator",
    name: "Car Finance Calculator",
    shortName: "Car Finance",
    description:
      "Compare PCP, hire purchase, a personal loan and leasing on the same car: monthly payments, total paid and the real cost once the car's value is counted.",
    category: "Finance",
    icon: Car,
    keywords: ["car", "car finance", "car loan", "pcp", "hp", "hire purchase", "personal contract purchase", "lease", "leasing", "pch", "contract hire", "balloon", "gmfv", "apr", "monthly payment", "deposit", "part exchange", "vehicle", "auto loan"],
    tint: "var(--sticker-pink)",
    seo: {
      title: "Car Finance Calculator: PCP vs HP vs Lease",
      description:
        "Compare PCP, HP, a personal loan and a lease on the same car. Monthly payments, balloon, interest, total paid and the real cost after the car's value at the end.",
    },
    updated: "2026-09-26",
  },
  {
    slug: "mortgage-calculator",
    name: "Mortgage Calculator",
    shortName: "Mortgage",
    description:
      "Monthly repayments, total interest, and a full amortization breakdown for any home loan.",
    category: "Finance",
    icon: House,
    keywords: ["loan", "home", "house", "repayment", "amortization", "interest", "property"],
    tint: "var(--sticker-sky)",
    seo: {
      title: "Mortgage Calculator UK: Monthly Repayments",
      description:
        "See your monthly mortgage repayment, total interest and a year-by-year amortisation chart. Compare repayment and interest-only, any loan size, rate and term.",
    },
    updated: "2026-09-16",
  },
  {
    slug: "mortgage-overpayment-calculator",
    name: "Mortgage Overpayment Calculator",
    shortName: "Overpayments",
    description:
      "See how much interest and how many years you save by overpaying your mortgage each month or with a lump sum.",
    category: "Finance",
    icon: PiggyBank,
    keywords: ["overpay", "overpayment", "lump sum", "pay off early", "early repayment", "interest saved", "10% rule", "remortgage"],
    tint: "var(--sticker-sky)",
    seo: {
      title: "Mortgage Overpayment Calculator UK",
      description:
        "Find out how much interest and how many years you save by overpaying your mortgage monthly or with a lump sum, with a warning when you pass the 10% limit.",
    },
    updated: "2026-09-16",
  },
  {
    slug: "compound-interest-calculator",
    name: "Compound Interest Calculator",
    shortName: "Compound Interest",
    description:
      "Watch savings and investments grow with compounding, regular contributions, and a year-by-year chart.",
    category: "Finance",
    icon: TrendingUp,
    keywords: ["savings", "investment", "growth", "interest", "wealth", "returns", "isa"],
    tint: "var(--sticker-lilac)",
    seo: {
      title: "Compound Interest Calculator with Monthly Deposits",
      description:
        "Project savings and investment growth with compound interest, regular monthly contributions and monthly, quarterly or yearly compounding. Chart and yearly table.",
    },
    updated: "2026-09-16",
  },
  {
    slug: "percentage-calculator",
    name: "Percentage Calculator",
    shortName: "Percentage",
    description:
      "Every percentage question in one place: X% of Y, percentage change, increases, and discounts.",
    category: "Maths",
    icon: Percent,
    keywords: ["percent", "change", "increase", "decrease", "discount", "ratio", "difference"],
    tint: "var(--sticker-yellow)",
    seo: {
      title: "Percentage Calculator: Change, Increase, % Of",
      description:
        "Work out X% of a number, what percentage one number is of another, percentage change between two values, and increases or decreases by a percentage.",
    },
    updated: "2026-09-18",
  },
  {
    slug: "arrow-spine-calculator",
    name: "Arrow Spine Calculator",
    shortName: "Arrow Spine",
    description:
      "See how cutting a shaft or changing point weight shifts an arrow's effective spine, with draw weight equivalents.",
    category: "Sport",
    icon: Target,
    keywords: ["archery", "arrow", "spine", "stiffness", "bow", "shaft", "point", "tip", "grain", "deflection", "tuning"],
    tint: "var(--sticker-pink)",
    seo: {
      title: "Arrow Spine Calculator: Cut Length and Point Weight",
      description:
        "Estimate how cutting a shaft or changing point weight shifts an arrow's effective spine, with the nearest standard spine and a draw-weight equivalent.",
    },
    updated: "2026-09-16",
  },
  {
    slug: "commute-calculator",
    name: "Commute Time Calculator",
    shortName: "Commute",
    description:
      "How many hours and days a year your commute really takes, what it costs, and how much working from home would give back.",
    category: "Everyday",
    icon: TrainFront,
    keywords: ["commute", "commuting", "travel time", "journey", "train", "drive", "driving", "work from home", "wfh", "hybrid", "office", "season ticket", "fuel", "hours per year", "time"],
    tint: "var(--sticker-mint)",
    seo: {
      title: "Commute Time Calculator: Hours per Year",
      description:
        "Work out how many hours and full days a year you spend commuting, what it costs, and how much time and money working from home a few days a week would save.",
    },
    updated: "2026-09-16",
  },
  {
    slug: "countdown-calculator",
    name: "Countdown Calculator",
    shortName: "Countdown",
    description:
      "Days, hours, minutes and seconds until any date, ticking live, plus the weeks, sleeps, weekends and working days to go.",
    category: "Everyday",
    icon: Hourglass,
    keywords: ["countdown", "days until", "days left", "days to go", "time until", "how many days", "how long until", "sleeps", "weeks until", "working days", "days since", "days between", "christmas", "new year", "timer", "date", "event", "deadline"],
    tint: "var(--sticker-lilac)",
    seo: {
      title: "Countdown Calculator: Days Until Any Date",
      description:
        "Count down the days, hours, minutes and seconds to any date and time, live, with the weeks, sleeps, weekends and working days to go. Name it and share the link.",
    },
    updated: "2026-09-18",
  },
  {
    slug: "unit-converter",
    name: "Unit Converter",
    shortName: "Units",
    description:
      "Convert length, weight, volume, temperature, speed, fuel economy, data, pressure and more across 300 units, including mpg to L/100km and stone to kg.",
    category: "Everyday",
    icon: ArrowLeftRight,
    keywords: ["unit", "units", "convert", "conversion", "converter", "metric", "imperial", "mpg", "l/100km", "fuel economy", "stone", "kg", "lbs", "pounds", "kilograms", "miles", "km", "feet", "inches", "cm", "celsius", "fahrenheit", "litres", "gallons", "pints", "cups", "ounces", "psi", "bar", "kwh", "gb", "gib", "knots", "pace", "min/km", "measurement"],
    tint: "var(--sticker-yellow)",
    seo: {
      title: "Unit Converter: mpg to L/100km, Stone to kg",
      description:
        "Convert 300 units across length, weight, volume, temperature, speed, fuel economy, pressure, energy and data. Type 45 mpg in l/100km or 11 stone to kg.",
    },
    updated: "2026-09-17",
  },
  {
    slug: "dice-roller",
    name: "Dice Roller & Coin Flip",
    shortName: "Dice & Coin",
    description:
      "Roll up to five dice, from a d4 to a d20, or flip a coin and call it, with the total and a tally of what came up.",
    category: "Everyday",
    icon: Dices,
    keywords: ["dice", "die", "roll", "roller", "d4", "d6", "d8", "d10", "d12", "d20", "dnd", "d&d", "rpg", "board game", "coin", "flip", "toss", "heads", "tails", "heads or tails", "random", "decide", "yes or no"],
    tint: "var(--sticker-pink)",
    seo: {
      title: "Dice Roller & Coin Flip: d4 to d20, Heads or Tails",
      description:
        "Roll up to five dice at once (d4, d6, d8, d10, d12 or d20) with the total added up, or flip a coin and call heads or tails. Fair, instant and free.",
    },
    updated: "2026-09-19",
  },
  {
    slug: "text-diff",
    name: "Text Diff Checker",
    shortName: "Text Diff",
    description:
      "Compare two texts and see every line and word that was added, removed or changed, side by side or inline.",
    category: "Text",
    icon: FileDiff,
    keywords: ["diff", "difference", "differences", "compare", "comparison", "compare text", "text compare", "diff checker", "changes", "changed", "versions", "side by side", "unified", "patch", "code", "document", "draft", "contract", "proofread", "whitespace", "merge"],
    tint: "var(--sticker-sky)",
    seo: {
      title: "Text Diff Checker: Compare Two Texts Online",
      description:
        "Paste two versions of a text or code and see the added, removed and changed lines highlighted word by word. Side by side or inline, private: nothing is uploaded.",
    },
    updated: "2026-09-20",
  },
  {
    slug: "encoder-decoder",
    name: "Encoder & Decoder",
    shortName: "Encode / Decode",
    description:
      "Encode and decode Base64, URLs, HTML entities, hex and Unicode escapes, with proper UTF-8 handling and clear errors when something will not decode.",
    category: "Text",
    icon: Binary,
    keywords: ["encode", "decode", "encoder", "decoder", "base64", "base64url", "url encode", "url decode", "urlencode", "percent encoding", "%20", "html entities", "escape", "unescape", "html escape", "&amp;", "hex", "hexadecimal", "text to hex", "hex to text", "unicode", "\\u", "utf-8", "utf8", "ascii", "bytes", "convert"],
    tint: "var(--sticker-lilac)",
    seo: {
      title: "Base64, URL, HTML, Hex Encoder and Decoder",
      description:
        "Encode and decode Base64, URL percent-encoding, HTML entities, hex and Unicode escapes in one place. UTF-8 and emoji safe, clear error messages, nothing uploaded.",
    },
    updated: "2026-09-20",
  },
  {
    slug: "jwt-decoder",
    name: "JWT Decoder",
    shortName: "JWT",
    description:
      "Decode a JSON Web Token to read its header, claims and expiry in plain English, and check an HMAC signature, without the token leaving your browser.",
    category: "Text",
    icon: KeyRound,
    keywords: ["jwt", "json web token", "token", "decode", "decoder", "bearer", "access token", "id token", "oauth", "oidc", "openid", "claims", "exp", "iat", "expiry", "expired", "hs256", "rs256", "signature", "verify", "auth", "authorization", "jws", "debugger"],
    tint: "var(--sticker-pink)",
    seo: {
      title: "JWT Decoder: Read Claims and Expiry Privately",
      description:
        "Paste a JSON Web Token to see its header, payload and claims, with exp and iat as real dates and whether it has expired. HS256 signature check. Nothing is uploaded.",
    },
    updated: "2026-09-20",
  },
];

export const categories: ToolCategory[] = ["Finance", "Maths", "Sport", "Everyday", "Text"];

export function getTool(slug: string): Tool | undefined {
  return tools.find((t) => t.slug === slug);
}

/** For route files, where the slug is a literal: fails loudly on a typo instead of at first render. */
export function requireTool(slug: string): Tool {
  const tool = getTool(slug);
  if (!tool) throw new Error(`Unknown tool slug "${slug}" (register it in lib/tools.ts)`);
  return tool;
}

export function searchTools(query: string): Tool[] {
  const q = query.trim().toLowerCase();
  if (!q) return tools;
  const terms = q.split(/\s+/);
  return tools.filter((tool) => {
    const haystack = [
      tool.name,
      tool.description,
      tool.category,
      ...tool.keywords,
    ]
      .join(" ")
      .toLowerCase();
    return terms.every((term) => haystack.includes(term));
  });
}

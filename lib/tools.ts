import {
  House,
  Percent,
  PiggyBank,
  Target,
  TrainFront,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type ToolCategory = "Finance" | "Maths" | "Sport" | "Everyday";

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
    updated: "2026-09-16",
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
    updated: "2026-09-16",
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
];

export const categories: ToolCategory[] = ["Finance", "Maths", "Sport", "Everyday"];

export function getTool(slug: string): Tool | undefined {
  return tools.find((t) => t.slug === slug);
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

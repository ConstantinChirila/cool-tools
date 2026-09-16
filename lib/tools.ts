import {
  House,
  Percent,
  PiggyBank,
  Target,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type ToolCategory = "Finance" | "Maths" | "Sport";

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
  },
];

export const categories: ToolCategory[] = ["Finance", "Maths", "Sport"];

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

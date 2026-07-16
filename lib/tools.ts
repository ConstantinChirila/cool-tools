import {
  House,
  Percent,
  Target,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

export type ToolCategory = "Finance" | "Math" | "Sport";

export interface Tool {
  slug: string;
  name: string;
  shortName?: string;
  description: string;
  category: ToolCategory;
  icon: LucideIcon;
  /** Extra terms the search should match beyond name/description. */
  keywords: string[];
  /** Accent hue used for the tool icon tile, as a Tailwind-compatible oklch color. */
  tint: string;
}

export const tools: Tool[] = [
  {
    slug: "mortgage-calculator",
    name: "Mortgage Calculator",
    shortName: "Mortgage",
    description:
      "Monthly repayments, total interest, and a full amortization breakdown for any home loan.",
    category: "Finance",
    icon: House,
    keywords: ["loan", "home", "house", "repayment", "amortization", "interest", "property"],
    tint: "oklch(0.72 0.14 170)",
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
    tint: "oklch(0.68 0.17 285)",
  },
  {
    slug: "percentage-calculator",
    name: "Percentage Calculator",
    shortName: "Percentage",
    description:
      "Every percentage question in one place: X% of Y, percentage change, increases, and discounts.",
    category: "Math",
    icon: Percent,
    keywords: ["percent", "change", "increase", "decrease", "discount", "ratio", "difference"],
    tint: "oklch(0.78 0.14 85)",
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
    tint: "oklch(0.7 0.15 25)",
  },
];

export const categories: ToolCategory[] = ["Finance", "Math", "Sport"];

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

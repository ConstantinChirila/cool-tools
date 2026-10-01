import type { MetadataRoute } from "next";
import { codecPagePath, codecPages } from "@/lib/encoding-pages";
import { absoluteUrl } from "@/lib/site";
import { getTool, toolPath, tools } from "@/lib/tools";
import { pairPath, pairs } from "@/lib/units/pairs";

/** Date on the terms and privacy pages; keep in step with their "Last updated" line. */
const LEGAL_UPDATED = "2026-10-01";

export default function sitemap(): MetadataRoute.Sitemap {
  const newest = tools.map((t) => t.updated).sort().at(-1);
  return [
    {
      url: absoluteUrl("/"),
      lastModified: newest ? new Date(newest) : new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...tools.map((tool) => ({
      url: absoluteUrl(toolPath(tool)),
      lastModified: new Date(tool.updated),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...pairs.map((pair) => ({
      url: absoluteUrl(pairPath(pair)),
      lastModified: new Date(getTool("unit-converter")?.updated ?? newest ?? Date.now()),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...codecPages.map((page) => ({
      url: absoluteUrl(codecPagePath(page)),
      lastModified: new Date(getTool("encoder-decoder")?.updated ?? newest ?? Date.now()),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...["/terms", "/privacy"].map((path) => ({
      url: absoluteUrl(path),
      lastModified: new Date(LEGAL_UPDATED),
      changeFrequency: "yearly" as const,
      priority: 0.2,
    })),
  ];
}

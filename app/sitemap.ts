import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";
import { getTool, tools } from "@/lib/tools";
import { pairPath, pairs } from "@/lib/units/pairs";

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
      url: absoluteUrl(`/tools/${tool.slug}`),
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
  ];
}

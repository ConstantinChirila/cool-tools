import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";
import { tools } from "@/lib/tools";

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
  ];
}

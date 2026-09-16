import type { Metadata } from "next";
import type { ToolContent } from "@/lib/tool-content";
import { SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/site";
import type { Tool } from "@/lib/tools";

export function toolPath(tool: Tool): string {
  return `/tools/${tool.slug}`;
}

/** Page metadata for a tool route: title, description, canonical, Open Graph and Twitter. */
export function toolMetadata(tool: Tool): Metadata {
  const url = absoluteUrl(toolPath(tool));
  return {
    title: tool.seo.title,
    description: tool.seo.description,
    keywords: tool.keywords,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: `${tool.seo.title} · ${SITE_NAME}`,
      description: tool.seo.description,
      siteName: SITE_NAME,
      locale: "en_GB",
    },
    twitter: {
      card: "summary_large_image",
      title: `${tool.seo.title} · ${SITE_NAME}`,
      description: tool.seo.description,
    },
  };
}

const SCHEMA_CATEGORY: Record<Tool["category"], string> = {
  Finance: "FinanceApplication",
  Maths: "UtilitiesApplication",
  Sport: "SportsApplication",
  Everyday: "LifestyleApplication",
};

/** schema.org graph for a tool page: the app itself, breadcrumbs and FAQs. */
export function toolJsonLd(tool: Tool, content: ToolContent) {
  const url = absoluteUrl(toolPath(tool));
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": `${url}#app`,
        name: tool.name,
        headline: tool.seo.title,
        description: tool.seo.description,
        url,
        applicationCategory: SCHEMA_CATEGORY[tool.category],
        operatingSystem: "Any",
        browserRequirements: "Requires JavaScript",
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" },
        inLanguage: "en-GB",
        dateModified: tool.updated,
        publisher: { "@id": `${SITE_URL}/#organization` },
        isPartOf: { "@id": `${SITE_URL}/#website` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: SITE_NAME, item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: tool.name, item: url },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: content.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      },
    ],
  };
}

/** schema.org graph for the homepage: the site and its publisher. */
export function siteJsonLd(tools: Tool[]) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        logo: `${SITE_URL}/icon.svg`,
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        inLanguage: "en-GB",
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
      {
        "@type": "ItemList",
        name: "Calculators",
        itemListElement: tools.map((tool, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: tool.name,
          url: absoluteUrl(toolPath(tool)),
        })),
      },
    ],
  };
}

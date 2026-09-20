import type { Metadata } from "next";
import { OG_SIZE } from "@/lib/og";
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
  Text: "UtilitiesApplication",
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

/** A static page under a tool, such as one unit conversion or one codec. */
export interface SubPage {
  /** Site-relative path, e.g. /tools/unit-converter/stone-to-kg. */
  path: string;
  /** Search title: the site name is appended. */
  title: string;
  /** Name in breadcrumbs. */
  crumb: string;
  description: string;
}

/**
 * Metadata for a sub-page. It points at the parent tool's generated social
 * card, because a segment's opengraph-image file does not cascade to the
 * routes beneath it.
 */
export function subPageMetadata(tool: Tool, page: SubPage): Metadata {
  const url = absoluteUrl(page.path);
  const title = `${page.title} · ${SITE_NAME}`;
  const image = {
    url: absoluteUrl(`${toolPath(tool)}/opengraph-image`),
    ...OG_SIZE,
    alt: `${tool.name} on ${SITE_NAME}`,
  };
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title,
      description: page.description,
      siteName: SITE_NAME,
      locale: "en_GB",
      images: [image],
    },
    twitter: { card: "summary_large_image", title, description: page.description, images: [image.url] },
  };
}

/** schema.org graph for a sub-page: the page, its breadcrumbs under the tool, and its FAQs. */
export function subPageJsonLd(tool: Tool, page: SubPage, faqs: readonly { question: string; answer: string }[]) {
  const url = absoluteUrl(page.path);
  const toolUrl = absoluteUrl(toolPath(tool));
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#page`,
        name: page.title,
        description: page.description,
        url,
        inLanguage: "en-GB",
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: { "@id": `${toolUrl}#app` },
        dateModified: tool.updated,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: SITE_NAME, item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: tool.name, item: toolUrl },
          { "@type": "ListItem", position: 3, name: page.crumb, item: url },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
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

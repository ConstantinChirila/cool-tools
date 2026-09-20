import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { RecordRecentTool } from "@/components/record-recent-tool";
import { ShareLink } from "@/components/share-link";
import { ToolGuide } from "@/components/tool-guide";
import { CodecPageLinks } from "@/components/tools/codec-page-links";
import { EncoderDecoder } from "@/components/tools/encoder-decoder";
import { getCodec } from "@/lib/encoding";
import { codecPagePath, codecPages, getCodecPage } from "@/lib/encoding-pages";
import { toolPath } from "@/lib/seo";
import { SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/site";
import type { ToolContent } from "@/lib/tool-content";
import { requireTool } from "@/lib/tools";

const tool = requireTool("encoder-decoder");

const PRIVACY =
  "Everything happens in your browser. What you type or paste is never uploaded, stored or added to the share link, so it is safe to use with tokens, keys and customer data.";

export const dynamicParams = false;

export function generateStaticParams() {
  return codecPages.map((page) => ({ codec: page.slug }));
}

type Params = Promise<{ codec: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const page = getCodecPage((await params).codec);
  if (!page) return {};
  const url = absoluteUrl(codecPagePath(page));
  // Codec pages share the tool's generated social card; a segment's
  // opengraph-image file does not cascade to routes beneath it.
  const image = { url: absoluteUrl(`${toolPath(tool)}/opengraph-image`), width: 1200, height: 630, alt: `${tool.name} on ${SITE_NAME}` };
  return {
    title: page.seoTitle,
    description: page.description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: `${page.seoTitle} · ${SITE_NAME}`,
      description: page.description,
      siteName: SITE_NAME,
      locale: "en_GB",
      images: [image],
    },
    twitter: { card: "summary_large_image", title: `${page.seoTitle} · ${SITE_NAME}`, description: page.description, images: [image.url] },
  };
}

export default async function CodecPage({ params }: { params: Params }) {
  const page = getCodecPage((await params).codec);
  if (!page) notFound();

  const codec = getCodec(page.codec);
  const url = absoluteUrl(codecPagePath(page));
  const content: ToolContent = { intro: [PRIVACY], sections: [...page.sections], faqs: [...page.faqs] };
  const examples = page.examples.map((example) => ({
    ...example,
    style: codec.variants.find((v) => v.id === example.variant)?.label ?? "",
    encoded: codec.encode(example.text, example.variant),
  }));

  const jsonLd = {
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
        about: { "@id": `${absoluteUrl(toolPath(tool))}#app` },
        dateModified: tool.updated,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: SITE_NAME, item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: tool.name, item: absoluteUrl(toolPath(tool)) },
          { "@type": "ListItem", position: 3, name: page.title, item: url },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: page.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      },
    ],
  };

  return (
    <article className="mx-auto w-full max-w-7xl px-4 pb-28 sm:px-6">
      <JsonLd data={jsonLd} />
      <RecordRecentTool slug={tool.slug} />
      <nav aria-label="Breadcrumb" className="flex items-center justify-between gap-3 py-6">
        <Link
          href={toolPath(tool)}
          className="inline-flex h-10 items-center gap-1.5 rounded-full border-[2.5px] border-foreground bg-card px-4 text-sm font-bold transition-transform hover:-translate-y-0.5"
        >
          <ArrowLeft className="size-4" strokeWidth={2.5} />
          {tool.name}
        </Link>
        <ShareLink />
      </nav>

      <header className="mb-8 flex items-center gap-5">
        <span
          className="sticker flex size-16 shrink-0 -rotate-6 items-center justify-center rounded-[22px] sm:size-[72px]"
          style={{ background: tool.tint }}
          aria-hidden="true"
        >
          <tool.icon className="size-8" strokeWidth={2.25} />
        </span>
        <div>
          <h1 className="text-3xl font-black tracking-tight sm:text-5xl">{page.title}</h1>
          <p className="mt-1.5 max-w-2xl font-semibold text-muted-foreground sm:text-lg">{page.lead}</p>
        </div>
      </header>

      <EncoderDecoder initial={{ codec: page.codec }} />

      <section aria-labelledby="codec-examples" className="mx-auto mt-12 max-w-3xl space-y-4">
        <h2 id="codec-examples" className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          {codec.name} examples
        </h2>
        <div className="sticker overflow-x-auto rounded-[22px] bg-card">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-[2.5px] border-foreground font-mono text-[11px] tracking-[0.12em] text-muted-foreground uppercase">
                <th scope="col" className="px-5 py-3 font-bold">Text</th>
                <th scope="col" className="px-5 py-3 font-bold">Encoded</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-foreground/15">
              {examples.map((example) => (
                <tr key={`${example.text}-${example.variant}`} className="align-top">
                  <td className="px-5 py-3 font-mono text-[13px] font-bold break-all">{example.text}</td>
                  <td className="px-5 py-3">
                    <p className="font-mono text-[13px] font-bold break-all">{example.encoded}</p>
                    <p className="mt-1 text-xs font-semibold text-muted-foreground">
                      {example.style}: {example.note}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <ToolGuide tool={tool} content={content} />
      <CodecPageLinks exclude={page.slug} />
    </article>
  );
}

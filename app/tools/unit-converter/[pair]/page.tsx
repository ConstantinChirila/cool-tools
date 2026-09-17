import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { RecordRecentTool } from "@/components/record-recent-tool";
import { ShareLink } from "@/components/share-link";
import { UnitConverter } from "@/components/tools/unit-converter";
import { UnitPairLinks } from "@/components/tools/unit-pair-links";
import { toolPath } from "@/lib/seo";
import { SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/site";
import { requireTool } from "@/lib/tools";
import { convert, describeRelation, formatCompound, formatNumber, formatQuantity, type Relation } from "@/lib/units/convert";
import { getPair, pairPath, pairs, resolvePair, reversePair, type ResolvedPair } from "@/lib/units/pairs";

const tool = requireTool("unit-converter");

export const dynamicParams = false;

export function generateStaticParams() {
  return pairs.map((pair) => ({ pair: pair.slug }));
}

type Params = Promise<{ pair: string }>;

function load(slug: string): ResolvedPair | null {
  const pair = getPair(slug);
  return pair ? resolvePair(pair) : null;
}

function one(pair: ResolvedPair): string {
  return formatQuantity(pair.toUnit, convert(pair.fromUnit, pair.toUnit, 1));
}

function describe(pair: ResolvedPair): string {
  const first = pair.table[0];
  const last = pair.table[pair.table.length - 1];
  return `Convert ${pair.title}: 1 ${pair.fromUnit.sym} = ${one(pair)} ${pair.toUnit.sym}. Live converter, the formula, and a quick table from ${first} to ${last} ${pair.fromUnit.sym}.`;
}

/** Plain-English version of the maths for this pair. */
function howTo(pair: ResolvedPair, relation: Relation): string {
  const from = pair.fromUnit.name.toLowerCase();
  const to = pair.toUnit.name.toLowerCase();
  switch (relation.kind) {
    case "linear":
      return `Multiply the ${from} figure by ${formatNumber(relation.factor)} to get ${to}. Going the other way, divide by ${formatNumber(relation.factor)}, which is the same as multiplying by ${formatNumber(1 / relation.factor)}.`;
    case "affine":
      return `Multiply the ${from} figure by ${formatNumber(relation.factor)}, then ${relation.offset < 0 ? "subtract" : "add"} ${formatNumber(Math.abs(relation.offset))}. The two scales have different zero points, so there is no single factor to multiply by.`;
    case "reciprocal":
      return `Divide ${formatNumber(relation.constant)} by the ${from} figure to get ${to}, and divide ${formatNumber(relation.constant)} by ${to} to get back. The relationship is reciprocal: doubling one halves the other.`;
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { pair: slug } = await params;
  const pair = load(slug);
  if (!pair) return {};
  const title = `${pair.title} Converter`;
  const description = describe(pair);
  const url = absoluteUrl(pairPath(pair));
  // Pair pages share the converter's generated social card; a segment's
  // opengraph-image file does not cascade to routes beneath it.
  const image = { url: absoluteUrl(`${toolPath(tool)}/opengraph-image`), width: 1200, height: 630, alt: `${tool.name} on ${SITE_NAME}` };
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: `${title} · ${SITE_NAME}`,
      description,
      siteName: SITE_NAME,
      locale: "en_GB",
      images: [image],
    },
    twitter: { card: "summary_large_image", title: `${title} · ${SITE_NAME}`, description, images: [image.url] },
  };
}

export default async function UnitPairPage({ params }: { params: Params }) {
  const { pair: slug } = await params;
  const pair = load(slug);
  if (!pair) notFound();

  const { fromUnit: from, toUnit: to, categoryData: category } = pair;
  const relation = describeRelation(from, to);
  const reverse = reversePair(pair);
  const url = absoluteUrl(pairPath(pair));
  const sampleValue = pair.table[Math.floor(pair.table.length / 2)] ?? 1;
  const sampleResult = formatQuantity(to, convert(from, to, sampleValue));
  const rows = pair.table.map((value) => {
    const converted = convert(from, to, value);
    return {
      value,
      from: formatQuantity(from, value),
      to: formatQuantity(to, converted),
      compound: formatCompound(category, to, converted),
    };
  });

  const faqs = [
    {
      question: `How many ${to.name.toLowerCase()} in a ${from.name.toLowerCase()}?`,
      answer: `1 ${from.sym} is ${one(pair)} ${to.sym}. ${howTo(pair, relation)}`,
    },
    {
      question: `What is ${formatQuantity(from, sampleValue)} ${from.sym} in ${to.sym}?`,
      answer: `${formatQuantity(from, sampleValue)} ${from.sym} is ${sampleResult} ${to.sym}. Type any other figure into the converter above to see it instantly, and the full list under it shows the same amount in every unit of the ${category.name.toLowerCase()} category.`,
    },
    {
      question: `Is ${pair.title.toLowerCase()} a simple multiplication?`,
      answer:
        relation.kind === "linear"
          ? `Yes. Multiply by ${formatNumber(relation.factor)}. The factor comes from the units' legal definitions, so the result is exact to the precision shown.`
          : relation.kind === "affine"
            ? `Not quite: multiply by ${formatNumber(relation.factor)} and then ${relation.offset < 0 ? "subtract" : "add"} ${formatNumber(Math.abs(relation.offset))}, because the two scales start from different zero points.`
            : `No. ${to.sym} = ${formatNumber(relation.constant)} ÷ ${from.sym}. The two measures point in opposite directions, so you divide a constant by the figure rather than multiplying.`,
    },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#page`,
        name: `${pair.title} Converter`,
        description: describe(pair),
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
          { "@type": "ListItem", position: 3, name: pair.title, item: url },
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
          <h1 className="text-3xl font-black tracking-tight sm:text-5xl">{pair.title}</h1>
          <p className="mt-1.5 max-w-2xl font-semibold text-muted-foreground sm:text-lg">
            1 {from.sym} = {one(pair)} {to.sym}. Type a figure below, or scan the table for the usual values.
          </p>
        </div>
      </header>

      <UnitConverter
        initial={{ category: category.id, from: from.id, to: to.id, value: String(sampleValue) }}
      />

      <div className="mx-auto mt-12 max-w-4xl space-y-12">
        <section aria-labelledby="pair-table" className="space-y-4">
          <h2 id="pair-table" className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            {pair.title} quick table
          </h2>
          <div className="sticker overflow-hidden rounded-[22px] bg-card">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-[2.5px] border-foreground font-mono text-[11px] tracking-[0.12em] text-muted-foreground uppercase">
                  <th scope="col" className="px-5 py-3 font-bold">
                    {from.name} ({from.sym})
                  </th>
                  <th scope="col" className="px-5 py-3 text-right font-bold">
                    {to.name} ({to.sym})
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-foreground/15">
                {rows.map((row) => (
                  <tr key={row.value}>
                    <td className="px-5 py-2.5 text-[15px] font-bold text-numeric">
                      {row.from} {from.sym}
                    </td>
                    <td className="px-5 py-2.5 text-right font-heading text-lg font-extrabold text-numeric">
                      {row.to} {to.sym}
                      {row.compound && (
                        <span className="ml-2 font-mono text-xs font-bold text-muted-foreground">{row.compound}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="pair-how" className="space-y-4">
          <h2 id="pair-how" className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            How to convert {pair.title.toLowerCase()}
          </h2>
          <p className="font-semibold leading-relaxed text-foreground/85">{howTo(pair, relation)}</p>
          <p className="w-fit rounded-full border-2 border-foreground bg-card px-4 py-1.5 font-mono text-sm font-bold text-numeric">
            {relation.kind === "reciprocal"
              ? `${to.sym} = ${formatNumber(relation.constant)} ÷ ${from.sym}`
              : relation.kind === "affine"
                ? `${to.sym} = ${from.sym} × ${formatNumber(relation.factor)} ${relation.offset < 0 ? "−" : "+"} ${formatNumber(Math.abs(relation.offset))}`
                : `${to.sym} = ${from.sym} × ${formatNumber(relation.factor)}`}
          </p>
          <p className="font-semibold leading-relaxed text-foreground/85">
            Example: {formatQuantity(from, sampleValue)} {from.sym} is {sampleResult} {to.sym}.
          </p>
          {reverse && (
            <p className="font-semibold">
              <Link href={pairPath(reverse)} className="inline-flex items-center gap-1.5 underline decoration-2 underline-offset-4 hover:decoration-[3px]">
                Going the other way? {reverse.title}
                <ArrowRight className="size-4" strokeWidth={2.5} />
              </Link>
            </p>
          )}
        </section>

        <section aria-labelledby="pair-faq" className="space-y-6">
          <h2 id="pair-faq" className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Questions
          </h2>
          {faqs.map((faq) => (
            <div key={faq.question} className="space-y-1.5">
              <h3 className="text-lg font-extrabold">{faq.question}</h3>
              <p className="font-semibold leading-relaxed text-foreground/85">{faq.answer}</p>
            </div>
          ))}
        </section>
      </div>

      <UnitPairLinks exclude={pair.slug} />
    </article>
  );
}

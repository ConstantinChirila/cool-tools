import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ToolPageShell } from "@/components/tool-page-shell";
import { CodecPageLinks } from "@/components/tools/codec-page-links";
import { EncoderDecoder } from "@/components/tools/encoder-decoder";
import { getCodec } from "@/lib/encoding";
import { codecPagePath, codecPages, getCodecPage, type CodecPage } from "@/lib/encoding-pages";
import { subPageJsonLd, subPageMetadata, type SubPage } from "@/lib/seo";
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

function subPage(page: CodecPage): SubPage {
  return { path: codecPagePath(page), title: page.seoTitle, crumb: page.title, description: page.description };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const page = getCodecPage((await params).codec);
  return page ? subPageMetadata(tool, subPage(page)) : {};
}

export default async function CodecLandingPage({ params }: { params: Params }) {
  const page = getCodecPage((await params).codec);
  if (!page) notFound();

  const codec = getCodec(page.codec);
  const content: ToolContent = { intro: [PRIVACY], sections: [...page.sections], faqs: [...page.faqs] };
  const examples = page.examples.map((example) => ({
    ...example,
    style: codec.variants.find((v) => v.id === example.variant)?.label ?? "",
    encoded: codec.encode(example.text, example.variant),
  }));

  return (
    <ToolPageShell
      tool={tool}
      content={content}
      subPage={{ title: page.title, lead: page.lead, jsonLd: subPageJsonLd(tool, subPage(page), page.faqs) }}
    >
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

      <CodecPageLinks exclude={page.slug} />
    </ToolPageShell>
  );
}

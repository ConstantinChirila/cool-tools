import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { RecordRecentTool } from "@/components/record-recent-tool";
import { ShareLink } from "@/components/share-link";
import { ToolGuide } from "@/components/tool-guide";
import { toolJsonLd, toolPath } from "@/lib/seo";
import type { ToolContent } from "@/lib/tool-content";
import type { Tool } from "@/lib/tools";

/** What a page under a tool (one conversion, one codec) shows instead of the tool's own heading. */
export interface SubPageHead {
  title: string;
  lead: string;
  /** From `subPageJsonLd`. */
  jsonLd: object;
}

type Props = {
  tool: Tool;
  children: React.ReactNode;
} & (
  | { content: ToolContent; subPage?: undefined }
  /** A sub-page links back to its tool, and only gets the guide if it brings content of its own. */
  | { content?: ToolContent; subPage: SubPageHead }
);

export function ToolPageShell({ tool, content, subPage, children }: Props) {
  const back = subPage ? { href: toolPath(tool), label: tool.name } : { href: "/", label: "All tools" };
  return (
    <article className="mx-auto w-full max-w-7xl px-4 pb-28 sm:px-6">
      <JsonLd data={subPage ? subPage.jsonLd : toolJsonLd(tool, content)} />
      <RecordRecentTool slug={tool.slug} />
      <nav aria-label="Breadcrumb" className="flex items-center justify-between gap-3 py-6">
        <Link
          href={back.href}
          className="inline-flex h-10 items-center gap-1.5 rounded-full border-[2.5px] border-foreground bg-card px-4 text-sm font-bold transition-transform hover:-translate-y-0.5"
        >
          <ArrowLeft className="size-4" strokeWidth={2.5} />
          {back.label}
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
          <h1 className="text-3xl font-black tracking-tight sm:text-5xl">{subPage?.title ?? tool.name}</h1>
          <p className="mt-1.5 max-w-2xl font-semibold text-muted-foreground sm:text-lg">
            {subPage?.lead ?? tool.description}
          </p>
        </div>
      </header>

      {children}

      {content && <ToolGuide tool={tool} content={content} />}
    </article>
  );
}

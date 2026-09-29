import type { Metadata } from "next";
import { CodecPageLinks } from "@/components/tools/codec-page-links";
import { EncoderDecoder } from "@/components/tools/encoder-decoder";
import { ToolPageShell } from "@/components/tool-page-shell";
import { content } from "@/content/encoder-decoder";
import { toolMetadata } from "@/lib/seo";
import { requireTool } from "@/lib/tools";

const tool = requireTool("encoder-decoder");

export const metadata: Metadata = toolMetadata(tool);

export default function EncoderDecoderPage() {
  return (
    <ToolPageShell tool={tool} content={content}>
      <EncoderDecoder />
      <CodecPageLinks />
    </ToolPageShell>
  );
}

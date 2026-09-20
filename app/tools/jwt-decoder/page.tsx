import type { Metadata } from "next";
import { JwtDecoder } from "@/components/tools/jwt-decoder";
import { ToolPageShell } from "@/components/tool-page-shell";
import { content } from "@/content/jwt-decoder";
import { toolMetadata } from "@/lib/seo";
import { requireTool } from "@/lib/tools";

const tool = requireTool("jwt-decoder");

export const metadata: Metadata = toolMetadata(tool);

export default function JwtDecoderPage() {
  return (
    <ToolPageShell tool={tool} content={content}>
      <JwtDecoder />
    </ToolPageShell>
  );
}

import type { Metadata } from "next";
import { TextDiff } from "@/components/tools/text-diff";
import { ToolPageShell } from "@/components/tool-page-shell";
import { content } from "@/content/text-diff";
import { toolMetadata } from "@/lib/seo";
import { requireTool } from "@/lib/tools";

const tool = requireTool("text-diff");

export const metadata: Metadata = toolMetadata(tool);

export default function TextDiffPage() {
  return (
    <ToolPageShell tool={tool} content={content}>
      <TextDiff />
    </ToolPageShell>
  );
}

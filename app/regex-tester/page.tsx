import type { Metadata } from "next";
import { RegexTester } from "@/components/tools/regex-tester";
import { ToolPageShell } from "@/components/tool-page-shell";
import { content } from "@/content/regex-tester";
import { toolMetadata } from "@/lib/seo";
import { requireTool } from "@/lib/tools";

const tool = requireTool("regex-tester");

export const metadata: Metadata = toolMetadata(tool);

export default function RegexTesterPage() {
  return (
    <ToolPageShell tool={tool} content={content}>
      <RegexTester />
    </ToolPageShell>
  );
}

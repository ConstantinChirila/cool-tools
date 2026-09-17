import type { Metadata } from "next";
import { UnitConverter } from "@/components/tools/unit-converter";
import { ToolPageShell } from "@/components/tool-page-shell";
import { content } from "@/content/unit-converter";
import { toolMetadata } from "@/lib/seo";
import { requireTool } from "@/lib/tools";

const tool = requireTool("unit-converter");

export const metadata: Metadata = toolMetadata(tool);

export default function UnitConverterPage() {
  return (
    <ToolPageShell tool={tool} content={content}>
      <UnitConverter />
    </ToolPageShell>
  );
}

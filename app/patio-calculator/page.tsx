import type { Metadata } from "next";
import { PatioCalculator } from "@/components/tools/patio-calculator";
import { ToolPageShell } from "@/components/tool-page-shell";
import { content } from "@/content/patio-calculator";
import { toolMetadata } from "@/lib/seo";
import { requireTool } from "@/lib/tools";

const tool = requireTool("patio-calculator");

export const metadata: Metadata = toolMetadata(tool);

export default function PatioCalculatorPage() {
  return (
    <ToolPageShell tool={tool} content={content}>
      <PatioCalculator />
    </ToolPageShell>
  );
}

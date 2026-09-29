import type { Metadata } from "next";
import { RaisedBedCalculator } from "@/components/tools/raised-bed-calculator";
import { ToolPageShell } from "@/components/tool-page-shell";
import { content } from "@/content/raised-bed-calculator";
import { toolMetadata } from "@/lib/seo";
import { requireTool } from "@/lib/tools";

const tool = requireTool("raised-bed-calculator");

export const metadata: Metadata = toolMetadata(tool);

export default function RaisedBedCalculatorPage() {
  return (
    <ToolPageShell tool={tool} content={content}>
      <RaisedBedCalculator />
    </ToolPageShell>
  );
}

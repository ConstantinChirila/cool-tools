import type { Metadata } from "next";
import { InflationCalculator } from "@/components/tools/inflation-calculator";
import { ToolPageShell } from "@/components/tool-page-shell";
import { content } from "@/content/inflation-calculator";
import { toolMetadata } from "@/lib/seo";
import { requireTool } from "@/lib/tools";

const tool = requireTool("inflation-calculator");

export const metadata: Metadata = toolMetadata(tool);

export default function InflationCalculatorPage() {
  return (
    <ToolPageShell tool={tool} content={content}>
      <InflationCalculator />
    </ToolPageShell>
  );
}

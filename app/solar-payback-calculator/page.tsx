import type { Metadata } from "next";
import { SolarPaybackCalculator } from "@/components/tools/solar-payback-calculator";
import { ToolPageShell } from "@/components/tool-page-shell";
import { content } from "@/content/solar-payback-calculator";
import { toolMetadata } from "@/lib/seo";
import { requireTool } from "@/lib/tools";

const tool = requireTool("solar-payback-calculator");

export const metadata: Metadata = toolMetadata(tool);

export default function SolarPaybackCalculatorPage() {
  return (
    <ToolPageShell tool={tool} content={content}>
      <SolarPaybackCalculator />
    </ToolPageShell>
  );
}

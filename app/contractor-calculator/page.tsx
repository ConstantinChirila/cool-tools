import type { Metadata } from "next";
import { ContractorCalculator } from "@/components/tools/contractor-calculator";
import { ToolPageShell } from "@/components/tool-page-shell";
import { content } from "@/content/contractor-calculator";
import { toolMetadata } from "@/lib/seo";
import { requireTool } from "@/lib/tools";

const tool = requireTool("contractor-calculator");

export const metadata: Metadata = toolMetadata(tool);

export default function ContractorCalculatorPage() {
  return (
    <ToolPageShell tool={tool} content={content}>
      <ContractorCalculator />
    </ToolPageShell>
  );
}

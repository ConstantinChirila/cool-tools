import type { Metadata } from "next";
import { BonusTaxCalculator } from "@/components/tools/bonus-tax-calculator";
import { ToolPageShell } from "@/components/tool-page-shell";
import { content } from "@/content/bonus-tax-calculator";
import { toolMetadata } from "@/lib/seo";
import { requireTool } from "@/lib/tools";

const tool = requireTool("bonus-tax-calculator");

export const metadata: Metadata = toolMetadata(tool);

export default function BonusTaxCalculatorPage() {
  return (
    <ToolPageShell tool={tool} content={content}>
      <BonusTaxCalculator />
    </ToolPageShell>
  );
}

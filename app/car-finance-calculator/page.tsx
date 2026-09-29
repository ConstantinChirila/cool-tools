import type { Metadata } from "next";
import { CarFinanceCalculator } from "@/components/tools/car-finance-calculator";
import { ToolPageShell } from "@/components/tool-page-shell";
import { content } from "@/content/car-finance-calculator";
import { toolMetadata } from "@/lib/seo";
import { requireTool } from "@/lib/tools";

const tool = requireTool("car-finance-calculator");

export const metadata: Metadata = toolMetadata(tool);

export default function CarFinanceCalculatorPage() {
  return (
    <ToolPageShell tool={tool} content={content}>
      <CarFinanceCalculator />
    </ToolPageShell>
  );
}

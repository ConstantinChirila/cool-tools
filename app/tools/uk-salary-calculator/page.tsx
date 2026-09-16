import type { Metadata } from "next";
import { UkSalaryCalculator } from "@/components/tools/uk-salary-calculator";
import { ToolPageShell } from "@/components/tool-page-shell";
import { content } from "@/content/uk-salary-calculator";
import { toolMetadata } from "@/lib/seo";
import { requireTool } from "@/lib/tools";

const tool = requireTool("uk-salary-calculator");

export const metadata: Metadata = toolMetadata(tool);

export default function UkSalaryCalculatorPage() {
  return (
    <ToolPageShell tool={tool} content={content}>
      <UkSalaryCalculator />
    </ToolPageShell>
  );
}

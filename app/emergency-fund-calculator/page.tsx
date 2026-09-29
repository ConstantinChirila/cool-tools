import type { Metadata } from "next";
import { EmergencyFundCalculator } from "@/components/tools/emergency-fund-calculator";
import { ToolPageShell } from "@/components/tool-page-shell";
import { content } from "@/content/emergency-fund-calculator";
import { toolMetadata } from "@/lib/seo";
import { requireTool } from "@/lib/tools";

const tool = requireTool("emergency-fund-calculator");

export const metadata: Metadata = toolMetadata(tool);

export default function EmergencyFundCalculatorPage() {
  return (
    <ToolPageShell tool={tool} content={content}>
      <EmergencyFundCalculator />
    </ToolPageShell>
  );
}

import type { Metadata } from "next";
import { ArrowSpineCalculator } from "@/components/tools/arrow-spine-calculator";
import { ToolPageShell } from "@/components/tool-page-shell";
import { getTool } from "@/lib/tools";

const tool = getTool("arrow-spine-calculator")!;

export const metadata: Metadata = {
  title: tool.name,
  description: tool.description,
};

export default function ArrowSpineCalculatorPage() {
  return (
    <ToolPageShell tool={tool}>
      <ArrowSpineCalculator />
    </ToolPageShell>
  );
}

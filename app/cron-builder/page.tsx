import type { Metadata } from "next";
import { CronBuilder } from "@/components/tools/cron-builder";
import { ToolPageShell } from "@/components/tool-page-shell";
import { content } from "@/content/cron-builder";
import { toolMetadata } from "@/lib/seo";
import { requireTool } from "@/lib/tools";

const tool = requireTool("cron-builder");

export const metadata: Metadata = toolMetadata(tool);

export default function CronBuilderPage() {
  return (
    <ToolPageShell tool={tool} content={content}>
      <CronBuilder />
    </ToolPageShell>
  );
}

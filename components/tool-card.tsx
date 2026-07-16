import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Tool } from "@/lib/tools";

export function ToolCard({ tool }: { tool: Tool }) {
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="group card-glow card-specular relative flex flex-col gap-3 rounded-2xl p-5 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-accent/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <div className="flex items-start justify-between">
        <span
          className="flex size-11 items-center justify-center rounded-xl ring-1 transition-shadow duration-200"
          style={{
            color: tool.tint,
            background: `color-mix(in oklch, ${tool.tint} 12%, transparent)`,
            boxShadow: `0 0 24px -6px color-mix(in oklch, ${tool.tint} 35%, transparent)`,
            // @ts-expect-error CSS custom property for ring color
            "--tw-ring-color": `color-mix(in oklch, ${tool.tint} 25%, transparent)`,
          }}
        >
          <tool.icon className="size-5" />
        </span>
        <ArrowUpRight className="size-4 text-muted-foreground/50 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
      </div>

      <div className="flex-1 space-y-1">
        <h3 className="font-semibold tracking-tight">{tool.name}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {tool.description}
        </p>
      </div>

      <Badge
        variant="outline"
        className="w-fit text-[11px] font-medium tracking-wide text-muted-foreground"
      >
        {tool.category}
      </Badge>
    </Link>
  );
}

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Tool } from "@/lib/tools";

export function ToolPageShell({
  tool,
  children,
}: {
  tool: Tool;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6">
      <div className="py-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          All tools
        </Link>
      </div>

      <header className="mb-8 flex items-start gap-4">
        <span
          className="mt-1 flex size-12 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset"
          style={{
            color: tool.tint,
            background: `color-mix(in oklch, ${tool.tint} 12%, transparent)`,
            boxShadow: `0 0 28px -6px color-mix(in oklch, ${tool.tint} 35%, transparent)`,
            // @ts-expect-error CSS custom property for ring color
            "--tw-ring-color": `color-mix(in oklch, ${tool.tint} 25%, transparent)`,
          }}
        >
          <tool.icon className="size-6" />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {tool.name}
          </h1>
          <p className="mt-1 max-w-2xl text-muted-foreground">{tool.description}</p>
        </div>
      </header>

      {children}
    </div>
  );
}

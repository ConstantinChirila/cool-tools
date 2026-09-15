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
    <div className="mx-auto w-full max-w-6xl px-4 pb-28 sm:px-6">
      <div className="py-6">
        <Link
          href="/"
          className="inline-flex h-10 items-center gap-1.5 rounded-full border-[2.5px] border-foreground bg-card px-4 text-sm font-bold transition-transform hover:-translate-y-0.5"
        >
          <ArrowLeft className="size-4" strokeWidth={2.5} />
          All tools
        </Link>
      </div>

      <header className="mb-8 flex items-center gap-5">
        <span
          className="sticker flex size-16 shrink-0 -rotate-6 items-center justify-center rounded-[22px] sm:size-[72px]"
          style={{ background: tool.tint }}
        >
          <tool.icon className="size-8" strokeWidth={2.25} />
        </span>
        <div>
          <h1 className="text-3xl font-black tracking-tight sm:text-5xl">{tool.name}</h1>
          <p className="mt-1.5 max-w-2xl font-semibold text-muted-foreground sm:text-lg">
            {tool.description}
          </p>
        </div>
      </header>

      {children}
    </div>
  );
}

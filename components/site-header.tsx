"use client";

import Link from "next/link";
import { Search, Wrench } from "lucide-react";
import { openCommandPalette } from "@/components/command-palette";

export function SiteHeader() {
  return (
    <header className="glass sticky top-0 z-40 border-b border-border/60">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/25">
            <Wrench className="size-4" />
          </span>
          Cool Tools
        </Link>

        <button
          type="button"
          onClick={openCommandPalette}
          aria-label="Search tools"
          className="group flex h-9 items-center gap-2 rounded-lg border border-input bg-secondary/50 px-3 text-sm text-muted-foreground transition-colors hover:border-ring/40 hover:text-foreground"
        >
          <Search className="size-4" />
          <span className="hidden sm:inline">Search tools…</span>
          <kbd className="hidden items-center gap-0.5 rounded border border-border bg-background/60 px-1.5 font-mono text-[11px] text-muted-foreground sm:flex">
            ⌘K
          </kbd>
        </button>
      </div>
    </header>
  );
}

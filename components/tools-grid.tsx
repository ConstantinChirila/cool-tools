"use client";

import * as React from "react";
import { Plus, Search, SearchX } from "lucide-react";
import { RecentTools } from "@/components/recent-tools";
import { ToolCard } from "@/components/tool-card";
import { searchTools } from "@/lib/tools";

export function ToolsGrid() {
  const [query, setQuery] = React.useState("");
  const results = searchTools(query);

  return (
    <div className="space-y-6">
      <div className="sticker relative mx-auto max-w-2xl rounded-full bg-card focus-within:-translate-y-0.5 focus-within:shadow-[7px_7px_0_var(--foreground)] transition-[transform,box-shadow]">
        <Search
          className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2"
          strokeWidth={2.5}
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What do you need to work out?"
          aria-label="Search tools"
          className="h-13 w-full rounded-full bg-transparent pl-13 pr-20 text-base font-semibold outline-none placeholder:text-muted-foreground sm:text-lg"
        />
        <kbd className="pointer-events-none absolute right-5 top-1/2 hidden -translate-y-1/2 rounded-lg border-2 border-foreground px-2 py-0.5 font-mono text-xs sm:block">
          ⌘K
        </kbd>
      </div>

      {!query && <RecentTools />}

      {results.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <SearchX className="size-8" />
          <p className="font-semibold">
            No tools match &ldquo;{query}&rdquo; yet. More bits are on the way.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 pt-2 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4">
          {results.map((tool, i) => (
            <ToolCard key={tool.slug} tool={tool} index={i} />
          ))}
          {!query && (
            <a
              href="mailto:constantin.chirila@gmail.com?subject=Bits%20%26%20Bobs%3A%20tool%20idea"
              className="tilt-6 flex min-h-56 flex-col items-center justify-center gap-2.5 rounded-3xl border-[2.5px] border-dashed border-foreground bg-card p-5 text-center transition-transform hover:rotate-0"
            >
              <span className="flex size-11 items-center justify-center rounded-full border-[2.5px] border-foreground">
                <Plus className="size-5" strokeWidth={2.5} />
              </span>
              <span className="font-heading text-xl font-extrabold">Missing a bit?</span>
              <span className="text-sm font-semibold text-muted-foreground">
                Tell us what to build next
              </span>
            </a>
          )}
        </div>
      )}
    </div>
  );
}

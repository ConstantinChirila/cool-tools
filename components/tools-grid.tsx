"use client";

import * as React from "react";
import { Search, SearchX } from "lucide-react";
import { ToolCard } from "@/components/tool-card";
import { categories, searchTools } from "@/lib/tools";

export function ToolsGrid() {
  const [query, setQuery] = React.useState("");
  const results = searchTools(query);

  return (
    <div className="space-y-10">
      <div className="relative mx-auto max-w-xl">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tools… mortgage, percentage, interest"
          aria-label="Search tools"
          className="h-12 w-full rounded-xl border border-input bg-card/80 pl-11 pr-4 text-[15px] shadow-[0_1px_0_0_oklch(1_0_0/5%)_inset,0_8px_24px_-12px_oklch(0_0_0/50%)] outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-ring/50 focus:ring-2 focus:ring-ring/30"
        />
      </div>

      {results.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <SearchX className="size-8 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            No tools match &ldquo;{query}&rdquo; yet. More tools are on the way.
          </p>
        </div>
      ) : (
        categories.map((category) => {
          const categoryTools = results.filter((t) => t.category === category);
          if (categoryTools.length === 0) return null;
          return (
            <section key={category} className="space-y-4">
              <h2 className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {category}
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {categoryTools.map((tool) => (
                  <ToolCard key={tool.slug} tool={tool} />
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}

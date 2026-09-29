"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useRecentTools } from "@/hooks/use-recent-tools";
import { categories, getTool, searchTools, toolPath, tools, type Tool } from "@/lib/tools";
import { convert, formatQuantity } from "@/lib/units/convert";
import { getUnit } from "@/lib/units/data";
import { parseQuantity, parseQuery } from "@/lib/units/parse";

/**
 * "45 mpg in l/100km" typed into the palette answers inline and deep-links
 * into the unit converter with the same state.
 */
function conversionFor(search: string): { label: string; detail: string; href: string } | null {
  const text = search.trim();
  if (text.length < 2 || !/[a-z°µ]/i.test(text)) return null;
  const parsed = parseQuery(text);
  if (!parsed.from) return null;
  const { category, unit: from } = parsed.from;
  const to =
    parsed.to && parsed.to.category.id === category.id
      ? parsed.to.unit
      : getUnit(category, category.preset.to !== from.id ? category.preset.to : category.preset.from);
  if (!to || to.id === from.id) return null;
  const value = parsed.numberRaw ? parseQuantity(parsed.numberRaw, from, category) : NaN;
  const query = new URLSearchParams({ c: category.id, f: from.id, t: to.id });
  if (!Number.isNaN(value)) query.set("v", parsed.numberRaw);
  const href = `/unit-converter?${query.toString()}`;
  if (Number.isNaN(value)) {
    return { label: `${from.name} → ${to.name}`, detail: category.name, href };
  }
  return {
    label: `${formatQuantity(from, value)} ${from.sym} = ${formatQuantity(to, convert(from, to, value))} ${to.sym}`,
    detail: `${from.name} to ${to.name}`,
    href,
  };
}

const unitTool = getTool("unit-converter");

/** The palette body: cmdk, the dialog and the tool list. Loaded on first open. */
export default function CommandPaletteDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const recent = useRecentTools();
  const [search, setSearch] = React.useState("");
  const conversion = conversionFor(search);
  const query = search.trim();
  // Ranking is ours (name outweighs keywords), so cmdk's fuzzy filter is off.
  const results = query ? searchTools(query) : [];
  const recentHits = recent.filter((tool) => !query || results.includes(tool));
  const others = results.filter((tool) => !recentHits.includes(tool));

  // Each open starts blank, so Recent is always there after a previous search.
  const close = () => {
    setSearch("");
    onOpenChange(false);
  };
  const go = (href: string) => {
    close();
    router.push(href);
  };

  const item = (tool: Tool, keyPrefix = "") => (
    <CommandItem
      key={`${keyPrefix}${tool.slug}`}
      value={`${keyPrefix}${tool.slug}`}
      onSelect={() => go(toolPath(tool))}
    >
      <tool.icon className="size-4" style={{ color: tool.tint }} />
      <span>{tool.name}</span>
    </CommandItem>
  );

  return (
    <CommandDialog
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
      title="Search tools"
      description="Search for a tool to open"
    >
      <Command shouldFilter={false}>
        <CommandInput placeholder="Search tools…" value={search} onValueChange={setSearch} />
        <CommandList>
          <CommandEmpty>No tools found.</CommandEmpty>
          {conversion && unitTool && (
            <CommandGroup heading="Convert">
              <CommandItem
                value={`convert ${search}`}
                // A full navigation: the converter reads its state from the URL on mount,
                // so a client-side push onto the page that is already open would not apply it.
                onSelect={() => {
                  close();
                  window.location.assign(conversion.href);
                }}
              >
                <unitTool.icon className="size-4" style={{ color: unitTool.tint }} />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-bold text-numeric">{conversion.label}</span>
                  <span className="truncate text-xs text-muted-foreground">{conversion.detail}</span>
                </span>
              </CommandItem>
            </CommandGroup>
          )}
          {recentHits.length > 0 && (
            <CommandGroup heading="Recent">{recentHits.map((tool) => item(tool, "recent-"))}</CommandGroup>
          )}
          {query ? (
            others.length > 0 && (
              <CommandGroup heading="Tools">{others.map((tool) => item(tool))}</CommandGroup>
            )
          ) : (
            categories.map((category) => (
              <CommandGroup key={category} heading={category}>
                {tools.filter((tool) => tool.category === category).map((tool) => item(tool))}
              </CommandGroup>
            ))
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}

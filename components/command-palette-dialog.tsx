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
import { categories, getTool, tools } from "@/lib/tools";
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
  const href = `/tools/unit-converter?${query.toString()}`;
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

  const go = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search tools"
      description="Search for a tool to open"
    >
      <Command>
        <CommandInput placeholder="Search tools…" value={search} onValueChange={setSearch} />
        <CommandList>
          {!conversion && <CommandEmpty>No tools found.</CommandEmpty>}
          {conversion && unitTool && (
            <CommandGroup heading="Convert" forceMount>
              <CommandItem
                forceMount
                value={`convert ${search}`}
                // A full navigation: the converter reads its state from the URL on mount,
                // so a client-side push onto the page that is already open would not apply it.
                onSelect={() => {
                  onOpenChange(false);
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
          {!search && recent.length > 0 && (
            <CommandGroup heading="Recent">
              {recent.map((tool) => (
                <CommandItem
                  key={`recent-${tool.slug}`}
                  value={`recent ${tool.name}`}
                  onSelect={() => go(`/tools/${tool.slug}`)}
                >
                  <tool.icon className="size-4" style={{ color: tool.tint }} />
                  <span>{tool.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {categories.map((category) => (
            <CommandGroup key={category} heading={category}>
              {tools
                .filter((tool) => tool.category === category)
                .map((tool) => (
                  <CommandItem
                    key={tool.slug}
                    value={`${tool.name} ${tool.keywords.join(" ")}`}
                    onSelect={() => go(`/tools/${tool.slug}`)}
                  >
                    <tool.icon className="size-4" style={{ color: tool.tint }} />
                    <span>{tool.name}</span>
                  </CommandItem>
                ))}
            </CommandGroup>
          ))}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}

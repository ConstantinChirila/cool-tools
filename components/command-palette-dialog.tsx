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
import { categories, tools } from "@/lib/tools";

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
          <CommandEmpty>No tools found.</CommandEmpty>
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

"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { OPEN_PALETTE_EVENT } from "@/components/command-palette-events";

// cmdk and the dialog only matter once someone presses Cmd+K or the search
// button, so the body stays out of every route's initial bundle until then.
const CommandPaletteDialog = dynamic(() => import("@/components/command-palette-dialog"), {
  ssr: false,
});

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const [everOpened, setEverOpened] = React.useState(false);

  React.useEffect(() => {
    const show = () => {
      setEverOpened(true);
      setOpen(true);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setEverOpened(true);
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener(OPEN_PALETTE_EVENT, show);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(OPEN_PALETTE_EVENT, show);
    };
  }, []);

  if (!everOpened) return null;
  return <CommandPaletteDialog open={open} onOpenChange={setOpen} />;
}

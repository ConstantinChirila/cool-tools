"use client";

import * as React from "react";

export type CopyState = "idle" | "copied" | "failed";

/** How long "Copied" (or the failure) stays on the button. */
const RESET_MS = 2000;

/**
 * Copy-to-clipboard with button feedback. `copy` accepts the text, or a
 * promise of it for text that is built on demand; undefined counts as failed.
 */
export function useCopy(): { state: CopyState; copy: (text: string | Promise<string | undefined>) => Promise<void> } {
  const [state, setState] = React.useState<CopyState>("idle");
  const timer = React.useRef<number | undefined>(undefined);

  React.useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = React.useCallback(async (text: string | Promise<string | undefined>) => {
    let next: CopyState = "failed";
    try {
      const value = await text;
      if (value !== undefined) {
        await navigator.clipboard.writeText(value);
        next = "copied";
      }
    } catch {
      // Clipboard is unavailable (permissions or an insecure context).
    }
    setState(next);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState("idle"), RESET_MS);
  }, []);

  return { state, copy };
}

"use client";

import * as React from "react";
import { Check, Link2 } from "lucide-react";

/**
 * Copies the current URL (which carries the tool's inputs, see
 * hooks/use-url-state.ts). On touch devices with a native share sheet it
 * opens that instead.
 */
export function ShareLink() {
  const [copied, setCopied] = React.useState(false);

  const share = async () => {
    const url = window.location.href;
    const canShare =
      typeof navigator.share === "function" &&
      window.matchMedia("(pointer: coarse)").matches;
    try {
      if (canShare) {
        await navigator.share({ title: document.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // User dismissed the share sheet or clipboard is unavailable.
    }
  };

  return (
    <button
      type="button"
      onClick={share}
      aria-live="polite"
      className="sticker-sm flex h-10 shrink-0 items-center gap-2 rounded-full bg-card px-4 text-sm font-bold transition-transform hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
    >
      {copied ? (
        <Check className="size-4" strokeWidth={2.5} />
      ) : (
        <Link2 className="size-4" strokeWidth={2.5} />
      )}
      <span>{copied ? "Link copied" : "Share link"}</span>
    </button>
  );
}

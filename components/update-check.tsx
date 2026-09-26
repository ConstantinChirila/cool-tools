"use client";

import * as React from "react";
import { isStandalone } from "@/hooks/use-install-app";

async function reloadIfOutdated() {
  try {
    const res = await fetch("/version", { cache: "no-store" });
    if (!res.ok) return;
    const { build } = (await res.json()) as { build?: string };
    if (build && build !== process.env.BUILD_ID) window.location.reload();
  } catch {
    // Offline or a flaky connection: try again next time the app comes back.
  }
}

/**
 * Renders nothing. An installed iOS web app resumes from memory with no way to refresh,
 * so it keeps running the old bundle (and the old tool list) after a deploy. When the app
 * comes back to the foreground, reload if the server is on a newer build.
 */
export function UpdateCheck() {
  React.useEffect(() => {
    if (process.env.BUILD_ID === "dev" || !isStandalone()) return;
    const onVisible = () => {
      if (document.visibilityState === "visible") void reloadIfOutdated();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);
  return null;
}

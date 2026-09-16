"use client";

import * as React from "react";
import { recordRecentTool } from "@/hooks/use-recent-tools";

/** Renders nothing; marks the tool as recently used when its page opens. */
export function RecordRecentTool({ slug }: { slug: string }) {
  React.useEffect(() => {
    recordRecentTool(slug);
  }, [slug]);
  return null;
}

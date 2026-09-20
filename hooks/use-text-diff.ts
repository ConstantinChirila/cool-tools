"use client";

import * as React from "react";
import { diffText, type DiffOptions, type DiffResult } from "@/lib/text-diff";
import type { DiffRequest, DiffResponse } from "@/lib/text-diff.worker";

/**
 * Up to this many characters (both texts together) the diff takes a few
 * milliseconds, so it runs during render: no flicker, and the server can
 * render it. Anything larger goes to a worker.
 */
const SYNC_MAX_CHARS = 20_000;
/** Wait for a pause in typing before starting a worker job. */
const WORKER_DEBOUNCE_MS = 200;

interface Inputs extends DiffOptions {
  oldText: string;
  newText: string;
}

const sameInputs = (a: Inputs, b: Inputs) =>
  a.oldText === b.oldText &&
  a.newText === b.newText &&
  a.ignoreCase === b.ignoreCase &&
  a.ignoreWhitespace === b.ignoreWhitespace;

/**
 * Diffs two texts without blocking typing. `pending` is true while a worker
 * job for the current inputs is still running; `result` is then the last
 * finished large diff, or null if there is none.
 */
export function useTextDiff(
  oldText: string,
  newText: string,
  { ignoreCase, ignoreWhitespace }: DiffOptions,
): { result: DiffResult | null; pending: boolean } {
  const small = oldText.length + newText.length <= SYNC_MAX_CHARS;

  const syncResult = React.useMemo(
    () => (small ? diffText(oldText, newText, { ignoreCase, ignoreWhitespace }) : null),
    [small, oldText, newText, ignoreCase, ignoreWhitespace],
  );

  const [finished, setFinished] = React.useState<{ inputs: Inputs; result: DiffResult } | null>(null);
  const worker = React.useRef<Worker | null>(null);
  const nextId = React.useRef(0);

  React.useEffect(() => {
    if (small) return;
    const inputs: Inputs = { oldText, newText, ignoreCase, ignoreWhitespace };
    const options: DiffOptions = { ignoreCase, ignoreWhitespace };
    let running = false;

    const onMainThread = () => setFinished({ inputs, result: diffText(oldText, newText, options) });

    const timer = window.setTimeout(() => {
      if (typeof Worker === "undefined") return onMainThread();
      const id = ++nextId.current;
      const w = (worker.current ??= new Worker(new URL("../lib/text-diff.worker.ts", import.meta.url)));
      w.onmessage = (event: MessageEvent<DiffResponse>) => {
        if (event.data.id !== id) return;
        running = false;
        setFinished({ inputs, result: event.data.result });
      };
      w.onerror = () => {
        running = false;
        w.terminate();
        worker.current = null;
        onMainThread();
      };
      running = true;
      w.postMessage({ id, oldText, newText, options } satisfies DiffRequest);
    }, WORKER_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      // A worker cannot be interrupted, so a stale job is cancelled by
      // replacing the worker rather than queueing behind it.
      if (running) {
        worker.current?.terminate();
        worker.current = null;
      }
    };
  }, [small, oldText, newText, ignoreCase, ignoreWhitespace]);

  React.useEffect(
    () => () => {
      worker.current?.terminate();
      worker.current = null;
    },
    [],
  );

  if (small) return { result: syncResult, pending: false };
  const current =
    finished !== null && sameInputs(finished.inputs, { oldText, newText, ignoreCase, ignoreWhitespace });
  return { result: finished?.result ?? null, pending: !current };
}

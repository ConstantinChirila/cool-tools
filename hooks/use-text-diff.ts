"use client";

import * as React from "react";
import { countLines, diffText, unifiedPatch, type DiffOptions, type DiffResult } from "@/lib/text-diff";
import type { WorkerRequest, WorkerResponse } from "@/lib/text-diff.worker";

/**
 * Inputs this small diff in a few milliseconds, so they run during render: no
 * flicker, and the server can render the result. Anything larger goes to a
 * worker. Both limits matter: the diff's cost grows with the number of lines
 * that differ, and 20,000 characters of one-word lines is thousands of lines.
 */
const SYNC_MAX_CHARS = 20_000;
const SYNC_MAX_LINES = 1_000;
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

function isSmall(oldText: string, newText: string): boolean {
  return (
    oldText.length + newText.length <= SYNC_MAX_CHARS &&
    countLines(oldText) + countLines(newText) <= SYNC_MAX_LINES
  );
}

function startWorker(): Worker {
  return new Worker(new URL("../lib/text-diff.worker.ts", import.meta.url));
}

/**
 * Builds the unified patch off the main thread when the texts are large. Uses
 * a worker of its own, so it never queues behind (or is cancelled with) a diff.
 */
export function createPatch(oldText: string, newText: string): Promise<string | undefined> {
  if (isSmall(oldText, newText) || typeof Worker === "undefined") {
    return Promise.resolve(unifiedPatch(oldText, newText));
  }
  return new Promise((resolve) => {
    const worker = startWorker();
    const finish = (patch: string | undefined) => {
      worker.terminate();
      resolve(patch);
    };
    worker.onmessage = (event: MessageEvent<WorkerResponse>) =>
      finish(event.data.kind === "patch" ? event.data.patch : undefined);
    worker.onerror = () => finish(unifiedPatch(oldText, newText));
    worker.postMessage({ id: 0, kind: "patch", oldText, newText } satisfies WorkerRequest);
  });
}

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
  const small = React.useMemo(() => isSmall(oldText, newText), [oldText, newText]);

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
      const w = (worker.current ??= startWorker());
      w.onmessage = (event: MessageEvent<WorkerResponse>) => {
        if (event.data.id !== id || event.data.kind !== "diff") return;
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
      w.postMessage({ id, kind: "diff", oldText, newText, options } satisfies WorkerRequest);
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

"use client";

import * as React from "react";
import { runRegex, type RunInput, type RunResult } from "@/lib/regex";
import type { WorkerRequest, WorkerResponse } from "@/lib/regex.worker";
import { fail, type Result } from "@/lib/result";

/** A pattern still running after this long is stopped: it is almost certainly backtracking without end. */
export const TIMEOUT_MS = 2000;
/** Only say "Running…" once a job has taken long enough to notice. */
const SLOW_MS = 250;

export type RegexRun = { status: "done"; result: Result<RunResult> } | { status: "timeout" };

function startWorker(): Worker {
  return new Worker(new URL("../lib/regex.worker.ts", import.meta.url));
}

/**
 * Runs a pattern over the text in a worker, so a pattern that backtracks
 * forever cannot freeze the page: after TIMEOUT_MS the worker is thrown away.
 * `trusted` inputs (a library pattern on its own sample) run during render
 * instead, so the first paint, and the server render, already show matches.
 *
 * `run` is the last finished run, which may be for older inputs while
 * `pending` is true; the page keeps showing it rather than flickering.
 */
export function useRegexRun(
  input: RunInput,
  { enabled, trusted }: { enabled: boolean; trusted: boolean },
): { run: RegexRun | null; pending: boolean; slow: boolean } {
  const key = JSON.stringify(input);
  const [finished, setFinished] = React.useState<{ key: string; run: RegexRun } | null>(null);
  const [slowKey, setSlowKey] = React.useState<string | null>(null);
  const worker = React.useRef<Worker | null>(null);
  const nextId = React.useRef(0);

  const syncRun = React.useMemo<RegexRun | null>(
    () => (enabled && trusted ? { status: "done", result: runRegex(JSON.parse(key) as RunInput) } : null),
    [enabled, trusted, key],
  );

  React.useEffect(() => {
    if (!enabled || trusted) return;
    const request = JSON.parse(key) as RunInput;
    let settled = false;
    const finish = (run: RegexRun) => {
      settled = true;
      window.clearTimeout(slowTimer);
      window.clearTimeout(deadline);
      setFinished({ key, run });
    };
    const discard = (w: Worker) => {
      w.terminate();
      if (worker.current === w) worker.current = null;
    };

    const id = ++nextId.current;
    const w = (worker.current ??= startWorker());
    const slowTimer = window.setTimeout(() => setSlowKey(key), SLOW_MS);
    const deadline = window.setTimeout(() => {
      discard(w);
      finish({ status: "timeout" });
    }, TIMEOUT_MS);
    w.onmessage = (event: MessageEvent<WorkerResponse>) => {
      if (event.data.id === id) finish({ status: "done", result: event.data.result });
    };
    w.onerror = () => {
      discard(w);
      finish({ status: "done", result: fail("The pattern could not be run in this browser.") });
    };
    w.postMessage({ id, ...request } satisfies WorkerRequest);

    return () => {
      window.clearTimeout(slowTimer);
      window.clearTimeout(deadline);
      // A worker cannot be interrupted: a job still running for old inputs is cancelled by replacing the worker.
      if (!settled) discard(w);
    };
  }, [enabled, trusted, key]);

  React.useEffect(
    () => () => {
      worker.current?.terminate();
      worker.current = null;
    },
    [],
  );

  if (!enabled) return { run: null, pending: false, slow: false };
  if (syncRun) return { run: syncRun, pending: false, slow: false };
  const pending = finished?.key !== key;
  return { run: finished?.run ?? null, pending, slow: pending && slowKey === key };
}

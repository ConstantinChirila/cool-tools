import { runRegex, type RunInput, type RunResult } from "@/lib/regex";
import type { Result } from "@/lib/result";

export type WorkerRequest = { id: number } & RunInput;
export type WorkerResponse = { id: number; result: Result<RunResult> };

addEventListener("message", (event: MessageEvent<WorkerRequest>) => {
  const { id, ...input } = event.data;
  postMessage({ id, result: runRegex(input) } satisfies WorkerResponse);
});

import { diffText, WORKER_TIMEOUT_MS, type DiffOptions, type DiffResult } from "@/lib/text-diff";

export interface DiffRequest {
  id: number;
  oldText: string;
  newText: string;
  options: DiffOptions;
}

export interface DiffResponse {
  id: number;
  result: DiffResult;
}

addEventListener("message", (event: MessageEvent<DiffRequest>) => {
  const { id, oldText, newText, options } = event.data;
  const response: DiffResponse = { id, result: diffText(oldText, newText, options, WORKER_TIMEOUT_MS) };
  postMessage(response);
});

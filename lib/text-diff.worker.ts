import { diffText, unifiedPatch, WORKER_TIMEOUT_MS, type DiffOptions, type DiffResult } from "@/lib/text-diff";

export type WorkerRequest =
  | { id: number; kind: "diff"; oldText: string; newText: string; options: DiffOptions }
  | { id: number; kind: "patch"; oldText: string; newText: string };

export type WorkerResponse =
  | { id: number; kind: "diff"; result: DiffResult }
  /** `patch` is undefined when building it ran out of time. */
  | { id: number; kind: "patch"; patch: string | undefined };

addEventListener("message", (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;
  const response: WorkerResponse =
    request.kind === "diff"
      ? {
          id: request.id,
          kind: "diff",
          result: diffText(request.oldText, request.newText, request.options, WORKER_TIMEOUT_MS),
        }
      : {
          id: request.id,
          kind: "patch",
          patch: unifiedPatch(request.oldText, request.newText, WORKER_TIMEOUT_MS),
        };
  postMessage(response);
});

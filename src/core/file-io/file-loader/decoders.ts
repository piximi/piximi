import * as Comlink from "comlink";

import { CancelSource } from "core/dl/cancel";

import { loadImage } from "./loadImage";

import type {
  ImportImageInput,
  LoadAndPrepareOutput,
  LoadImageWorkerAPI,
  ReadStage,
} from "./types";

export type DecodeProgress = (progress: {
  value: number;
  stage: ReadStage;
}) => void;

/*
 * Turns one file into a series' entities with raw channel buffers; the
 * backend stores those and announces the images. `requiredChannels` is the
 * project's channel count, which every file must match.
 */
export type ImageDecoder = (
  input: ImportImageInput,
  signal: AbortSignal,
  onProgress: DecodeProgress,
  requiredChannels?: number,
) => Promise<LoadAndPrepareOutput>;

const linkedCancelSource = (signal: AbortSignal): CancelSource => {
  const source = new CancelSource();
  if (signal.aborted) source.signal();
  else signal.addEventListener("abort", () => source.signal(), { once: true });
  return source;
};

/*
 * Decodes in a worker of its own, terminated when done. The token is
 * proxied so the worker's checks see the live source; a terminated worker
 * never answers, so the call is raced against the source's rejection.
 */
export const workerImageDecoder: ImageDecoder = (
  input,
  signal,
  onProgress,
  requiredChannels,
) => {
  const source = linkedCancelSource(signal);
  const worker = new Worker(
    new URL("./worker/loadImageWorker.ts", import.meta.url),
    { type: "module" },
  );
  const proxy = Comlink.wrap<LoadImageWorkerAPI>(worker);
  return Promise.race([
    proxy.loadImage(
      input,
      Comlink.proxy(source.token),
      Comlink.proxy(onProgress),
      requiredChannels,
    ),
    source.whenSignaled,
  ]).finally(() => worker.terminate());
};

/* The same decoding on the calling thread, for tests and the fake backend. */
export const inlineImageDecoder: ImageDecoder = (
  input,
  signal,
  onProgress,
  requiredChannels,
) =>
  loadImage(
    input,
    linkedCancelSource(signal).token,
    onProgress,
    requiredChannels,
  );

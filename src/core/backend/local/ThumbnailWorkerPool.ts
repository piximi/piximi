import * as Comlink from "comlink";

import { CancelSource } from "core/dl/cancel";

import type { RenderResult } from "../types";
import type { ThumbnailItem, ThumbnailRenderer } from "./thumbnails";
import type {
  ThumbnailWorkerApi,
  ThumbnailWorkerResult,
} from "./thumbnailWorker";

type Slot = { worker: Worker; api: Comlink.Remote<ThumbnailWorkerApi> };

const toRenderResult = (result: ThumbnailWorkerResult): RenderResult =>
  result.ok
    ? {
        index: result.index,
        ok: true,
        image: {
          width: result.width,
          height: result.height,
          dataUrl: result.dataUrl,
        },
      }
    : { index: result.index, ok: false, error: new Error(result.message) };

/*
 * A fixed set of long-lived render workers fed in small batches, in request
 * order. Earlier requests finish first (the grids pass the visible window
 * first), several batches run at once, and a batch is small enough that a
 * cancelled render stops within a few items. Workers are created on first use
 * and live until `dispose`.
 */
export class ThumbnailWorkerPool implements ThumbnailRenderer {
  #slots: Slot[] = [];
  #free: number[] = [];
  #waiters: Array<(slot: number) => void> = [];
  readonly #poolSize: number;
  readonly #batchSize: number;

  constructor(poolSize = 4, batchSize = 8) {
    this.#poolSize = poolSize;
    this.#batchSize = batchSize;
  }

  #acquire(): Promise<number> {
    const free = this.#free.pop();
    if (free !== undefined) return Promise.resolve(free);
    if (this.#slots.length < this.#poolSize) {
      const worker = new Worker(
        new URL("./thumbnailWorker.ts", import.meta.url),
        { type: "module" },
      );
      this.#slots.push({
        worker,
        api: Comlink.wrap<ThumbnailWorkerApi>(worker),
      });
      return Promise.resolve(this.#slots.length - 1);
    }
    return new Promise((resolve) => this.#waiters.push(resolve));
  }

  #release(slot: number) {
    const waiter = this.#waiters.shift();
    if (waiter) waiter(slot);
    else this.#free.push(slot);
  }

  async *render(
    items: ThumbnailItem[],
    signal?: AbortSignal,
  ): AsyncIterable<RenderResult> {
    const cancel = new CancelSource();
    const onAbort = () => cancel.signal();
    if (signal?.aborted) cancel.signal();
    else signal?.addEventListener("abort", onAbort, { once: true });

    const indexed = items.map((item, index) => ({ ...item, index }));
    const batches: Array<typeof indexed> = [];
    for (let i = 0; i < indexed.length; i += this.#batchSize) {
      batches.push(indexed.slice(i, i + this.#batchSize));
    }

    type Done = { slot: number; results: ThumbnailWorkerResult[] };
    const inFlight = new Map<number, Promise<Done>>();
    let next = 0;

    try {
      while (
        (next < batches.length || inFlight.size > 0) &&
        !cancel.isSignaled()
      ) {
        while (next < batches.length && inFlight.size < this.#poolSize) {
          const slot = await this.#acquire();
          const batch = batches[next++];
          inFlight.set(
            slot,
            this.#slots[slot].api
              .renderComposites(batch, Comlink.proxy(cancel.token))
              .then((results) => ({ slot, results })),
          );
        }
        const { slot, results } = await Promise.race(inFlight.values());
        inFlight.delete(slot);
        this.#release(slot);
        for (const result of results) yield toRenderResult(result);
      }
    } finally {
      signal?.removeEventListener("abort", onAbort);
      cancel.signal();
      // Batches still running will stop at their next item and free their slot.
      for (const [slot, promise] of inFlight) {
        void promise.finally(() => this.#release(slot));
      }
    }
  }

  dispose() {
    for (const { worker, api } of this.#slots) {
      api[Comlink.releaseProxy]();
      worker.terminate();
    }
    this.#slots = [];
    this.#free = [];
    this.#waiters = [];
  }
}

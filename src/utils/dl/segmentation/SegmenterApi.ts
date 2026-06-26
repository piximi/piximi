import * as Comlink from "comlink";

import type { LoadCB } from "utils/types";
import { logger } from "utils/logUtils";

import { registerSegmenterHmrCleanup } from "../devHmrCleanup";

import type { Token } from "../cancel";
import type { InferenceInput } from "../types";
import type { ISegmenterApi, ModelName } from "./types";
import type { SegmenterHandler } from "./worker/SegmenterHandler";

export class SegmenterApi implements ISegmenterApi {
  private worker: Worker;
  private backend: Comlink.Remote<SegmenterHandler>;
  private static instance: SegmenterApi | undefined;

  private constructor(/*backendTarget: "local"|"remote"*/) {
    this.worker = new Worker(
      new URL("./worker/segmenterWorker.ts", import.meta.url),
      { type: "module" },
    );
    this.worker.onerror = (e) => {
      console.error("[segmenterHandler] worker error:", e.message, e);
    };
    const workerProxy = Comlink.wrap<SegmenterHandler>(this.worker);

    this.backend = workerProxy;
    registerSegmenterHmrCleanup(this);
  }

  // ===========================================================================
  // PUBLIC API: BEGIN
  // ===========================================================================

  /**
   * Get singleton instance
   */
  static getInstance(): SegmenterApi {
    if (!SegmenterApi.instance) {
      SegmenterApi.instance = new SegmenterApi();
    }
    return SegmenterApi.instance;
  }

  // ---- registry reads ----
  getModelNames() {
    return this.backend.getModelNames();
  }

  getAvailableSegmentationModels() {
    return this.backend.getAvailableSegmentationModels();
  }
  getModelInfo(name: ModelName) {
    return this.backend.getModelInfo(name);
  }
  hasModel(name: ModelName) {
    return this.backend.hasModel(name);
  }

  loadModel(modelName: ModelName) {
    return this.backend.loadModel(modelName);
  }
  // ---- inference  ----
  predict(
    name: ModelName,
    items: InferenceInput[],
    cancelToken: Token,
    loadCB?: LoadCB,
  ) {
    if (!loadCB) {
      loadCB = (loadPercent: number, loadMessage: string) =>
        logger(`${loadPercent}% Completed: ${loadMessage}`);
    }
    return this.backend.predict(
      name,
      items,
      cancelToken,
      Comlink.proxy(loadCB),
    );
  }

  // ---- model I/O ----

  getSavedModelData(modelName: ModelName) {
    return this.backend.getSavedModelData(modelName);
  }
  getZippedModelsBuffer() {
    return this.backend.getZippedModelsBuffer();
  }
  async destroy() {
    try {
      await this.backend.destroy();
    } catch (e) {
      console.warn("[SegmenterApi] backend.destroy() rejected:", e);
    }
    this.backend[Comlink.releaseProxy]?.();
    this.worker.terminate();
    if (SegmenterApi.instance === this) {
      SegmenterApi.instance = undefined;
    }
    return { success: true as const };
  }
}

export type SegmenterBackend = "local" | "remote";

let current: { backend: SegmenterBackend; api: ISegmenterApi } | undefined;

const construct = (backend: SegmenterBackend): ISegmenterApi => {
  if (backend === "local") {
    // SegmenterApi.getInstance() enforces its own private singleton, so this
    // is safe to call from the resolver.
    return SegmenterApi.getInstance();
  }
  // backend === "remote"
  throw new Error(
    "Remote classifier backend is not implemented yet. " +
      "Construct it here when the remote ISegmenterApi implementation lands.",
  );
};

/**
 * Get the currently-active backend, lazily constructing the default ("local")
 * on first call. Use from non-React code (services, listeners, loaders).
 * React components should prefer `useClassifierApi()`.
 */
export function getSegmenterApi(): ISegmenterApi {
  if (!current) {
    current = { backend: "local", api: construct("local") };
  }
  return current.api;
}

/**
 * Switch which backend is active. Destroys the previous backend before
 * constructing the new one — switching is expensive on purpose.
 *
 * No consumer in this refactor calls this. It exists as the seam for the
 * future functionality that lets the user pick a backend.
 */
export async function setSegmenterBackend(
  backend: SegmenterBackend,
): Promise<ISegmenterApi> {
  if (current?.backend === backend) return current.api;
  // TODO await current?.api.destroy();
  current = { backend, api: construct(backend) };
  return current.api;
}

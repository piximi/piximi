// src/utils/dl/classification/classifierHandler.ts
import * as Comlink from "comlink";

import type {
  FitOptions,
  TrainingCallbacks,
  IClassifierApi,
  OptimizerSettings,
} from "./types";
import type JSZip from "jszip";
import type { ClassifierHandler } from "./worker/ClassifierHandler";

async function zipInputToBuffer(
  input: JSZip | File | Blob | ArrayBuffer,
): Promise<ArrayBuffer> {
  if (input instanceof ArrayBuffer) return input;
  if (input instanceof Blob) return input.arrayBuffer();
  // JSZip
  return (input as JSZip).generateAsync({ type: "arraybuffer" });
}

export class ClassifierApi implements IClassifierApi {
  private backend: Comlink.Remote<ClassifierHandler>;
  private static instance: ClassifierApi | undefined;

  private constructor(/*backendTarget: "local"|"remote"*/) {
    const worker = new Worker(
      new URL("./worker/classifierWorker.ts", import.meta.url),
      { type: "module" },
    );
    worker.onerror = (e) => {
      console.error("[classifierHandler] worker error:", e.message, e);
    };
    const workerProxy = Comlink.wrap<ClassifierHandler>(worker);

    // Dev HMR: terminate on reload so we don't orphan worker instances.
    if (import.meta.hot) {
      import.meta.hot.dispose(() => {
        this.backend?.[Comlink.releaseProxy]?.();
        worker?.terminate();
      });
    }
    this.backend = workerProxy;
  }

  // ===========================================================================
  // PUBLIC API: BEGIN
  // ===========================================================================

  /**
   * Get singleton instance
   */
  static getInstance(): ClassifierApi {
    if (!ClassifierApi.instance) {
      ClassifierApi.instance = new ClassifierApi();
    }
    return ClassifierApi.instance;
  }

  // ---- registry reads ----
  getModelNames() {
    return this.backend.getModelNames();
  }
  getModelInfo(name: string) {
    return this.backend.getModelInfo(name);
  }
  hasModel(name: string) {
    return this.backend.hasModel(name);
  }

  // ---- lifecycle ----
  async createNewModel(name: string, arch: any, seed: number) {
    return this.backend.createNewModel(name, arch, seed);
  }
  async removeModel(name: string) {
    return this.backend.removeModel(name);
  }
  async removeAllModels() {
    return this.backend.removeAllModels();
  }

  // ---- data loading ----
  loadTraining(name: string, items: any, cats: any, seed: number) {
    return this.backend.loadTraining(name, items, cats, seed);
  }
  loadValidation(name: string, items: any, cats: any, seed: number) {
    return this.backend.loadValidation(name, items, cats, seed);
  }
  loadInference(name: string, items: any, cats: any) {
    return this.backend.loadInference(name, items, cats);
  }
  loadData(name: string, tr: any, va: any, cats: any, seed: number) {
    return this.backend.loadData(name, tr, va, cats, seed);
  }

  prepareModel(
    name: string,
    tr: any,
    va: any,
    n: number,
    cats: any,
    pp: any,
    opt: any,
    seed: number,
  ) {
    return this.backend.prepareModel(name, tr, va, n, cats, pp, opt, seed);
  }
  recompile(modelName: string, optimizerSettings: OptimizerSettings) {
    return this.backend.recompile(modelName, optimizerSettings);
  }

  // ---- training ----
  async train(name: string, options: FitOptions, callbacks: TrainingCallbacks) {
    return this.backend.train(name, options, Comlink.proxy(callbacks));
  }
  cancelTraining(name: string) {
    return this.backend.cancelTraining(name);
  }

  // ---- inference / eval ----
  predict(name: string, cats: any) {
    return this.backend.predict(name, cats);
  }
  evaluate(name: string) {
    return this.backend.evaluate(name);
  }

  // ---- model I/O ----
  async modelFromFiles(input: {
    descFile: File;
    weightsFiles: File[];
    isGraph?: boolean;
    modelName?: string;
  }) {
    return this.backend.modelFromFiles(input);
  }
  async modelFromUrl(url: string, fromTFHub: boolean, isGraph: boolean) {
    return this.backend.modelFromUrl(url, fromTFHub, isGraph);
  }

  async modelsFromZipBuffer(input: JSZip | File | Blob | ArrayBuffer) {
    const buf = await zipInputToBuffer(input);
    return this.backend.modelsFromZipBuffer(Comlink.transfer(buf, [buf]));
  }

  getSavedModelData(modelName: string) {
    return this.backend.getSavedModelData(modelName);
  }
  getZippedModelsBuffer() {
    return this.backend.getZippedModelsBuffer();
  }
}

export type ClassifierBackend = "local" | "remote";

let current: { backend: ClassifierBackend; api: IClassifierApi } | undefined;

const construct = (backend: ClassifierBackend): IClassifierApi => {
  if (backend === "local") {
    // ClassifierApi.getInstance() enforces its own private singleton, so this
    // is safe to call from the resolver.
    return ClassifierApi.getInstance();
  }
  // backend === "remote"
  throw new Error(
    "Remote classifier backend is not implemented yet. " +
      "Construct it here when the remote IClassifierApi implementation lands.",
  );
};

/**
 * Get the currently-active backend, lazily constructing the default ("local")
 * on first call. Use from non-React code (services, listeners, loaders).
 * React components should prefer `useClassifierApi()`.
 */
export function getClassifierApi(): IClassifierApi {
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
export async function setClassifierBackend(
  backend: ClassifierBackend,
): Promise<IClassifierApi> {
  if (current?.backend === backend) return current.api;
  // TODO await current?.api.destroy();
  current = { backend, api: construct(backend) };
  return current.api;
}

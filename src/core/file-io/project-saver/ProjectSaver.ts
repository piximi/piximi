import * as Comlink from "comlink";

import type { ClassifierState } from "store/classifier/types";
import { getClassifierApi } from "core/dl/classification";

import type { CancelToken } from "utils/workers/types";
import { logger, parseError } from "utils/logUtils";
import type { Progress } from "utils/types";
import { INITIAL_PROGRESS } from "utils/types";

import type { SerializedModels } from "core/dl/types";
import type {
  IProjectSaver,
  SaveProjectInput,
  SaveProjectResult,
  SaveProjectWorkerInput,
} from "./types";

const STAGES = {
  collectModels: { start: 0.0, end: 0.1 },
  writeProject: { start: 0.1, end: 1.0 },
} as const;

type OnProgressCallback = (args: { value: number }) => void;

interface SaveProjectWorkerAPI {
  saveProject(
    input: SaveProjectWorkerInput,
    cancelToken: CancelToken,
    onProgress: OnProgressCallback,
  ): Promise<{ blob: Blob }>;
}

/**
 * ProjectSaver
 *
 * Main-thread counterpart to {@link ProjectLoader}. Gathers the pieces that
 * only exist on this side — the TF.js model files, which live in the classifier
 * worker's registry — then hands the whole payload to a worker that writes the
 * zarr tree and generates the zip.
 *
 * Channel pixel data is deliberately *not* gathered here; the save worker reads
 * it from IndexedDB itself. See `saveProject.ts` for why.
 */
export class ProjectSaver implements IProjectSaver {
  private progress: Progress = { ...INITIAL_PROGRESS };
  private progressListeners: Set<(progress: Progress) => void> = new Set();
  private abortController: AbortController | null = null;

  async saveProject(input: SaveProjectInput): Promise<SaveProjectResult> {
    this.resetProgress();
    const abortController = this.abortController;

    const worker = new Worker(
      new URL("./worker/saveProjectWorker.ts", import.meta.url),
      { type: "module" },
    );
    const proxy = Comlink.wrap<SaveProjectWorkerAPI>(worker);

    try {
      this.updateProgress({ stage: "serializing" });

      const models = await this.collectModels(input.project.classifier);
      this.updateProgress({
        overallProgress: STAGES.collectModels.end,
        stageProgress: 1,
      });

      const { blob } = await proxy.saveProject(
        { ...input, models },
        {
          get cancelled() {
            return abortController?.signal.aborted ?? false;
          },
        },
        Comlink.proxy(({ value }: { value: number }) => {
          this.updateProgress({
            overallProgress:
              STAGES.writeProject.start +
              (STAGES.writeProject.end - STAGES.writeProject.start) * value,
            stageProgress: value,
          });
        }),
      );

      this.updateProgress({ stage: "complete", overallProgress: 1 });
      return { success: true, blob };
    } catch (e) {
      if (abortController?.signal.aborted) {
        return { success: false, cancelled: true };
      }
      this.updateProgress({ stage: "error" });
      return { success: false, cancelled: false, error: parseError(e) };
    } finally {
      proxy[Comlink.releaseProxy]();
      worker.terminate();
    }
  }

  /**
   * Pull topology + weights for every model the classifier state references.
   *
   * A `modelInfoDict` entry can outlive its model — configured but never
   * created, or created in a session that has since been reloaded. Those are
   * skipped rather than failing the save; their settings and run history still
   * round-trip through the zarr tree, only the weights are gone.
   */
  private async collectModels(
    classifier: ClassifierState,
  ): Promise<SerializedModels> {
    const cfApi = getClassifierApi();
    const modelNames = new Set<string>();
    for (const kindClassifier of Object.values(classifier.kindClassifiers)) {
      Object.keys(kindClassifier.modelInfoDict).forEach((name) =>
        modelNames.add(name),
      );
    }

    const models: SerializedModels = {};
    let collected = 0;
    for (const modelName of modelNames) {
      const result = await cfApi.getSavedModelData(modelName);
      if (result.success) {
        models[modelName] = result.data;
      } else {
        logger(
          `Skipping weights for "${modelName}": ${result.reason.code} ${result.reason.message}`,
          { level: "warn" },
        );
      }

      this.updateProgress({
        overallProgress:
          STAGES.collectModels.end * (++collected / modelNames.size),
        stageProgress: collected / modelNames.size,
      });
    }

    return models;
  }

  // ============================================================
  // Progress Management
  // ============================================================

  onProgress(callback: (progress: Progress) => void): () => void {
    this.progressListeners.add(callback);
    callback(this.progress);
    return () => {
      this.progressListeners.delete(callback);
    };
  }

  getProgress(): Progress {
    return { ...this.progress };
  }

  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.updateProgress({ stage: "cancelled" });
    }
  }

  private updateProgress(updates: Partial<Progress>): void {
    this.progress = { ...this.progress, ...updates };
    this.notifyProgressListeners();
  }

  private notifyProgressListeners(): void {
    for (const listener of this.progressListeners) {
      listener(this.progress);
    }
  }

  private resetProgress(): void {
    this.progress = { ...INITIAL_PROGRESS };
    this.abortController = new AbortController();
  }
}

import * as Comlink from "comlink";

import type {
  AnnotationObject,
  ChannelMeta,
  ImageObject,
  ImageSeries,
} from "store/data/types";

import type { Progress, TaskError } from "utils/types";
import { INITIAL_PROGRESS } from "utils/types";
import { DataConnector } from "utils/data-connector";
import type { CancelToken } from "utils/workers/types";
import type { StorageInput } from "utils/data-connector/types";
import { STORES } from "utils/data-connector/types";
import { logger, parseError } from "utils/logUtils";
import type { ExtractedModelFileMap } from "utils/dl/types";
import { getClassifierApi } from "utils/dl/classification";

import type { V2Channel } from "./version-readers/version-types/v2Types";
import type {
  DeserializedProject,
  DeserializedProjectResult,
  IProjectLoader,
  LoadProjectInput,
  LoadProjectOutput,
  UploadStage,
} from "./types";

const STAGES = {
  loadProject: { start: 0.0, end: 0.75 },
  storeChannels: { start: 0.75, end: 0.8 },
  registerModels: { start: 0.8, end: 1 },
} as const;

type OnProgressCallback<TExtra = object> = (
  args: { value: number } & TExtra,
) => void;
interface LoadImageWorkerAPI {
  loadProject(
    payload: LoadProjectInput,
    cancelToken: CancelToken,
    onProgress: OnProgressCallback<object>,
  ): Promise<LoadProjectOutput>;
}
/**
 * ProjectSerializationService
 *
 * Pure, stateless service for reading/writing Piximi's Zarr-based project format.
 * No IndexedDB, no Redux, no singletons — only knows about the Zarr format.
 *
 * Side effects (tensor storage) are delegated to callbacks provided by the caller.
 * This makes the service testable, reusable, and decoupled from storage concerns.
 *
 * Usage:
 *   const serializer = new ProjectSerializationService();
 *   const result = await serializer.deserialize(buffer, {
 *     onImage: async (rawData) => { store in IndexedDB; return tensorRef; },
 *     onAnnotation: async (rawData) => { store in IndexedDB; return tensorRef; },
 *   }, onProgress);
 */
export class ProjectLoader implements IProjectLoader {
  private storage: DataConnector;
  private progress: Progress = { ...INITIAL_PROGRESS };
  private progressListeners: Set<(progress: Progress) => void> = new Set();
  private abortController: AbortController | null = null;

  constructor() {
    this.storage = DataConnector.getInstance();
  }
  // ============================================================
  // Deserialization (project file → structured data)
  // ============================================================

  async uploadProject(files: File[]): Promise<DeserializedProjectResult> {
    const worker = new Worker(
      new URL("./worker/loadProjectWorker.ts", import.meta.url),
      { type: "module" },
    );
    const proxy = Comlink.wrap<LoadImageWorkerAPI>(worker);
    const abortController = this.abortController;
    try {
      // const { project: v2Raw, modelFiles } = await handle.promise;
      const { project: v2Raw, modelFiles } = await proxy.loadProject(
        { files },
        {
          get cancelled() {
            return abortController?.signal.aborted ?? false;
          },
        },
        Comlink.proxy(({ value }) => {
          this.updateProgress({
            overallProgress: STAGES.loadProject.end * value,
            stageProgress: value,
          });
        }),
      );

      this.updateProgress({ stageProgress: 0 });
      const channels = await this.storeChannels(v2Raw.data.channels.entities);
      this.updateProgress({
        overallProgress: STAGES.storeChannels.end,
        stageProgress: 1,
      });
      this.registerClassifiers(modelFiles, (p: number) =>
        this.updateProgress({
          overallProgress:
            STAGES.storeChannels.end +
            (STAGES.registerModels.end - STAGES.registerModels.start) * p,
          stageProgress: p,
        }),
      );

      const v2Data = v2Raw.data;
      const piximiState: DeserializedProject = {
        ...v2Raw,
        data: {
          experiment: v2Data.experiment,
          imageSeries: Object.values(
            v2Data.imageSeries.entities,
          ) as ImageSeries[],
          channelMetas: Object.values(
            v2Data.channelMetas.entities,
          ) as ChannelMeta[],
          kinds: Object.values(v2Data.kinds.entities),
          categories: Object.values(v2Data.categories.entities),
          images: Object.values(v2Data.images.entities) as ImageObject[],
          annotationVolumes: Object.values(v2Data.annotationVolumes.entities),
          planes: Object.values(v2Data.planes.entities),
          channels,
          annotations: Object.values(
            v2Data.annotations.entities,
          ) as AnnotationObject[],
        },
      };

      return { success: true, project: piximiState };
    } catch (e) {
      return { success: false, cancelled: false, error: parseError(e) };
    }
  }

  private async storeChannels(
    v2Channels: Record<string, V2Channel>,
  ): Promise<DeserializedProject["data"]["channels"]> {
    const v2ChannelArr = Object.values(v2Channels);

    const storageItems: StorageInput[] = v2ChannelArr.map((v2Ch) => ({
      id: v2Ch.id,
      storeName: STORES.CHANNEL_DATA,
      data: v2Ch,
    }));
    const storageRes = await this.storage.storeBatch(storageItems);
    if (!storageRes.success) {
      throw new Error("Failed to store data in indexeddb");
    }

    const channels: DeserializedProject["data"]["channels"] =
      storageRes.data.map((res) => {
        const {
          data: _data,
          histogram: _histogram,
          ...rest
        } = v2Channels[res.storageId]!;
        return {
          ...rest,
          storageReference: res,
        };
      });

    return channels;
  }

  private async registerClassifiers(
    modelFileMap: ExtractedModelFileMap,
    onProgress: (p: number) => void,
  ): Promise<void> {
    const cfApi = getClassifierApi();
    const modelFileArr = Object.entries(modelFileMap);

    let modelIdx = 0;
    for (const [modelName, modelFiles] of modelFileArr) {
      const result = await cfApi.modelFromFiles({
        descFile: modelFiles.modelJson!,
        weightsFiles: [modelFiles.modelWeights!],
        // Without this the name is derived from the desc file, which is now
        // `model.json` for every model — they'd all register as "model" and
        // stop matching the model names in the restored classifier state.
        modelName,
      });
      //TODO: implement alert toast with success message
      if (result.success) logger(`successfully added ${result.data.name}`);
      else {
        /**
         * TODO: failed models should halt project upload, but there needs to be a way
         * TODO: to warn the user. Maybe a warning callback passed to the constructor
         */
        console.error(
          `[registerClassifiers: ${modelFiles.modelJson?.name}] ${result.reason.code}: ${result.reason.message}`,
          result.reason.cause,
        );
      }
      onProgress(++modelIdx / modelFileArr.length);
    }
  }

  // ============================================================
  // Progress Management
  // ============================================================

  /**
   * Subscribe to progress updates
   * Returns unsubscribe function
   */
  onProgress(callback: (progress: Progress) => void): () => void {
    this.progressListeners.add(callback);
    // Immediately send current progress
    callback(this.progress);
    return () => {
      this.progressListeners.delete(callback);
    };
  }

  /**
   * Get current progress
   */
  getProgress(): Progress {
    return { ...this.progress };
  }

  /**
   * Get current stage
   */
  getStatus(): UploadStage {
    return this.progress.stage as UploadStage;
  }

  /**
   * Cancel current operation
   */
  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.updateProgress({ stage: "cancelled" });
    }
  }

  // ============================================================
  // PUBLIC -- END
  // ============================================================
  // ============================================================
  // PRIVATE -- START
  // ============================================================

  private updateProgress(updates: Partial<Progress>): void {
    this.progress = { ...this.progress, ...updates };
    this.notifyProgressListeners();
  }
  private updateErrors(error: TaskError): void {
    const sourceErrors = this.progress.errors.get(error.source);
    if (sourceErrors === undefined) {
      this.progress.errors.set(error.source, [error]);
      return;
    }
    this.progress.errors.set(error.source, [...sourceErrors, error]);
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

  // ============================================================
  // PRIVATE -- END
  // ============================================================
}

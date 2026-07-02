import * as Comlink from "comlink";

import type {
  Channel,
  ChannelMeta,
  Plane,
  ImageObject,
} from "store/dataV2/types";

import type { Progress, TaskError } from "utils/types";
import { DataConnector } from "utils/data-connector";
import type { CancelToken } from "utils/worker-scheduler/types";
import { parseError } from "utils/logUtils";
import { STORES } from "utils/data-connector/types";

import { overallProgress } from "./progress";

import type {
  ChannelResult,
  FileInterpretationResult,
  FileUploadResult,
  IFileLoader,
  ImageSeriesResult,
  ImportImageInput,
  LoadAndPrepareOutput,
  ReaderResult,
  StageName,
  TiffImportConfig,
  UploadStage,
} from "./types";

export const INITIAL_PROGRESS: Progress = {
  stage: "idle",
  stageProgress: 0,
  overallProgress: 0,
  processedCount: 0,
  totalCount: 0,
  errors: new Map<string, TaskError[]>(),
  warnings: [],
};

type OnProgressCallback = (args: { value: number; stage: StageName }) => void;
interface LoadImageWorkerAPI {
  loadImage(
    payload: ImportImageInput,
    cancelToken: CancelToken,
    onProgress: OnProgressCallback,
  ): Promise<LoadAndPrepareOutput>;
}
/**
 * FileLoader
 *
 * Central orchestrator for all data ingestion operations in Piximi.
 * Coordinates between workers (for heavy processing), IndexedDB (for storage),
 * and Redux (for state management).
 *
 * Key principles:
 * - All heavy work happens in workers
 * - Data is fully prepared before entering Redux
 * - Progress is reported at each stage
 * - Operations are cancellable
 */
export class FileLoader implements IFileLoader {
  private activeWorkers: Worker[] = [];
  private storage: DataConnector;
  private progress: Progress = { ...INITIAL_PROGRESS };
  private progressListeners: Set<(progress: Progress) => void> = new Set();
  private abortController: AbortController | null = null;
  private tiffConfigs?: Map<string, TiffImportConfig>;
  private cachedBuffers?: Map<string, ArrayBuffer>;
  private fileIntepretation: FileInterpretationResult;

  public constructor(
    fileIntepretation: FileInterpretationResult,
    tiffConfigs?: Map<string, TiffImportConfig>,
    cachedBuffers?: Map<string, ArrayBuffer>,
  ) {
    this.storage = DataConnector.getInstance();
    this.fileIntepretation = fileIntepretation;
    this.tiffConfigs = tiffConfigs;
    this.cachedBuffers = cachedBuffers;
  }

  // ============================================================
  // Main Entry Points
  // ============================================================

  /**
   * Upload and process files
   *
   * 1. Analyze files to detect types
   * 2. Handle time series grouping
   * 3. Dispatch to workers for loading + preparation
   * 4. Store tensors in IndexedDB
   * 5. Return data ready for Redux dispatch
   */

  async uploadFiles(files: FileList): Promise<FileUploadResult> {
    this.resetProgress();

    try {
      // -- Stage 1: Analyze
      this.updateProgress({
        stage: "Loading Images",
        totalCount: files.length,
        overallProgress: overallProgress("analyze", 0),
      });

      // Single dispatch path for ALL formats
      this.updateProgress({
        overallProgress: overallProgress("load", 0),
      });
      const imageResults = await this.dispatchFiles(
        files,
        this.fileIntepretation.fileResults,
        this.tiffConfigs,
        this.cachedBuffers,
      );

      if (!imageResults.success) {
        if (imageResults.cancelled) {
          return { success: false, cancelled: true };
        }
        return {
          success: false,
          cancelled: false,
          data: [],
        };
      }

      this.updateProgress({
        overallProgress: overallProgress("store", 0),
      });
      const storageResult = await this.storeAndAttach(
        imageResults.data.channelData,
      );

      if (!storageResult.success) {
        this.updateProgress({ stage: "error" });
        return {
          success: false,
          cancelled: false,
          data: [],
        };
      }

      // Collect results — to be dispatched by the caller
      // (DataPipelineService does NOT dispatch to Redux directly;
      //  it returns data that the React component dispatches)

      this.updateProgress({
        overallProgress: overallProgress("finalize", 1),
      });
      this.updateProgress({ stage: "idle" });

      return {
        success: true,
        cancelled: false,
        data: [
          {
            fileName: files[0].name,
            imageSeries: imageResults.data.imageSeries,
            images: imageResults.data.images,
            planes: imageResults.data.planes,
            channelMetas: imageResults.data.channelMetas,
            channels: storageResult.channels,
          },
        ],
      };
    } catch (err) {
      this.updateProgress({ stage: "error" });
      throw err;
    }
  }

  async dispatchFiles(
    files: FileList,
    fileAnalyses: FileInterpretationResult["fileResults"],
    tiffConfigs?: Map<string, TiffImportConfig>,
    cachedBuffers?: Map<string, ArrayBuffer>,
  ): Promise<ReaderResult> {
    const workerTasks: Array<{
      fileName: string;
      promise: Promise<LoadAndPrepareOutput>;
    }> = [];

    for (let i = 0; i < files.length; i++) {
      if (this.abortController?.signal.aborted) {
        return { success: false, cancelled: true };
      }

      const file = files[i];
      try {
        const fileData =
          cachedBuffers?.get(file.name) ?? (await file.arrayBuffer());
        const worker = new Worker(
          new URL("./worker/loadImageWorker.ts", import.meta.url),
          { type: "module" },
        );
        this.activeWorkers.push(worker);
        const proxy = Comlink.wrap<LoadImageWorkerAPI>(worker);
        const abortController = this.abortController;
        const promise = proxy
          .loadImage(
            {
              fileData,
              fileName: file.name,
              mimeType: fileAnalyses[file.name].mimeType,
              dimConfig: tiffConfigs?.get(file.name),
            },
            {
              get cancelled() {
                return abortController?.signal.aborted ?? false;
              },
            },
            Comlink.proxy(({ value, stage }) => {
              this.updateProgress({
                stageProgress: overallProgress(stage, value),
              });
            }),
          )
          .finally(() => {
            worker.terminate();
            this.activeWorkers = this.activeWorkers.filter((w) => w !== worker);
            this.updateProgress({
              overallProgress: overallProgress("load", i / files.length),
            });
          });

        workerTasks.push({ fileName: file.name, promise });
      } catch (err) {
        this.updateErrors({
          source: file.name,
          error: parseError(err),
          recoverable: true,
        });
      }
    }

    return this.processImages(workerTasks);
  }

  async processImages(
    workerTasks: {
      fileName: string;
      promise: Promise<LoadAndPrepareOutput>;
    }[],
  ): Promise<ReaderResult> {
    // --  Await all worker tasks
    const results: Array<{
      fileName: string;
      output: LoadAndPrepareOutput;
    }> = [];

    for (const { fileName, promise } of workerTasks) {
      if (this.abortController?.signal.aborted) {
        return { success: false, cancelled: true };
      }
      try {
        const output = await promise;
        results.push({ fileName, output });
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          // Cancelled -- don't count as error
          continue;
        }
        this.updateErrors({
          source: fileName,
          error: parseError(err),
          recoverable: true,
        });
      }
    }

    if (results.length === 0) {
      this.updateProgress({ stage: "error" });
      return {
        success: false,
        cancelled: false,
      };
    }

    const channelData: ChannelResult[] = [];
    const imageSeries: ImageSeriesResult[] = [];
    const images: ImageObject[] = [];
    const planes: Plane[] = [];
    const channelMetas: ChannelMeta[] = [];

    results.forEach((result) => {
      imageSeries.push(...result.output.imageSeries);
      images.push(...result.output.images);
      planes.push(...result.output.planes);
      channelMetas.push(...result.output.channelMetas);
      channelData.push(...result.output.channels);
    });
    return {
      success: true,
      data: { imageSeries, channelMetas, images, planes, channelData },
    };
  }
  async storeAndAttach(
    channelData: ChannelResult[],
  ): Promise<
    { success: false; error: Error } | { success: true; channels: Channel[] }
  > {
    const storageItems = channelData.map((channel) => ({
      id: channel.id,
      storeName: STORES.CHANNEL_DATA,
      data: channel,
    }));
    const storageResult = await this.storage.storeBatch(storageItems);

    if (!storageResult.success) {
      this.updateErrors({
        source: "indexedDB",
        error: storageResult.error,
        recoverable: true,
      });
      return { success: false, error: storageResult.error };
    }

    // -- Stage 4: Build Redux-ready payload
    const refsById = new Map(
      storageResult.data.map((ref) => [ref.storageId, ref]),
    );
    const channels: Channel[] = channelData.map((item) => {
      const { data: _data, histogram: _histogram, ...rest } = item;
      return {
        ...rest,
        storageReference: refsById.get(rest.id)!,
      };
    });
    this.updateProgress({
      overallProgress: overallProgress("store", 1),
    });

    return { success: true, channels: channels };
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
      for (const worker of this.activeWorkers) {
        worker.terminate();
      }
      this.activeWorkers = [];
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

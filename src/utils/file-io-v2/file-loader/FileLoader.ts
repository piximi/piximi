import { Progress, TaskError } from "utils/types";
import {
  ChannelResult,
  FILE,
  FileInterpretationResult,
  FileUploadResult,
  IFileLoader,
  ImageSeriesResult,
  LoadAndPrepareOutput,
  ReaderResult,
  TiffAnalysisResult,
  TiffImportConfig,
  UploadOptionswithCallbacks,
  UploadStage,
} from "./types";
import { WorkerScheduler } from "utils/worker-scheduler";
import { DataConnector } from "utils/data-connector";
import { interpretFiles } from "./fileInputUtils";
import { analyzeTiff } from "./readers";
import { TaskHandle, TaskPriority } from "utils/worker-scheduler/types";
import { parseError } from "utils/logUtils";
import { Channel, ChannelMeta, Plane, ImageObject } from "store/dataV2/types";
import { STORES } from "utils/data-connector/types";
import { overallProgress } from "./progress";

export const INITIAL_PROGRESS: Progress = {
  stage: "idle",
  stageProgress: 0,
  overallProgress: 0,
  processedCount: 0,
  totalCount: 0,
  errors: new Map<string, TaskError[]>(),
  warnings: [],
};
type TiffPrepResult = {
  configs: Map<string, TiffImportConfig>;
  buffers: Map<string, ArrayBuffer>;
};

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
  private scheduler: WorkerScheduler;
  private storage: DataConnector;
  private progress: Progress = { ...INITIAL_PROGRESS };
  private progressListeners: Set<(progress: Progress) => void> = new Set();
  private abortController: AbortController | null = null;

  public constructor(scheduler: WorkerScheduler) {
    this.scheduler = scheduler;
    this.storage = DataConnector.getInstance();
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

  async uploadFiles(
    files: FileList,
    options?: UploadOptionswithCallbacks,
  ): Promise<FileUploadResult> {
    this.resetProgress();

    try {
      // -- Stage 1: Analyze
      this.updateProgress({
        stage: "Loading Images",
        totalCount: files.length,
        overallProgress: overallProgress("analyze", 0),
      });
      const interpretationResults = interpretFiles(files);
      if (this.abortController?.signal.aborted) {
        return { success: false, cancelled: true };
      }

      // TIFF-specific pre-analysis (the only format that needs a dialog)
      let tiffConfigs: Map<string, TiffImportConfig> | undefined;
      let cachedBuffers: Map<string, ArrayBuffer> | undefined;
      if (interpretationResults.imageType === FILE.TIFF) {
        const tiffPrep = await this.prepareTiffConfigs(files, options);
        if (tiffPrep === null) {
          this.resetProgress();
          return { success: false, cancelled: true };
        }
        tiffConfigs = tiffPrep.configs;
        cachedBuffers = tiffPrep.buffers;
      }

      // Single dispatch path for ALL formats
      this.updateProgress({
        overallProgress: overallProgress("load", 0),
      });
      const imageResults = await this.dispatchFiles(
        files,
        interpretationResults.fileResults,
        tiffConfigs,
        cachedBuffers,
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

  // ============================================================
  // File Analysis
  // ============================================================
  private async prepareTiffConfigs(
    files: FileList,
    options?: UploadOptionswithCallbacks,
  ): Promise<TiffPrepResult | null> {
    const { analyses, buffers } = await this.analyzeTiffs(files);

    // Index analyses by filename for quick lookup below
    const analysisByName = new Map(analyses.map((a) => [a.fileName, a]));

    const configs = new Map<string, TiffImportConfig>();

    // --- Dialog path (multi-frame files) ---
    const hasMultiframe = analyses.some((a) => a.isMultiFrame);
    if (hasMultiframe && options?.onTiffDialog) {
      const dialogResult = await options.onTiffDialog(analyses);
      if (dialogResult === null) {
        return null; // user cancelled
      }
      // Merge dialog-provided configs
      for (const [fileName, config] of Object.entries(dialogResult)) {
        configs.set(fileName, config);
      }
    }

    // --- Fill in defaults for any file the dialog didn't cover ---
    // This handles: single-frame TIFFs, multi-frame TIFFs when no
    // dialog callback was provided, and any file the dialog skipped.
    for (let i = 0; i < files.length; i++) {
      const fileName = files[i].name;
      if (configs.has(fileName)) continue;

      const analysis = analysisByName.get(fileName);
      const dims = analysis?.OMEDims;

      configs.set(fileName, {
        dimensionOrder: dims?.dimensionorder ?? "xyczt",
        channels: dims?.sizec ?? 1,
        slices: dims?.sizez ?? 1,
        frames: dims?.sizet ?? 1,
      });
    }

    return { configs, buffers };
  }
  /**
   * Analyze files without processing them
   * Used to determine if dialogs are needed (e.g., TIFF frame interpretation)
   *
   * 1. Check file types
   * 2. For TIFFs, parse header to detect frames
   * 3. Return analysis results for UI decisions
   */
  async analyzeTiffs(files: FileList): Promise<{
    analyses: TiffAnalysisResult[];
    buffers: Map<string, ArrayBuffer>;
  }> {
    // Phase 1: Return basic analysis
    const results: TiffAnalysisResult[] = [];
    const buffers = new Map<string, ArrayBuffer>();
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      this.updateProgress({
        overallProgress: overallProgress("analyze", i / files.length),
      });

      try {
        const fileData = await file.arrayBuffer();
        buffers.set(file.name, fileData);

        const tiffResult = await analyzeTiff(fileData);

        results.push({ fileName: file.name, ...tiffResult });
      } catch {
        //if analysis fails, treat as regular image
        this.updateErrors({
          source: file.name,
          error: new Error(
            "Could not parse metadata, treating as regular image",
          ),
          recoverable: true,
        });
      }
    }

    return { analyses: results, buffers };
  }

  async dispatchFiles(
    files: FileList,
    fileAnalyses: FileInterpretationResult["fileResults"],
    tiffConfigs?: Map<string, TiffImportConfig>,
    cachedBuffers?: Map<string, ArrayBuffer>,
  ): Promise<ReaderResult> {
    const taskHandles: Array<{
      fileName: string;
      handle: TaskHandle<LoadAndPrepareOutput>;
    }> = [];

    for (let i = 0; i < files.length; i++) {
      if (this.abortController?.signal.aborted) {
        taskHandles.forEach((th) => th.handle.cancel());
        return { success: false, cancelled: true };
      }

      const file = files[i];
      try {
        const fileData =
          cachedBuffers?.get(file.name) ?? (await file.arrayBuffer());

        const handle = this.scheduler.dispatch({
          type: "loadImage",
          payload: {
            fileData,
            fileName: file.name,
            mimeType: fileAnalyses[file.name].mimeType,
            dimConfig: tiffConfigs?.get(file.name),
          },
          priority: TaskPriority.HIGH,
          onProgress: ({ value, stage }) => {
            this.updateProgress({
              stageProgress: overallProgress(stage, value),
            });
          },
          onComplete: (_result) => {
            this.updateProgress({
              overallProgress: overallProgress("load", i / files.length),
            });
          },
        });

        taskHandles.push({ fileName: file.name, handle });
      } catch (err) {
        this.updateErrors({
          source: file.name,
          error: parseError(err),
          recoverable: true,
        });
      }
    }

    return this.processImages(taskHandles);
  }

  async processImages(
    taskHandles: {
      fileName: string;
      handle: TaskHandle<LoadAndPrepareOutput>;
    }[],
  ): Promise<ReaderResult> {
    // --  Await all worker tasks
    const results: Array<{
      fileName: string;
      output: LoadAndPrepareOutput;
    }> = [];

    for (const { fileName, handle } of taskHandles) {
      if (this.abortController?.signal.aborted) {
        taskHandles.forEach((th) => th.handle.cancel());
        return { success: false, cancelled: true };
      }
      try {
        const output = await handle.promise;
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
      this.scheduler.cancelAll();
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

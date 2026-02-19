import { TaskHandle, WorkerScheduler } from "workers/scheduler";
import { TensorStorageService, STORES } from "../tensorStorage";
import {
  IDataPipelineService,
  PipelineStage,
  PipelineProgress,
  PipelineResult,
  PipelineError,
  FileAnalysisResult,
  UploadOptionswithCallbacks,
  TiffImportConfig,
  ProjectPipelineResult,
} from "./types";
import {
  AnalyzeTiffOutput,
  DeserializeProjectOutput,
  LoadAndPrepareOutput,
  TaskPriority,
} from "workers/scheduler/types";
import { generateUUID } from "store/data/utils";
import { parseError } from "utils/errorUtils";

const INITIAL_PROGRESS: PipelineProgress = {
  stage: "idle",
  stageProgress: 0,
  overallProgress: 0,
  processedCount: 0,
  totalCount: 0,
  errors: [],
  warnings: [],
};

/**
 * DataPipelineService
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
 *
 * Phase 1 Status: SKELETON
 * - Types and structure defined
 * - Methods stubbed with TODO comments
 * - Ready for Phase 2 implementation
 */
export class DataPipelineService implements IDataPipelineService {
  private static instance: DataPipelineService | null = null;

  private scheduler: WorkerScheduler;
  private storage: TensorStorageService;
  private progress: PipelineProgress = { ...INITIAL_PROGRESS };
  private progressListeners: Set<(progress: PipelineProgress) => void> =
    new Set();
  private abortController: AbortController | null = null;

  private constructor(scheduler: WorkerScheduler) {
    this.scheduler = scheduler;
    this.storage = TensorStorageService.getInstance();
  }

  // ============================================================
  // PUBLIC -- START
  // ============================================================
  /**
   * Get singleton instance
   * Requires WorkerScheduler to be passed on first call
   */
  static getInstance(scheduler?: WorkerScheduler): DataPipelineService {
    if (!DataPipelineService.instance) {
      if (!scheduler) {
        throw new Error("WorkerScheduler required for first initialization");
      }
      DataPipelineService.instance = new DataPipelineService(scheduler);
    }
    return DataPipelineService.instance;
  }

  /**
   * Reset instance (for testing)
   */
  static resetInstance(): void {
    DataPipelineService.instance = null;
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
  ): Promise<PipelineResult> {
    const startTime = Date.now();
    this.resetProgress();

    try {
      // -- Stage 1: Analyze
      this.updateProgress({
        stage: "analyzing",
        totalCount: files.length,
        overallProgress: 5,
      });

      const analysisResult = await this.analyzeFiles(files);

      if (this.abortController?.signal.aborted) {
        return this.cancelledResult(files.length);
      }

      // Handle TIFF files needing user input
      const tiffConfigs = new Map<string, TiffImportConfig>();
      for (const result of analysisResult) {
        if (result.tiffInfo?.isMultiFrame && options?.onTiffDialog) {
          const config = await options.onTiffDialog(result);
          if (config === null) {
            // User cancelled this file -- skip it
            continue;
          }
          tiffConfigs.set(result.fileName, config);
        }
      }

      // -- Stage 2: Load + Prepare in workers

      this.updateProgress({
        stage: "loading",
        overallProgress: 10,
      });

      const taskHandles: Array<{
        fileName: string;
        imageId: string;
        handle: TaskHandle<LoadAndPrepareOutput>;
      }> = [];

      const errors: PipelineError[] = [];
      let totalBytes = 0;

      for (let i = 0; i < files.length; i++) {
        if (this.abortController?.signal.aborted) break;

        const file = files[i];
        const imageId = generateUUID();

        try {
          const fileData = await file.arrayBuffer();
          totalBytes += fileData.byteLength;

          const mimeType = file.type || this.inferMimeType(file.name);

          const handle = this.scheduler.dispatch<LoadAndPrepareOutput>({
            type: "loadAndPrepare",
            payload: {
              input: {
                fileData,
                fileName: file.name,
                mimeType,
                imageId,
              },
            },
            priority: TaskPriority.HIGH,
            onProgress: (progress) => {
              if (typeof progress === "number")
                this.updateProgress({
                  stageProgress: progress,
                  currentFile: file.name,
                  processedCount: i,
                });
            },
          });

          taskHandles.push({
            fileName: file.name,
            imageId,
            handle,
          });
        } catch (err) {
          errors.push({
            fileName: file.name,
            error: parseError(err),
            recoverable: true,
          });
        }
      }

      // --  Await all worker tasks
      const results: Array<{
        fileName: string;
        imageId: string;
        output: LoadAndPrepareOutput;
      }> = [];

      for (const { fileName, imageId, handle } of taskHandles) {
        try {
          const output = await handle.promise;
          results.push({ fileName, imageId, output });

          this.updateProgress({
            processedCount: results.length,
            overallProgress:
              10 + Math.floor((results.length / taskHandles.length) * 60),
          });
        } catch (err) {
          if (err instanceof DOMException && err.name === "AbortError") {
            // Cancelled -- don't count as error
            continue;
          }
          errors.push({
            fileName,
            error: parseError(err),
            recoverable: true,
          });
        }
      }

      if (results.length === 0) {
        this.updateProgress({ stage: "error" });
        return {
          success: false,
          metadataIds: [],
          images: [],
          errors,
          warnings: [],
          stats: {
            totalFiles: files.length,
            successCount: 0,
            failedCount: files.length,
            totalBytes,
            preparationTimeMs: Date.now() - startTime,
          },
        };
      }

      // -- Stage 3: Store in IndexedDB
      this.updateProgress({
        stage: "storing",
        overallProgress: 75,
      });

      const storageItems = results.map(({ imageId, output }) => ({
        id: imageId,
        data: {
          buffer: output.buffer,
          dtype: output.dtype,
          shape: output.shape,
          preparedChannels: output.preparedChannels,
          renderedSrc: output.renderedSrc,
        },
        storeName: STORES.IMAGE_TENSORS,
      }));

      const storageResult = await this.storage.storeBatch(storageItems);

      if (!storageResult.success) {
        this.updateProgress({ stage: "error" });
        return {
          success: false,
          metadataIds: [],
          images: [],
          errors: [
            ...errors,
            {
              fileName: "IndexedDB",
              error: storageResult.error,
              recoverable: false,
            },
          ],
          warnings: [],
          stats: {
            totalFiles: files.length,
            successCount: 0,
            failedCount: files.length,
            totalBytes,
            preparationTimeMs: Date.now() - startTime,
          },
        };
      }

      // -- Stage 4: Build Redux-ready payload

      this.updateProgress({
        stage: "storing",
        overallProgress: 90,
      });

      const tensorRefs = storageResult.data;

      // Build per-image result objects (fileName + imageId + tensorRef together)
      const imageResults = results.map((r, idx) => ({
        imageId: r.imageId,
        fileName: r.fileName,
        tensorRef: tensorRefs[idx],
      }));

      // Collect results — to be dispatched by the caller
      // (DataPipelineService does NOT dispatch to Redux directly;
      //  it returns data that the React component dispatches)

      this.updateProgress({
        stage: "complete",
        overallProgress: 100,
        processedCount: results.length,
      });

      return {
        success: true,
        images: imageResults,
        metadataIds: [],
        errors,
        warnings:
          errors.length > 0 ? [`${errors.length} file(s) failed to load`] : [],
        stats: {
          totalFiles: files.length,
          successCount: results.length,
          failedCount: errors.length,
          totalBytes,
          preparationTimeMs: Date.now() - startTime,
        },
      };
    } catch (err) {
      this.updateProgress({ stage: "error" });
      throw err;
    }
  }

  /**
   * Open and deserialize a project file

   * 1. Read file as ArrayBuffer
   * 2. Dispatch to worker for deserialization
   * 3. Check if prepared data exists
   * 4. If not, prepare all images
   * 5. Store tensors in IndexedDB
   * 6. Return full project state for Redux
   */
  async openProject(files: File[]): Promise<ProjectPipelineResult> {
    // Phase 1: Return stub result
    const startTime = Date.now();
    this.resetProgress();

    try {
      // Stage 1: Read file
      this.updateProgress({
        stage: "loading",
        totalCount: 1,
        overallProgress: 5,
        currentFile: files.map((file) => file.name).join(", "),
      });

      if (this.abortController?.signal.aborted) {
        return this.cancelledProjectResult();
      }

      // Stage 2: Dispatch to worker (deserializartion + IndexedDB storage happens there)
      this.updateProgress({
        stage: "deserializing",
        currentFile: "unzipping",
        overallProgress: 10,
      });

      const handler = this.scheduler.dispatch<DeserializeProjectOutput>({
        type: "deserializeProject",
        payload: {
          input: { files, fileName: files[0].name },
        },
        priority: TaskPriority.CRITICAL,
        onProgress: (progress) => {
          if (typeof progress === "number") {
            this.updateProgress({
              stageProgress: progress,
              currentFile: files[0].name,
              processedCount: 1,
            });
          } else {
            this.updateProgress(progress);
          }
        },
      });

      const output = await handler.promise;

      this.updateProgress({
        stage: "complete",
        overallProgress: 100,
      });

      return {
        success: true,
        data: output,
        errors: [],
        warnings: [],
        stats: {
          totalFiles: 1,
          successCount: 1,
          failedCount: 0,
          totalBytes: 0,
          preparationTimeMs: Date.now() - startTime,
        },
      };
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return this.cancelledProjectResult();
      }
      this.updateProgress({ stage: "error" });
      return {
        success: false,
        data: undefined,
        errors: [
          {
            fileName: files[0].name,
            error: parseError(err),
            recoverable: false,
          },
        ],
        warnings: [],
        stats: {
          totalFiles: 1,
          successCount: 0,
          failedCount: 1,
          totalBytes: 0,
          preparationTimeMs: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Load an example project
   *
   * 1. Fetch example data from URL or bundled assets
   * 2. Process same as openProject()
   */
  async loadExample(exampleId: string): Promise<ProjectPipelineResult> {
    const startTime = Date.now();
    this.resetProgress();

    try {
      // Stage 1: Fetch example file
      this.updateProgress({
        stage: "loading",
        totalCount: 1,
        overallProgress: 5,
        currentFile: exampleId,
      });

      const response = await fetch(exampleId);
      if (!response.ok) {
        throw new Error(`Failed to fetch example: ${response.statusText}`);
      }
      const files = await fetch(exampleId)
        .then((res) => res.blob())
        .then((blob) => [new File([blob], exampleId, blob)])
        .catch((err: any) => {
          import.meta.env.PROD &&
            import.meta.env.VITE_APP_LOG_LEVEL === "1" &&
            console.error(err);

          throw parseError(err);
        });
      const fileData = await response.arrayBuffer();

      if (this.abortController?.signal.aborted) {
        return this.cancelledProjectResult();
      }

      // Stage 2: Same as openProject from here
      this.updateProgress({ stage: "deserializing", overallProgress: 10 });

      const handle = this.scheduler.dispatch<DeserializeProjectOutput>({
        type: "deserializeProject",
        payload: {
          input: { files, fileName: exampleId },
        },
        priority: TaskPriority.CRITICAL,
        onProgress: (progress) => {
          if (typeof progress === "number") {
            this.updateProgress({
              stageProgress: progress,
              overallProgress: 10 + Math.floor(progress * 0.85),
            });
          } else {
            this.updateProgress(progress);
          }
        },
      });

      const output = await handle.promise;

      this.updateProgress({ stage: "complete", overallProgress: 100 });

      return {
        success: true,
        data: output,
        errors: [],
        warnings: [],
        stats: {
          totalFiles: 1,
          successCount: 1,
          failedCount: 0,
          totalBytes: fileData.byteLength,
          preparationTimeMs: Date.now() - startTime,
        },
      };
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return this.cancelledProjectResult();
      }
      this.updateProgress({ stage: "error" });
      return {
        success: false,
        data: undefined,
        errors: [
          { fileName: exampleId, error: parseError(err), recoverable: false },
        ],
        warnings: [],
        stats: {
          totalFiles: 1,
          successCount: 0,
          failedCount: 1,
          totalBytes: 0,
          preparationTimeMs: Date.now() - startTime,
        },
      };
    }
  }

  // ============================================================
  // File Analysis
  // ============================================================

  /**
   * Analyze files without processing them
   * Used to determine if dialogs are needed (e.g., TIFF frame interpretation)
   *
   * 1. Check file types
   * 2. For TIFFs, parse header to detect frames
   * 3. Return analysis results for UI decisions
   */
  async analyzeFiles(files: FileList): Promise<FileAnalysisResult[]> {
    // Phase 1: Return basic analysis
    const results: FileAnalysisResult[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const mimeType = file.type || this.inferImageType(file.name);
      const imageType = this.inferImageType(file.name);

      const result: FileAnalysisResult = {
        fileName: file.name,
        fileSize: file.size,
        mimeType,
        imageType,
      };

      // For TIFF files, analyze in worker to detect multi-frame
      if (imageType === "tiff") {
        try {
          const fileData = await file.arrayBuffer();
          const handle = this.scheduler.dispatch<AnalyzeTiffOutput>({
            type: "analyzeTiff",
            payload: { input: { fileData } },
            priority: TaskPriority.HIGH,
          });

          const tiffResult = await handle.promise;
          result.tiffInfo = {
            ...tiffResult,
          };
        } catch {
          //if analysis fails, treat as regular image
        }
      }
      results.push(result);
    }

    return results;
  }

  // ============================================================
  // Progress Management
  // ============================================================

  /**
   * Subscribe to progress updates
   * Returns unsubscribe function
   */
  onProgress(callback: (progress: PipelineProgress) => void): () => void {
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
  getProgress(): PipelineProgress {
    return { ...this.progress };
  }

  /**
   * Get current stage
   */
  getStatus(): PipelineStage {
    return this.progress.stage;
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

  private updateProgress(updates: Partial<PipelineProgress>): void {
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

  private cancelledResult(totalFiles: number): PipelineResult {
    return {
      success: false,
      metadataIds: [],
      images: [],
      errors: [],
      warnings: ["Upload cancelled by user"],
      stats: {
        totalFiles,
        successCount: 0,
        failedCount: 0,
        totalBytes: 0,
        preparationTimeMs: 0,
      },
    };
  }
  private cancelledProjectResult(): ProjectPipelineResult {
    return {
      success: false,
      data: undefined,
      errors: [],
      warnings: ["Upload cancelled by user"],
      stats: {
        totalFiles: 1,
        successCount: 0,
        failedCount: 0,
        totalBytes: 0,
        preparationTimeMs: 0,
      },
    };
  }

  private inferMimeType(filename: string): string {
    const ext = filename.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "png":
        return "image/png";
      case "jpg":
      case "jpeg":
        return "image/jpeg";
      case "tif":
      case "tiff":
        return "image/tiff";
      case "dcm":
        return "application/dicom";
      case "bmp":
        return "image/bmp";
      default:
        return "application/octet-stream";
    }
  }

  private inferImageType(fileName: string): "standard" | "tiff" | "dicom" {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (ext === "tif" || ext === "tiff") return "tiff";
    if (ext === "dcm") return "dicom";
    return "standard";
  }
  // ============================================================
  // PRIVATE -- END
  // ============================================================
}

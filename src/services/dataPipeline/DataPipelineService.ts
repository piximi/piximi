import { WorkerScheduler } from "workers/scheduler";
import { TensorStorageService, STORES } from "../tensorStorage";
import {
  IDataPipelineService,
  PipelineStage,
  PipelineProgress,
  PipelineResult,
  PipelineError,
  UploadOptions,
  FileAnalysisResult,
} from "./types";

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
  // Main Entry Points (Phase 2)
  // ============================================================

  /**
   * Upload and process files
   *
   * TODO (Phase 2):
   * 1. Analyze files to detect types
   * 2. Handle time series grouping
   * 3. Dispatch to workers for loading + preparation
   * 4. Store tensors in IndexedDB
   * 5. Return data ready for Redux dispatch
   */

  async uploadFiles(
    files: FileList,
    options?: UploadOptions,
  ): Promise<PipelineResult> {
    // Phase 1: Return stub result
    console.warn("DataPipelineService.uploadFiles() not yet implemented");

    return {
      success: false,
      metadataIds: [],
      imageIds: [],
      tensorRefs: [],
      errors: [
        {
          fileName: "N/A",
          error: new Error("Not implemented in Phase 1"),
          recoverable: false,
        },
      ],
      warnings: ["Using stub implementation"],
      stats: {
        totalFiles: files.length,
        successCount: 0,
        failedCount: files.length,
        totalBytes: 0,
        preparationTimeMs: 0,
      },
    };
  }

  /**
   * Open and deserialize a project file
   *
   * TODO (Phase 3):
   * 1. Read file as ArrayBuffer
   * 2. Dispatch to worker for deserialization
   * 3. Check if prepared data exists
   * 4. If not, prepare all images
   * 5. Store tensors in IndexedDB
   * 6. Return full project state for Redux
   */
  async openProject(file: File): Promise<PipelineResult> {
    // Phase 1: Return stub result
    console.warn("DataPipelineService.openProject() not yet implemented");

    return {
      success: false,
      metadataIds: [],
      imageIds: [],
      tensorRefs: [],
      errors: [
        {
          fileName: file.name,
          error: new Error("Not implemented in Phase 1"),
          recoverable: false,
        },
      ],
      warnings: ["Using stub implementation"],
      stats: {
        totalFiles: 1,
        successCount: 0,
        failedCount: 1,
        totalBytes: 0,
        preparationTimeMs: 0,
      },
    };
  }

  /**
   * Load an example project
   *
   * TODO (Phase 3):
   * 1. Fetch example data from URL or bundled assets
   * 2. Process same as openProject()
   */
  async loadExample(exampleId: string): Promise<PipelineResult> {
    // Phase 1: Return stub result
    console.warn("DataPipelineService.loadExample() not yet implemented");

    return {
      success: false,
      metadataIds: [],
      imageIds: [],
      tensorRefs: [],
      errors: [
        {
          fileName: exampleId,
          error: new Error("Not implemented in Phase 1"),
          recoverable: false,
        },
      ],
      warnings: ["Using stub implementation"],
      stats: {
        totalFiles: 1,
        successCount: 0,
        failedCount: 1,
        totalBytes: 0,
        preparationTimeMs: 0,
      },
    };
  }

  // ============================================================
  // File Analysis (Phase 2)
  // ============================================================

  /**
   * Analyze files without processing them
   * Used to determine if dialogs are needed (e.g., TIFF frame interpretation)
   *
   * TODO (Phase 2):
   * 1. Check file types
   * 2. For TIFFs, parse header to detect frames
   * 3. Return analysis results for UI decisions
   */
  async analyzeFiles(files: FileList): Promise<FileAnalysisResult[]> {
    // Phase 1: Return basic analysis
    const results: FileAnalysisResult[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      results.push({
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || this.inferMimeType(file.name),
        imageType: this.inferImageType(file.name),
      });
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
  // Internal Helpers
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
}

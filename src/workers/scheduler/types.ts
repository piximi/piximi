// src/workers/scheduler/types.ts

import {
  AnnotationObject,
  Category,
  ChannelData,
  ChannelMeasurements,
  ComputedImageMeasurements,
  ImageMetadata,
  ImageObject,
  Kind,
  ObjectMeasurements,
} from "store/data/types";
import { TensorReference } from "services/tensorStorage";
import { ColorsRaw } from "utils/types";
import { ClassifierState, ProjectState, SegmenterState } from "store/types";
import { ExtractedModelFileMap } from "utils/models/types";
import {
  PreparedAnnotationData,
  PreparedEntityChannels,
  PreparedEntityData,
} from "views/MeasurementView/types";
import {
  PipelineProgress,
  ProjectDeserializationProgress,
} from "services/dataPipeline/types";

export enum TaskPriority {
  CRITICAL = 0,
  HIGH = 1,
  NORMAL = 2,
  LOW = 3,
}

export enum TaskStatus {
  PENDING = "pending",
  RUNNING = "running",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  FAILED = "failed",
}

export interface Task<TResult = unknown> {
  id: string;
  type: string;
  payload: unknown;
  priority: TaskPriority;
  onProgress?: (progress: number | Partial<PipelineProgress>) => void;
  onComplete?: (result: TResult) => void;
  onError?: (error: TaskError) => void;
}

export interface TaskHandle<TResult = unknown> {
  id: string;
  status: TaskStatus;
  cancel: () => void;
  promise: Promise<TResult>;
}

export type TaskErrorCode =
  | "CANCELLED"
  | "WORKER_ERROR"
  | "TIMEOUT"
  | "UNKNOWN";

export interface TaskError {
  taskId: string;
  type: string;
  code: TaskErrorCode;
  message: string;
  originalError?: unknown;
  timestamp: number;
}

export interface AggregateProgress {
  pending: number;
  running: number;
  completed: number;
  failed: number;
  overallPercent: number;
}

export interface CancelToken {
  cancelled: boolean;
}

export type ProgressListener = (progress: AggregateProgress) => void;

export interface SchedulerOptions {
  poolSize?: number;
  maxErrorLogSize?: number;
}

export type TaskDefinition<TResult = unknown> = Omit<Task<TResult>, "id">;

// ============================================================
// Types for Image Loading
// ============================================================

/**
 * Input for loading a single image file
 */
export type LoadImageInput = {
  fileData: ArrayBuffer;
  fileName: string;
  mimeType: string;
};

/**
 * Output from loading a single image
 */
export type LoadImageOutput = {
  id: string;
  buffer: ArrayBuffer;
  dtype: "float32" | "int32" | "uint8";
  shape: [number, number, number, number];
  bitDepth: number;
  colors: ColorsRaw;
  renderedSrc: string;
};

/**
 * Input for combined load + prepare operation
 */
export type LoadAndPrepareInput = {
  fileData: ArrayBuffer;
  fileName: string;
  mimeType: string;
  imageId: string; // Pre-generated ID
};

/**
 * Output from load + prepare (ready for storage)
 */
export type LoadAndPrepareOutput = {
  id: string;

  // For IndexedDB storage
  buffer: ArrayBuffer;
  dtype: "float32" | "int32" | "uint8";
  shape: [number, number, number, number];
  preparedChannels: {
    data: number[][];
    histograms?: number[][];
  };
  renderedSrc: string;

  // For Redux metadata
  bitDepth: number;
  colors: ColorsRaw;
};

/**
 * Input for TIFF analysis
 */
export type AnalyzeTiffInput = {
  fileData: ArrayBuffer;
};

/**
 * Output from Tiff analysis
 */
export type AnalyzeTiffOutput = {
  frameCount: number;
  isMultiFrame: boolean;
  suggestedType: "timeSeries" | "zStack" | "channels" | "unknown";
  confidence: number;
  metadata: {
    imageDescription?: string;
    dateTime?: string[];
    frameInterval?: number;
    zSpacing?: number;
  };
};

// ============================================================
// Types for Project Deserialization
// ============================================================

/**
 * Input for deserializing a project file in the worker
 */
export type DeserializeProjectInput = {
  // Raw ZIP file contents
  files: File[];
  // Original file name (used to derive project name)
  fileName: string;
};

/**
 * Serializable image data returned from worker
 * (no Tensor4D -- tensor buffer stored inm IndexedDB from worker)
 */
export type DeserializedImageResult = Omit<ImageObject, "src" | "data"> & {
  tensorRef: TensorReference;
};

/**
 * Serializable annotation data returned from worker
 */
export type DeserializedAnnotationResult = Omit<
  AnnotationObject,
  "src" | "data"
> & {
  tensorRef: TensorReference;
};

/**
 * Full output from the deserialization worker task
 * Everything is plain JSON / transferable -- no class instance or tensors
 */
export type DeserializeProjectOutput = {
  project: ProjectState;
  classifier: ClassifierState;
  segmenter: SegmenterState;
  images: DeserializedImageResult[];
  annotations: DeserializedAnnotationResult[];
  categories: Record<string, Category>;
  kinds: Record<string, Kind>;
  metadata: ImageMetadata[];
  modelFiles: ExtractedModelFileMap;
};

/**
 * Extended WorkerAPI with new methods
 */

export interface WorkerAPI {
  annotationMeasurements: (
    annotations: Record<string, PreparedAnnotationData>,
    selectedMeasurements: (keyof ObjectMeasurements)[],
    cancelToken: CancelToken,
    onProgress: (progress: number) => void,
  ) => Promise<{ annId: string; measurements: ObjectMeasurements }[]>;
  imageMeasurements: (
    images: ImageObject[],
    selectedMeasurements: (keyof ComputedImageMeasurements)[],
    cancelToken: CancelToken,
    onProgress: (progress: number) => void,
  ) => Promise<{ annId: string; measurements: ObjectMeasurements }[]>;

  channelMeasurements: (
    entities: {
      id: string;
      measurements: { channels: ChannelData[] };
      tensorRef: TensorReference;
    }[],
    measurements: Partial<Record<keyof ChannelMeasurements, number[]>>,
    cancelToken: CancelToken,
    onProgress: (progress: number) => void,
  ) => Promise<Record<string, Record<number, ChannelData>>>;

  prepare: (
    kind: string,
    entities: PreparedEntityData[],
    cancelToken: CancelToken,
    onProgress: (value: number) => void,
  ) => Promise<{ kind: string; data: PreparedEntityChannels }>;
  loadImage: (
    input: LoadImageInput,
    cancelToken: CancelToken,
    onProgress: (value: number) => void,
  ) => Promise<LoadImageOutput>;

  loadAndPrepare: (
    input: LoadAndPrepareInput,
    cancelToken: CancelToken,
    onProgress: (value: number) => void,
  ) => Promise<LoadAndPrepareOutput>;

  analyzeTiff: (
    input: AnalyzeTiffInput,
    cancelToken: CancelToken,
  ) => Promise<AnalyzeTiffOutput>;

  deserializeProject: (
    input: DeserializeProjectInput,
    cancelToken: CancelToken,
    onProgress: (value: number | Partial<PipelineProgress>) => void,
  ) => Promise<DeserializeProjectOutput>;
}

/**
 * Worker Scheduler Interface
 */

export interface IWorkerScheduler {
  /**
   * Dispatches a task for execution by a worker.
   *
   * This is the main entry point for scheduling work. The task is added to
   * a priority queue and will be executed when a worker becomes available.
   *
   * The returned TaskHandle allows the caller to:
   * - Check task status (pending/running/completed/cancelled/failed)
   * - Cancel the task at any time
   * - Await the result via the promise
   *
   * @param taskDef - Task definition (type, payload, priority, callbacks)
   * @returns TaskHandle for tracking and controlling the task
   *
   * @example
   * const handle = scheduler.dispatch({
   *   type: 'annotationMeasurements',
   *   payload: { annotations, selectedMeasurements },
   *   priority: TaskPriority.HIGH,
   *   onProgress: (percent) => setProgress(percent),
   *   onComplete: (result) => dispatch(updateMeasurements(result)),
   *   onError: (error) => console.error(error),
   * });
   *
   * -- Later, if needed --
   * handle.cancel();
   *
   * -- Or await the result --
   * const result = await handle.promise;
   */
  dispatch<TResult>(taskDef: TaskDefinition<TResult>): TaskHandle<TResult>;

  /**
   * Cancels a task by its ID.
   *
   * Cancellation behavior depends on task state:
   * - PENDING: Immediately removed from queue, promise rejected
   * - RUNNING: AbortController signaled, worker should check and stop
   * - COMPLETED/FAILED/CANCELLED: No effect (already terminal)
   *
   * Note: For running tasks, cancellation is cooperative - the worker must
   * check the CancelToken periodically and stop when cancelled. Long-running
   * operations that don't check will continue until completion.
   *
   * @param taskId - ID of the task to cancel
   */
  cancel(taskId: string): void;

  /**
   * Cancels all active tasks (pending and running).
   *
   * Useful for cleanup when navigating away from a view or shutting down.
   * Each task's onError callback will be called with a cancellation error.
   */
  cancelAll(): void;

  /**
   * Gets the current aggregate progress across all tasks.
   *
   * Returns counts of tasks in each state plus an overall percentage.
   * This is a snapshot - for live updates, use onProgress().
   *
   * @returns AggregateProgress object with counts and percentage
   *
   * @example
   * const progress = scheduler.getProgress();
   * console.log(`${progress.pending} pending, ${progress.running} running`);
   * console.log(`Overall: ${progress.overallPercent}% complete`);
   */
  getProgress(): AggregateProgress;

  /**
   * Subscribes to aggregate progress updates.
   *
   * The listener is called whenever progress changes:
   * - Task added to queue
   * - Task starts running
   * - Task completes or fails
   * - Running task reports progress
   *
   * @param listener - Callback function receiving AggregateProgress
   * @returns Unsubscribe function - call to stop receiving updates
   *
   * @example
   * const unsubscribe = scheduler.onProgress((progress) => {
   *   setGlobalProgress(progress.overallPercent);
   * });
   *
   * -- Later, when done --
   * unsubscribe();
   */
  onProgress(listener: ProgressListener): () => void;

  /**
   * Gets the error log containing recent task errors.
   *
   * The log is bounded (default 100 entries) to prevent memory growth.
   * Useful for debugging or displaying error history to users.
   *
   * @returns Readonly array of TaskError objects
   */
  getErrorLog(): readonly TaskError[];

  /**
   * Gets the current status of a specific task.
   *
   * Note: After a task reaches a terminal state (COMPLETED/FAILED/CANCELLED)
   * and is cleaned up, this will return undefined. Use TaskHandle.status
   * instead, which caches the terminal status.
   *
   * @param taskId - ID of the task to check
   * @returns TaskStatus or undefined if task not found/cleaned up
   */
  getTaskStatus(taskId: string): TaskStatus | undefined;

  /**
   * Shuts down the scheduler, cancelling all tasks and terminating workers.
   *
   * After shutdown:
   * - No new tasks can be dispatched (will return failed handles)
   * - All pending/running tasks are cancelled
   * - All workers are terminated
   * - The scheduler cannot be restarted
   *
   * Call this when the scheduler is no longer needed (e.g., app unmount).
   */
  shutdown(): Promise<void>;
}

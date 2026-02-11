// src/workers/scheduler/types.ts

import { ColorsRaw } from "utils/types";
import { WorkerAPI } from "./worker";

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
  onProgress?: (progress: number) => void;
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

/**
 * Extended WorkerAPI with new methods
 */

export type ExtendedWorkerAPI = WorkerAPI & {
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
};

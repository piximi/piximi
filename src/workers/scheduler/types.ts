// src/workers/scheduler/types.ts

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

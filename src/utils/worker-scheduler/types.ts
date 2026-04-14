// src/workers/scheduler/types.ts

import { TaskMap } from "./taskMap";

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

export interface Task<K extends keyof TaskMap> {
  id: string;
  type: K;
  payload: TaskMap[K]["payload"];
  priority: TaskPriority;
  onProgress?: TaskMap[K]["onProgress"];
  onComplete?: TaskMap[K]["onComplete"];
  onError?: (error: TaskError) => void;
}

export interface TaskHandle<TResult = unknown> {
  id: string;
  status: TaskStatus;
  cancel: () => void;
  promise: Promise<TResult>;
}
export type TaskHandler<K extends keyof TaskMap> = (
  payload: TaskMap[K]["payload"],
  cancelToken: CancelToken,
  onProgress: TaskMap[K]["onProgress"],
) => Promise<TaskMap[K]["result"]>;

export type TaskRegistry = { [K in keyof TaskMap]: TaskHandler<K> };
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

/**
 * WorkerAPI
 */

export interface IScheduledWorkerAPI {
  execute<T extends keyof TaskMap>(
    type: T,
    payload: TaskMap[T]["payload"],
    cancelToken: CancelToken,
    onProgress: TaskMap[T]["onProgress"],
  ): Promise<TaskMap[T]["result"]>;
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
  dispatch<K extends keyof TaskMap>(taskDef: {
    type: K;
    payload: TaskMap[K]["payload"];
    priority: TaskPriority;
    onProgress?: TaskMap[K]["onProgress"];
    onComplete?: TaskMap[K]["onComplete"];
    onError?: (error: TaskError) => void;
  }): TaskHandle<TaskMap[K]["result"]>;

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

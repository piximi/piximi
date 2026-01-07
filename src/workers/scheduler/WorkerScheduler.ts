// src/workers/scheduler/WorkerScheduler.ts
import * as Comlink from "comlink";

import { PriorityQueue } from "./PriorityQueue";
import { createTaskError, ErrorLogger } from "./errors";
import {
  AggregateProgress,
  CancelToken,
  ProgressListener,
  SchedulerOptions,
  Task,
  TaskDefinition,
  TaskError,
  TaskHandle,
  TaskStatus,
} from "./types";
import { WorkerAPI } from "./worker";

type TaskWithInternals<TResult = unknown> = Task<TResult> & {
  resolve: (value: TResult) => void;
  reject: (error: Error) => void;
};

export class WorkerScheduler {
  private workerPool: Worker[] = [];
  private availableWorkers: Set<number> = new Set();
  private workerProxies: Map<number, Comlink.Remote<WorkerAPI>> = new Map();
  private taskQueue: PriorityQueue<TaskWithInternals>;
  private activeTasks: Map<string, TaskWithInternals> = new Map();
  private abortControllers: Map<string, AbortController> = new Map();
  private taskProgress: Map<string, number> = new Map();
  private taskStatuses: Map<string, TaskStatus> = new Map();
  private progressListeners: Set<ProgressListener> = new Set();
  private errorLogger: ErrorLogger;

  private poolSize: number;
  private initialized = false;
  private isShutdown = false;
  private initPromise: Promise<void> | null = null;

  // Track counts for progress reporting
  private completedCount = 0;
  private failedCount = 0;

  constructor(options?: SchedulerOptions) {
    this.poolSize = options?.poolSize ?? this.getDefaultPoolSize();
    this.errorLogger = new ErrorLogger(options?.maxErrorLogSize);
    this.taskQueue = new PriorityQueue<TaskWithInternals>((a, b) => {
      // Lower priority number = higher priority
      return a.priority - b.priority;
    });
  }

  private getDefaultPoolSize(): number {
    if (typeof navigator !== "undefined" && navigator.hardwareConcurrency) {
      return Math.max(1, navigator.hardwareConcurrency - 1);
    }
    return 2; // Default fallback
  }

  dispatch<TResult>(taskDef: TaskDefinition<TResult>): TaskHandle<TResult> {
    const taskId = this.generateTaskId();

    // If shutdown, return a rejected handle
    if (this.isShutdown) {
      const error = new Error("Scheduler has been shut down");
      const handle: TaskHandle<TResult> = {
        id: taskId,
        get status() {
          return TaskStatus.FAILED;
        },
        cancel: () => {},
        promise: Promise.reject(error),
      };
      // Handle the unhandled rejection
      handle.promise.catch(() => {});
      return handle;
    }

    let resolveTask: (value: TResult) => void;
    let rejectTask: (error: Error) => void;

    const promise = new Promise<TResult>((resolve, reject) => {
      resolveTask = resolve;
      rejectTask = reject;
    });

    const task: TaskWithInternals<TResult> = {
      ...taskDef,
      id: taskId,
      resolve: resolveTask!,
      reject: rejectTask!,
    };

    // Set up abort controller for cancellation
    const abortController = new AbortController();
    this.abortControllers.set(taskId, abortController);

    // Initialize task status
    this.taskStatuses.set(taskId, TaskStatus.PENDING);
    this.taskProgress.set(taskId, 0);

    // Add to queue
    this.taskQueue.enqueue(task as TaskWithInternals);
    this.activeTasks.set(taskId, task as TaskWithInternals);

    // Notify listeners of the new pending task
    this.notifyProgressListeners();

    // Initialize pool if needed and process queue
    this.ensurePoolInitialized().then(() => {
      this.processQueue();
    });

    const getStatus = () => this.getTaskStatus(taskId) ?? TaskStatus.PENDING;
    const handle: TaskHandle<TResult> = {
      id: taskId,
      get status() {
        return getStatus();
      },
      cancel: () => this.cancel(taskId),
      promise,
    };

    return handle;
  }

  cancel(taskId: string): void {
    const abortController = this.abortControllers.get(taskId);
    if (abortController) {
      abortController.abort();
    }

    const task = this.activeTasks.get(taskId);
    if (!task) return;

    const currentStatus = this.taskStatuses.get(taskId);

    // Only cancel if not already completed or failed
    if (
      currentStatus === TaskStatus.PENDING ||
      currentStatus === TaskStatus.RUNNING
    ) {
      this.updateTaskStatus(taskId, TaskStatus.CANCELLED);

      // Remove from queue if pending
      this.taskQueue.remove((t) => t.id === taskId);

      // Create and log error
      const error = createTaskError(
        taskId,
        task.type,
        new DOMException("Task cancelled", "AbortError"),
      );

      // Call error callback
      if (task.onError) {
        task.onError(error);
      }

      // Reject the promise
      task.reject(new DOMException("Task cancelled", "AbortError"));

      // Log error
      this.errorLogger.log(error);

      // Update counts
      this.failedCount++;

      // Clean up
      this.activeTasks.delete(taskId);
      this.abortControllers.delete(taskId);
      this.taskProgress.delete(taskId);

      this.notifyProgressListeners();
    }
  }

  cancelAll(): void {
    // Get all active task IDs
    const taskIds = Array.from(this.activeTasks.keys());

    for (const taskId of taskIds) {
      this.cancel(taskId);
    }
  }

  getProgress(): AggregateProgress {
    let pending = 0;
    let running = 0;

    for (const [, status] of this.taskStatuses) {
      if (status === TaskStatus.PENDING) pending++;
      else if (status === TaskStatus.RUNNING) running++;
    }

    const total = pending + running + this.completedCount + this.failedCount;
    const overallPercent =
      total > 0 ? Math.round((this.completedCount / total) * 100) : 0;

    return {
      pending,
      running,
      completed: this.completedCount,
      failed: this.failedCount,
      overallPercent,
    };
  }

  onProgress(listener: ProgressListener): () => void {
    this.progressListeners.add(listener);

    return () => {
      this.progressListeners.delete(listener);
    };
  }

  getErrorLog(): readonly TaskError[] {
    return this.errorLogger.getErrors();
  }

  getTaskStatus(taskId: string): TaskStatus | undefined {
    return this.taskStatuses.get(taskId);
  }

  async shutdown(): Promise<void> {
    this.isShutdown = true;

    // Cancel all pending tasks
    this.cancelAll();

    // Terminate all workers
    for (const worker of this.workerPool) {
      worker.terminate();
    }

    // Clear state
    this.workerPool = [];
    this.availableWorkers.clear();
    this.workerProxies.clear();
    this.initialized = false;
  }

  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private async ensurePoolInitialized(): Promise<void> {
    if (this.initialized || this.isShutdown) return;

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.initPool();
    await this.initPromise;
  }

  private async initPool(): Promise<void> {
    if (this.initialized) return;

    for (let i = 0; i < this.poolSize; i++) {
      const worker = new Worker(new URL("./worker.ts", import.meta.url), {
        type: "module",
      });
      this.workerPool.push(worker);
      this.availableWorkers.add(i);

      const proxy = Comlink.wrap<WorkerAPI>(worker);
      this.workerProxies.set(i, proxy);
    }

    this.initialized = true;
  }

  private processQueue(): void {
    if (this.isShutdown) return;

    // Process tasks while we have available workers and tasks in queue
    while (this.availableWorkers.size > 0 && !this.taskQueue.isEmpty()) {
      const task = this.taskQueue.dequeue();
      if (!task) break;

      // Skip if task was already cancelled
      if (this.taskStatuses.get(task.id) === TaskStatus.CANCELLED) {
        continue;
      }

      // Get an available worker
      const workerIndex = this.availableWorkers.values().next().value;
      if (workerIndex === undefined) break;

      this.availableWorkers.delete(workerIndex);

      // Run the task
      this.runTask(task, workerIndex);
    }
  }

  private async runTask(
    task: TaskWithInternals,
    workerIndex: number,
  ): Promise<void> {
    this.updateTaskStatus(task.id, TaskStatus.RUNNING);

    const proxy = this.workerProxies.get(workerIndex);
    if (!proxy) {
      this.handleTaskError(task, new Error("Worker proxy not found"));
      this.releaseWorker(workerIndex);
      return;
    }

    const abortController = this.abortControllers.get(task.id);
    const cancelToken: CancelToken = {
      get cancelled() {
        return abortController?.signal.aborted ?? false;
      },
    };

    // Create progress callback that updates tracking
    const onProgress = (progress: number) => {
      if (this.taskStatuses.get(task.id) === TaskStatus.RUNNING) {
        this.taskProgress.set(task.id, progress);
        if (task.onProgress) {
          task.onProgress(progress);
        }
        this.notifyProgressListeners();
      }
    };

    try {
      // Check if cancelled before starting
      if (cancelToken.cancelled) {
        throw new DOMException("Task cancelled", "AbortError");
      }

      let result: unknown;

      // Route to appropriate worker method based on task type
      switch (task.type) {
        case "annotationMeasurements":
          result = await proxy.annotationMeasurements(
            task.payload as Parameters<WorkerAPI["annotationMeasurements"]>[0],
            (
              task.payload as {
                selectedMeasurements?: Parameters<
                  WorkerAPI["annotationMeasurements"]
                >[1];
              }
            ).selectedMeasurements ?? [],
            cancelToken,
            Comlink.proxy(onProgress),
          );
          break;

        case "channelMeasurements":
          result = await proxy.channelMeasurements(
            (task.payload as { id: string }).id,
            (
              task.payload as Parameters<
                WorkerAPI["channelMeasurements"]
              >[1] extends infer T
                ? { existingMeasurements: T }
                : never
            ).existingMeasurements ?? [],
            (
              task.payload as {
                channels: Parameters<WorkerAPI["channelMeasurements"]>[2];
              }
            ).channels,
            cancelToken,
          );
          break;

        case "prepare":
          result = await proxy.prepare(
            (task.payload as { kind: string }).kind,
            (task.payload as { entities: Parameters<WorkerAPI["prepare"]>[1] })
              .entities,
            cancelToken,
            Comlink.proxy(onProgress),
          );
          break;

        default:
          // For unknown task types, just resolve with the payload
          // This allows for testing without actual worker methods
          result = task.payload;
      }

      // Check if cancelled during execution
      if (cancelToken.cancelled) {
        throw new DOMException("Task cancelled", "AbortError");
      }

      // Task completed successfully
      this.updateTaskStatus(task.id, TaskStatus.COMPLETED);
      this.taskProgress.set(task.id, 100);
      this.completedCount++;

      if (task.onComplete) {
        task.onComplete(result);
      }

      task.resolve(result);

      // Clean up
      this.activeTasks.delete(task.id);
      this.abortControllers.delete(task.id);
      this.taskProgress.delete(task.id);
    } catch (error) {
      this.handleTaskError(task, error);
    } finally {
      this.releaseWorker(workerIndex);
      this.notifyProgressListeners();
    }
  }

  private handleTaskError(task: TaskWithInternals, error: unknown): void {
    const taskError = createTaskError(task.id, task.type, error);

    this.updateTaskStatus(task.id, TaskStatus.FAILED);
    this.failedCount++;

    if (task.onError) {
      task.onError(taskError);
    }

    this.errorLogger.log(taskError);

    if (error instanceof Error) {
      task.reject(error);
    } else {
      task.reject(new Error(String(error)));
    }

    // Clean up
    this.activeTasks.delete(task.id);
    this.abortControllers.delete(task.id);
    this.taskProgress.delete(task.id);
  }

  private releaseWorker(workerIndex: number): void {
    if (!this.isShutdown && this.workerPool[workerIndex]) {
      this.availableWorkers.add(workerIndex);
      // Process any remaining tasks in the queue
      this.processQueue();
    }
  }

  private updateTaskStatus(taskId: string, status: TaskStatus): void {
    this.taskStatuses.set(taskId, status);
  }

  private notifyProgressListeners(): void {
    const progress = this.getProgress();
    for (const listener of this.progressListeners) {
      try {
        listener(progress);
      } catch {
        // Ignore listener errors
      }
    }
  }
}

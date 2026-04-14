// src/workers/scheduler/WorkerScheduler.ts
//
// =============================================================================
// WORKER SCHEDULER
// =============================================================================
//
// This module implements a priority-based task scheduler that manages a pool
// of Web Workers. It provides:
//
// 1. TASK QUEUING: Tasks are queued with priorities (CRITICAL > HIGH > NORMAL > LOW)
// 2. WORKER POOL: A fixed pool of workers that execute tasks concurrently
// 3. CANCELLATION: Tasks can be cancelled at any point (pending or running)
// 4. PROGRESS TRACKING: Both per-task and aggregate progress reporting
// 5. ERROR HANDLING: Centralized error logging and error callbacks
//
// Architecture Overview:
// ┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
// │  dispatch() │ --> │ PriorityQueue│ --> │  Worker Pool    │
// │  (caller)   │     │  (pending)   │     │  (execution)    │
// └─────────────┘     └──────────────┘     └─────────────────┘
//                            │                      │
//                            v                      v
//                     ┌──────────────┐     ┌─────────────────┐
//                     │ TaskHandle   │     │ onComplete/     │
//                     │ (returned)   │     │ onError/        │
//                     │              │     │ onProgress      │
//                     └──────────────┘     └─────────────────┘
//
// =============================================================================

import * as Comlink from "comlink";

import {
  type AggregateProgress,
  type CancelToken,
  type IWorkerScheduler,
  type ProgressListener,
  type SchedulerOptions,
  type Task,
  type TaskError,
  type TaskHandle,
  TaskStatus,
  type IWorkerAPI,
  type TaskPriority,
} from "./types";
import { PriorityQueue } from "./PriorityQueue";
import { TaskMap } from "./taskMap";
import { createTaskError, ErrorLogger } from "./errors";

// =============================================================================
// INTERNAL TYPES
// =============================================================================

/**
 * Internal representation of a task that includes promise resolution functions.
 *
 * When a task is dispatched, we create a Promise that the caller can await.
 * To resolve/reject that promise from within the scheduler, we need to capture
 * the resolve/reject functions. This type extends Task with those internals.
 *
 * This pattern is called the "deferred promise" pattern - we're deferring
 * the resolution of the promise to a later point in time.
 */
type TaskWithInternals<K extends keyof TaskMap> = Task<K> & {
  /** Function to resolve the task's promise with a successful result */
  resolve: (value: TaskMap[K]["result"]) => void;
  /** Function to reject the task's promise with an error */
  reject: (error: Error) => void;
};

// =============================================================================
// WORKER SCHEDULER CLASS
// =============================================================================

export class WorkerScheduler implements IWorkerScheduler {
  // ---------------------------------------------------------------------------
  // WORKER POOL STATE
  // ---------------------------------------------------------------------------

  /**
   * Array of Web Worker instances.
   * Workers are created lazily on first dispatch and reused for subsequent tasks.
   * Index in this array corresponds to the worker's ID used elsewhere.
   */
  private workerPool: Worker[] = [];

  /**
   * Set of worker indices that are currently idle and available to take tasks.
   * When a task is assigned to a worker, its index is removed from this set.
   * When a task completes, the worker index is added back.
   *
   * Using a Set allows O(1) add/remove/check operations.
   */
  private availableWorkers: Set<number> = new Set();

  /**
   * Map from worker index to Comlink proxy.
   * Comlink wraps Web Workers to provide a promise-based RPC interface,
   * allowing us to call worker methods as if they were local async functions.
   *
   * Example: Instead of postMessage/onmessage, we can do:
   *   const result = await proxy.annotationMeasurements(data);
   */
  private workerProxies: Map<number, Comlink.Remote<IWorkerAPI>> = new Map();

  // ---------------------------------------------------------------------------
  // TASK MANAGEMENT STATE
  // ---------------------------------------------------------------------------

  /**
   * Priority queue holding tasks waiting to be executed.
   * Tasks are dequeued in priority order (lower priority number = higher priority).
   * CRITICAL (0) > HIGH (1) > NORMAL (2) > LOW (3)
   */
  private taskQueue: PriorityQueue<TaskWithInternals<keyof TaskMap>>;

  /**
   * Map of all active tasks (pending + running) by their ID.
   * Used to look up task details for cancellation, status checks, etc.
   * Tasks are removed from this map when they complete, fail, or are cancelled.
   */
  private activeTasks: Map<string, TaskWithInternals<keyof TaskMap>> =
    new Map();

  /**
   * Map of AbortController instances for each task.
   * AbortController is the standard Web API for cancellation.
   * When cancel() is called, we call abortController.abort() which:
   * 1. Sets the signal.aborted flag to true
   * 2. Can be checked by workers via CancelToken
   */
  private abortControllers: Map<string, AbortController> = new Map();

  /**
   * Map tracking the current progress (0-100) of each task.
   * Updated when workers report progress via the onProgress callback.
   * Used for aggregate progress calculation.
   */
  private taskProgress: Map<string, number> = new Map();

  /**
   * Map tracking the current status of each task.
   * Possible statuses: PENDING -> RUNNING -> COMPLETED/CANCELLED/FAILED
   *
   * Note: Tasks are removed from this map after reaching a terminal state
   * and being cleaned up. The TaskHandle caches the terminal status
   * so callers can still check status after cleanup.
   */
  private taskStatuses: Map<string, TaskStatus> = new Map();

  // ---------------------------------------------------------------------------
  // PROGRESS & ERROR TRACKING
  // ---------------------------------------------------------------------------

  /**
   * Set of callback functions to notify when aggregate progress changes.
   * Listeners are called whenever:
   * - A new task is added (pending count increases)
   * - A task starts running (running count increases, pending decreases)
   * - A task completes/fails (completed/failed count increases)
   * - A task reports progress (individual progress changes)
   */
  private progressListeners: Set<ProgressListener> = new Set();

  /**
   * Centralized error logger that maintains a bounded log of recent errors.
   * Useful for debugging and displaying error history to users.
   */
  private errorLogger: ErrorLogger;

  // ---------------------------------------------------------------------------
  // SCHEDULER LIFECYCLE STATE
  // ---------------------------------------------------------------------------

  /**
   * Number of workers to create in the pool.
   * Defaults to (CPU cores - 1) to leave one core for the main thread.
   * Can be overridden via SchedulerOptions.
   */
  private poolSize: number;

  /**
   * Flag indicating whether the worker pool has been initialized.
   * Workers are created lazily on first dispatch, not in constructor.
   * This avoids creating workers if the scheduler is never used.
   */
  private initialized = false;

  /**
   * Flag indicating the scheduler has been shut down.
   * Once true, no new tasks can be dispatched and all workers are terminated.
   * This is a one-way transition - a shutdown scheduler cannot be restarted.
   */
  private isShutdown = false;

  /**
   * Promise that resolves when worker pool initialization is complete.
   * Used to prevent race conditions when multiple tasks are dispatched
   * before initialization finishes. Only the first dispatch triggers init,
   * subsequent dispatches wait for this promise.
   */
  private initPromise: Promise<void> | null = null;

  // ---------------------------------------------------------------------------
  // AGGREGATE COUNTERS
  // ---------------------------------------------------------------------------
  // These counters track the total number of completed/failed tasks since
  // scheduler creation. Unlike taskStatuses which only tracks active tasks,
  // these persist after task cleanup for accurate aggregate progress reporting.

  private completedCount = 0;
  private failedCount = 0;

  // ===========================================================================
  // PUBLIC API: BEGIN
  // ===========================================================================

  /**
   * Creates a new WorkerScheduler instance.
   *
   * Note: Workers are NOT created here - they're created lazily on first dispatch.
   * This means creating a scheduler has minimal overhead if it's never used.
   *
   * @param options - Optional configuration
   * @param options.poolSize - Number of workers (default: CPU cores - 1)
   * @param options.maxErrorLogSize - Max errors to retain in log (default: 100)
   */
  constructor(options?: SchedulerOptions) {
    // Determine pool size: use provided value or calculate based on CPU cores
    this.poolSize = options?.poolSize ?? this.getDefaultPoolSize();

    // Initialize error logger with optional size limit
    this.errorLogger = new ErrorLogger(options?.maxErrorLogSize);

    // Initialize priority queue with comparator function
    this.taskQueue = new PriorityQueue<TaskWithInternals<keyof TaskMap>>(
      (a, b) => {
        // Lower priority number = higher priority (CRITICAL=0 comes before LOW=3)
        // Example: CRITICAL(0) - HIGH(1) = -1, so CRITICAL comes first
        return a.priority - b.priority;
      },
    );
  }

  dispatch<K extends keyof TaskMap>(taskDef: {
    type: K;
    payload: TaskMap[K]["payload"];
    priority: TaskPriority;
    onProgress?: TaskMap[K]["onProgress"];
    onComplete?: TaskMap[K]["onComplete"];
    onError?: (error: TaskError) => void;
  }): TaskHandle<TaskMap[K]["result"]> {
    type TResult = TaskMap[K]["result"];
    // Generate a unique ID for this task
    // Format: task_<timestamp>_<random> for easy debugging/logging
    const taskId = this.generateTaskId();

    /** -- Shutdown Check --
     * If the scheduler has been shut down, immediately return a failed handle.
     * This prevents any work from being queued after shutdown.
     */
    if (this.isShutdown) {
      const error = new Error("Scheduler has been shut down");
      const handle: TaskHandle<TResult> = {
        id: taskId,
        get status() {
          return TaskStatus.FAILED;
        },
        cancel: () => {}, // No-op since task was never queued
        promise: Promise.reject(error),
      };
      // Attach empty catch to prevent "unhandled rejection" warnings
      // The caller may or may not await this promise
      handle.promise.catch(() => {});
      return handle;
    }

    /** -- Promise Setup (deferred pattern) --
     * Create a promise that we can resolve/reject later when the task completes.
     * We capture the resolve/reject functions to call them from runTask().
     */
    // These will be assigned inside the Promise constructor
    let resolveTask: (value: TResult) => void;
    let rejectTask: (error: Error) => void;

    // Create the promise and capture its resolve/reject functions
    const promise = new Promise<TResult>((resolve, reject) => {
      resolveTask = resolve;
      rejectTask = reject;
    });

    /** -- Task Object Creation --
     * Combine the task definition with internal fields needed for execution
     */

    const task: TaskWithInternals<K> = {
      ...taskDef, // type, payload, priority, onProgress, onComplete, onError
      id: taskId,
      resolve: resolveTask!, // Non-null assertion: assigned in Promise constructor
      reject: rejectTask!, // Non-null assertion: assigned in Promise constructor
    };

    /** -- Cancellation Setup --
     * Create an AbortController for this task. AbortController is the standard
     * Web API for cancellation. When cancel() is called, we'll abort this
     * controller, which sets signal.aborted = true.
     */

    const abortController = new AbortController();
    this.abortControllers.set(taskId, abortController);

    /** -- Initial State Setup -- */

    // Set initial status to PENDING (waiting in queue)
    this.taskStatuses.set(taskId, TaskStatus.PENDING);

    // Set initial progress to 0%
    this.taskProgress.set(taskId, 0);

    /** -- Task Queueing --
     * Add to both the priority queue (for execution ordering) and
     * activeTasks map (for lookup by ID)
     */

    this.taskQueue.enqueue(task);
    this.activeTasks.set(taskId, task);

    // Notify listeners that a new task is pending
    // This updates the aggregate progress (pending count increased)
    this.notifyProgressListeners();

    /** -- Worker Pool Initialization & Queue Processing --
     * Initialize the worker pool if this is the first dispatch, then process
     * the queue to start executing tasks.
     */
    if (!this.initialized) {
      // Workers haven't been created yet - this is the first dispatch

      if (!this.initPromise) {
        // First dispatch ever: start initialization
        // Chain processQueue() after init completes
        this.initPromise = this.initPool().then(() => {
          this.processQueue();
        });
      }
      // If initPromise exists but not resolved, we're still initializing.
      // Don't call processQueue() - it will be called when init completes.
      // Additional dispatches during init just add to the queue.
    } else {
      // Workers already initialized - immediately try to process queue
      // This will assign the task to a worker if one is available
      this.processQueue();
    }

    /** -- Terminal Status Caching --
     * After a task completes, we clean up its entry from taskStatuses to prevent
     * memory leaks. But the TaskHandle.status getter should still return the
     * correct final status. We solve this by caching the terminal status.
     */

    let terminalStatus: TaskStatus | null = null;

    // When the promise resolves/rejects, capture the final status
    promise
      .then(() => {
        terminalStatus = TaskStatus.COMPLETED;
      })
      .catch((error) => {
        // Distinguish between cancellation and other failures
        // Cancellation throws a DOMException with name "AbortError"
        if (error instanceof DOMException && error.name === "AbortError") {
          terminalStatus = TaskStatus.CANCELLED;
        } else {
          terminalStatus = TaskStatus.FAILED;
        }
      });

    /** -- Status Getter with Fallback --
     * Create a getter function that checks taskStatuses first, then falls back
     * to the cached terminal status if the task has been cleaned up.
     */
    const getStatus = () => {
      // Try to get status from active tracking
      const currentStatus = this.getTaskStatus(taskId);
      if (currentStatus !== undefined) {
        return currentStatus;
      }

      // Task was cleaned up - use cached terminal status
      if (terminalStatus !== null) {
        return terminalStatus;
      }

      // Fallback (should never happen in normal operation)
      return TaskStatus.PENDING;
    };

    /** -- Create and Return Task Handle --
     * The TaskHandle is the caller's interface to the scheduled task
     */
    const handle: TaskHandle<TResult> = {
      /** Unique identifier for this task */
      id: taskId,

      /** Current status (uses getter for live updates) */
      get status() {
        return getStatus();
      },

      /** Cancel this task (works whether pending or running) */
      cancel: () => this.cancel(taskId),

      /** Promise that resolves with result or rejects with error */
      promise,
    };

    return handle;
  }

  // TASK CANCELLATION

  cancel(taskId: string): void {
    // Signal the AbortController (sets signal.aborted = true)
    // This allows running workers to detect cancellation
    const abortController = this.abortControllers.get(taskId);
    if (abortController) {
      abortController.abort();
    }

    // Get the task object for callbacks
    const task = this.activeTasks.get(taskId);
    if (!task) return; // Task doesn't exist or already cleaned up

    const currentStatus = this.taskStatuses.get(taskId);

    // Only cancel if task is still active (pending or running)
    // Don't try to cancel already-completed or already-failed tasks
    if (
      currentStatus === TaskStatus.PENDING ||
      currentStatus === TaskStatus.RUNNING
    ) {
      // Update status to CANCELLED
      this.updateTaskStatus(taskId, TaskStatus.CANCELLED);

      // Remove from queue if it was still pending
      this.taskQueue.remove((t) => t.id === taskId);

      // Create a standardized error object for logging and callbacks
      const error = createTaskError(
        taskId,
        task.type,
        new DOMException("Task cancelled", "AbortError"),
      );

      // Call the task's error callback if provided
      // This allows the caller to react to cancellation
      if (task.onError) {
        task.onError(error);
      }

      // Reject the task's promise
      // Anyone awaiting handle.promise will receive this error
      task.reject(new DOMException("Task cancelled", "AbortError"));

      // Log the error for debugging/history
      this.errorLogger.log(error);

      // Update aggregate counts
      // Note: Cancelled tasks count as "failed" for progress purposes
      this.failedCount++;

      // Clean up all task-related state to prevent memory leaks
      this.activeTasks.delete(taskId);
      this.abortControllers.delete(taskId);
      this.taskProgress.delete(taskId);
      this.taskStatuses.delete(taskId);

      // Notify listeners of the status change
      this.notifyProgressListeners();
    }
  }

  cancelAll(): void {
    // Get all active task IDs
    // We copy to an array because cancel() modifies activeTasks
    const taskIds = Array.from(this.activeTasks.keys());

    // Cancel each task
    for (const taskId of taskIds) {
      this.cancel(taskId);
    }
  }

  // PROGRESS TRACKING

  getProgress(): AggregateProgress {
    // Count tasks by status
    let pending = 0;
    let running = 0;

    // Iterate through all tracked task statuses
    for (const [, status] of this.taskStatuses) {
      if (status === TaskStatus.PENDING) pending++;
      else if (status === TaskStatus.RUNNING) running++;
      // Note: COMPLETED/FAILED/CANCELLED tasks are removed from taskStatuses
      // so we use the aggregate counters for those
    }

    const totalActive = pending + running;

    // Calculate total tasks ever seen
    let totalProgressPercentage = 0;
    for (const [, progress] of this.taskProgress) {
      totalProgressPercentage += progress;
    }

    // Calculate overall percentage
    // Only completed tasks count toward progress (not failed)
    // This gives a sense of "successful completion rate"
    const overallPercent =
      totalProgressPercentage > 0
        ? Math.round(totalProgressPercentage / totalActive)
        : 0;

    return {
      pending,
      running,
      completed: this.completedCount,
      failed: this.failedCount,
      overallPercent,
    };
  }

  onProgress(listener: ProgressListener): () => void {
    // Add listener to the set
    this.progressListeners.add(listener);

    // Return unsubscribe function
    // This closure captures the listener reference for removal
    return () => {
      this.progressListeners.delete(listener);
    };
  }

  // ERROR & STATUS INSPECTION

  getErrorLog(): readonly TaskError[] {
    return this.errorLogger.getErrors();
  }

  getTaskStatus(taskId: string): TaskStatus | undefined {
    return this.taskStatuses.get(taskId);
  }

  // LIFECYCLE

  async shutdown(): Promise<void> {
    // Set shutdown flag to prevent new dispatches
    this.isShutdown = true;

    // Cancel all pending and running tasks
    // Their onError callbacks will be called with cancellation errors
    this.cancelAll();

    // Terminate all Web Workers
    // This immediately stops all worker threads
    for (const worker of this.workerPool) {
      worker.terminate();
    }

    // Clear all state
    this.workerPool = [];
    this.availableWorkers.clear();
    this.workerProxies.clear();
    this.initialized = false;
  }

  // ===========================================================================
  // PUBLIC API -- END
  // ===========================================================================

  // ===========================================================================
  // PRIVATE -- BEGIN
  // ===========================================================================

  /**
   * Calculates the default worker pool size based on available CPU cores.
   *
   * Strategy: Use (cores - 1) to leave one core free for the main thread.
   * This prevents the UI from becoming unresponsive during heavy worker usage.
   *
   * Falls back to 2 workers if hardware info is unavailable (e.g., in tests).
   *
   * @returns Number of workers to create
   */
  private getDefaultPoolSize(): number {
    // navigator.hardwareConcurrency returns the number of logical CPU cores
    // It's available in all modern browsers but may not exist in Node.js/tests
    if (typeof navigator !== "undefined" && navigator.hardwareConcurrency) {
      // Reserve one core for main thread, but always have at least 1 worker
      return Math.max(1, navigator.hardwareConcurrency - 1);
    }
    return 2; // Default fallback for environments without hardware info
  }

  /**
   * Generates a unique task ID.
   *
   * Format: task_<timestamp>_<random>
   * Example: task_1705123456789_k8j3m2n5p
   *
   * The timestamp prefix makes IDs roughly sortable by creation time.
   * The random suffix prevents collisions if multiple tasks are created
   * in the same millisecond.
   *
   * @returns Unique task ID string
   */
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Initializes the worker pool by creating Web Workers.
   *
   * This is called lazily on first dispatch, not in the constructor.
   * This avoids creating workers if the scheduler is never used.
   *
   * Each worker is:
   * 1. Created as a module worker (type: "module")
   * 2. Wrapped with Comlink for RPC-style communication
   * 3. Added to the available workers set
   */
  private async initPool(): Promise<void> {
    // Guard against double initialization
    if (this.initialized) return;

    // Create workers
    for (let i = 0; i < this.poolSize; i++) {
      // Create Web Worker using Vite's worker import syntax
      // The URL constructor with import.meta.url enables proper bundling
      const worker = new Worker(
        new URL("../../workers/worker.ts", import.meta.url),
        {
          type: "module", // Required for ES module workers
        },
      );

      // Add to pool
      this.workerPool.push(worker);

      // Mark as available (ready to take tasks)
      this.availableWorkers.add(i);

      // Wrap with Comlink for RPC communication
      // Comlink enables calling worker methods as if they were local:
      //   const result = await proxy.someMethod(arg);
      // Instead of manual postMessage/onmessage handling
      const proxy = Comlink.wrap<IWorkerAPI>(worker);
      this.workerProxies.set(i, proxy);
    }

    this.initialized = true;
  }

  /**
   * Processes the task queue, assigning pending tasks to available workers.
   *
   * This is called:
   * - After worker pool initialization
   * - After a new task is dispatched (if already initialized)
   * - After a worker completes a task (to pick up next task)
   *
   * The method loops until either:
   * - No more available workers
   * - No more tasks in queue
   */
  private processQueue(): void {
    // Don't process if shutdown
    if (this.isShutdown) return;

    // Process tasks while we have both available workers AND queued tasks
    while (this.availableWorkers.size > 0 && !this.taskQueue.isEmpty()) {
      // Get highest priority task from queue
      const task = this.taskQueue.dequeue();
      if (!task) break; // Queue was empty (shouldn't happen due to isEmpty check)

      // Skip if task was cancelled while waiting in queue
      // The task might have been cancelled after being queued but before
      // a worker became available to process it
      if (this.taskStatuses.get(task.id) === TaskStatus.CANCELLED) {
        continue; // Skip to next task
      }

      // Get an available worker index
      // Set.values().next().value gets an arbitrary element from the set
      const workerIndex = this.availableWorkers.values().next().value;
      if (workerIndex === undefined) break; // No workers available

      // Mark worker as busy (remove from available set)
      this.availableWorkers.delete(workerIndex);

      // Start executing the task on this worker
      // Note: This is async but we don't await - task runs in background
      this.runTask(task, workerIndex);
    }
  }

  /**
   * Executes a task on a specific worker.
   *
   * This method:
   * 1. Updates task status to RUNNING
   * 2. Creates a CancelToken for cooperative cancellation
   * 3. Routes to the appropriate worker method based on task type
   * 4. Handles success/error/cancellation
   * 5. Cleans up and releases the worker
   *
   * @param task - The task to execute (with internals)
   * @param workerIndex - Index of the worker to use
   */
  private async runTask<K extends keyof TaskMap>(
    task: TaskWithInternals<K>,
    workerIndex: number,
  ): Promise<void> {
    // Update status from PENDING to RUNNING
    this.updateTaskStatus(task.id, TaskStatus.RUNNING);

    // Get the Comlink proxy for this worker
    const proxy = this.workerProxies.get(workerIndex);
    if (!proxy) {
      // This shouldn't happen, but handle gracefully
      this.handleTaskError(task, new Error("Worker proxy not found"));
      this.releaseWorker(workerIndex);
      return;
    }

    /** -- Cancellation Token Setup --
     * Create a CancelToken that workers can check for cancellation.
     * This is passed to worker methods which should periodically check
     * cancelToken.cancelled and stop early if true.
     */

    const abortController = this.abortControllers.get(task.id);
    const cancelToken: CancelToken = {
      // Getter that checks the AbortController's signal
      // This allows the token to reflect real-time cancellation state
      get cancelled() {
        return abortController?.signal.aborted ?? false;
      },
    };

    /** -- Progress Callback Setup --
     * Create a progress callback that updates our tracking and notifies listeners.
     * This is passed to worker methods which call it with 0-100 values.
     */
    const onProgress: NonNullable<TaskMap[K]["onProgress"]> = ({
      value,
      ...rest
    }) => {
      if (this.taskStatuses.get(task.id) === TaskStatus.RUNNING) {
        // Update our progress tracking

        this.taskProgress.set(task.id, value);

        // Call the task's progress callback if provided

        task.onProgress?.({ value, ...rest });

        // Notify aggregate progress listeners
        this.notifyProgressListeners();
      }
    };

    /** -- Task Execution -- */
    try {
      // Check if cancelled before we even start
      if (cancelToken.cancelled) {
        throw new DOMException("Task cancelled", "AbortError");
      }

      // Route to appropriate worker method based on task type
      // Each task type has its own payload structure and worker method
      const result = await proxy.execute(
        task.type,
        task.payload,
        cancelToken,
        Comlink.proxy(onProgress),
      );

      // Check if cancelled during execution
      // Worker might not have checked cancellation, so we check here too
      if (cancelToken.cancelled) {
        throw new DOMException("Task cancelled", "AbortError");
      }

      // Update status to COMPLETED
      this.updateTaskStatus(task.id, TaskStatus.COMPLETED);

      // Mark progress as 100%
      this.taskProgress.set(task.id, 100);

      // Increment completed counter
      this.completedCount++;

      // Call the task's completion callback if provided
      if (task.onComplete) {
        task.onComplete(result);
      }

      // Resolve the task's promise with the result
      // This allows callers who await handle.promise to receive the result
      task.resolve(result);

      // Clean up task state to prevent memory leaks
      this.activeTasks.delete(task.id);
      this.abortControllers.delete(task.id);
      this.taskProgress.delete(task.id);
      this.taskStatuses.delete(task.id);
    } catch (error) {
      // Delegate to centralized error handler
      this.handleTaskError(task, error);
    } finally {
      // Release the worker back to the available pool
      this.releaseWorker(workerIndex);

      // Notify listeners of final state
      this.notifyProgressListeners();
    }
  }

  /**
   * Handles task errors (including cancellation).
   *
   * This method:
   * 1. Creates a standardized TaskError object
   * 2. Updates task status to FAILED
   * 3. Calls the task's error callback
   * 4. Logs the error
   * 5. Rejects the task's promise
   * 6. Cleans up task state
   *
   * @param task - The task that errored
   * @param error - The error that occurred
   */
  private handleTaskError(
    task: TaskWithInternals<keyof TaskMap>,
    error: unknown,
  ): void {
    // Create standardized error object for logging and callbacks
    const taskError = createTaskError(task.id, task.type, error);

    // Update status to FAILED
    this.updateTaskStatus(task.id, TaskStatus.FAILED);

    // Increment failed counter
    this.failedCount++;

    // Call error callback if provided
    if (task.onError) {
      task.onError(taskError);
    }

    // Log error for debugging/history
    this.errorLogger.log(taskError);

    // Reject the promise
    // Ensure we reject with an Error instance
    if (error instanceof Error) {
      task.reject(error);
    } else {
      task.reject(new Error(String(error)));
    }

    // Clean up task state
    this.activeTasks.delete(task.id);
    this.abortControllers.delete(task.id);
    this.taskProgress.delete(task.id);
    this.taskStatuses.delete(task.id);
  }

  /**
   * Releases a worker back to the available pool.
   *
   * Called after a task completes (success or error).
   * Triggers queue processing to pick up any waiting tasks.
   *
   * @param workerIndex - Index of the worker to release
   */
  private releaseWorker(workerIndex: number): void {
    // Only release if not shutdown and worker still exists
    if (!this.isShutdown && this.workerPool[workerIndex]) {
      // Add back to available set
      this.availableWorkers.add(workerIndex);

      // Process queue to pick up next task
      // This enables continuous processing without manual polling
      this.processQueue();
    }
  }

  /**
   * Updates the status of a task.
   *
   * This is a simple wrapper that could be extended to add:
   * - Status transition validation
   * - Status change events
   * - Logging
   *
   * @param taskId - ID of the task to update
   * @param status - New status value
   */
  private updateTaskStatus(taskId: string, status: TaskStatus): void {
    this.taskStatuses.set(taskId, status);
  }

  /**
   * Notifies all registered progress listeners of the current progress.
   *
   * Called whenever progress might have changed:
   * - Task added/removed
   * - Task status changed
   * - Task progress updated
   *
   * Listener errors are caught and ignored to prevent one bad listener
   * from breaking others.
   */
  private notifyProgressListeners(): void {
    // Calculate current aggregate progress
    const progress = this.getProgress();

    // Notify all listeners
    for (const listener of this.progressListeners) {
      try {
        listener(progress);
      } catch {
        // Ignore listener errors
        // A failing listener shouldn't affect others or the scheduler
      }
    }
  }
  // ===========================================================================
  // PRIVATE -- END
  // ===========================================================================
}

# Web Worker Scheduler

A general-purpose web worker scheduler for dispatching parallel tasks with priority queuing, cancellation support, and progress tracking.

## Overview

The scheduler manages a pool of web workers that can execute tasks in parallel. It provides:

- **Priority-based task queuing** - Critical tasks run before low-priority background work
- **Task cancellation** - Cancel individual tasks or all pending work
- **Progress tracking** - Per-task and aggregate progress reporting
- **Error handling** - Graceful failure with error logging

## Quick Start

### Basic Usage

```typescript
import { useScheduler, useSchedulerProgress } from "contexts";
import { TaskPriority } from "workers/scheduler";

const MeasurementButton = () => {
  const scheduler = useScheduler();
  const { running, completed } = useSchedulerProgress();

  const handleMeasure = () => {
    const handle = scheduler.dispatch({
      type: "annotationMeasurements",
      payload: { annotations, selectedMeasurements },
      priority: TaskPriority.HIGH,
      onProgress: (percent) => console.log(`${percent}% complete`),
      onComplete: (results) => dispatch(updateMeasurements(results)),
      onError: (error) => console.error("Measurement failed:", error),
    });

    // Optional: cancel later
    // handle.cancel();
  };

  return (
    <Button onClick={handleMeasure} disabled={running > 0}>
      {running > 0 ? `Processing... (${completed} done)` : "Measure"}
    </Button>
  );
};
```

### Using the TaskHandle

`dispatch()` returns a `TaskHandle` for tracking and controlling the task:

```typescript
interface TaskHandle<TResult> {
  id: string;                    // Unique task identifier
  status: TaskStatus;            // "pending" | "running" | "completed" | "cancelled" | "failed"
  cancel: () => void;            // Request cancellation
  promise: Promise<TResult>;     // Resolves with result or rejects on error
}
```

Example with async/await:

```typescript
const handle = scheduler.dispatch({
  type: "annotationMeasurements",
  payload: { annotations, selectedMeasurements },
  priority: TaskPriority.NORMAL,
});

try {
  const results = await handle.promise;
  console.log("Measurements:", results);
} catch (error) {
  if (error.code === "CANCELLED") {
    console.log("Task was cancelled");
  } else {
    console.error("Task failed:", error);
  }
}
```

## Task Priority

Tasks are processed in priority order. Lower numbers = higher priority:

```typescript
enum TaskPriority {
  CRITICAL = 0,  // User-blocking (e.g., visible annotation measurement)
  HIGH = 1,      // User-initiated but not blocking
  NORMAL = 2,    // Background work (default)
  LOW = 3,       // Speculative/prefetch work
}
```

Example:

```typescript
// This will run before any NORMAL or LOW priority tasks
scheduler.dispatch({
  type: "annotationMeasurements",
  payload: visibleAnnotations,
  priority: TaskPriority.CRITICAL,
});

// This queues behind CRITICAL and HIGH tasks
scheduler.dispatch({
  type: "prepareEntityData",
  payload: prefetchData,
  priority: TaskPriority.LOW,
});
```

## Cancellation

### Cancel a Single Task

```typescript
const handle = scheduler.dispatch({ ... });

// Later, cancel this specific task
handle.cancel();

// Or use the scheduler directly
scheduler.cancel(handle.id);
```

### Cancel All Tasks

```typescript
// Cancel all pending and running tasks
scheduler.cancelAll();
```

### Handling Cancellation in Callbacks

```typescript
scheduler.dispatch({
  type: "annotationMeasurements",
  payload: data,
  onError: (error) => {
    if (error.code === "CANCELLED") {
      // Task was cancelled - this is expected, not an error
      console.log("Task cancelled by user");
    } else {
      // Actual error occurred
      console.error("Task failed:", error.message);
    }
  },
});
```

## Progress Tracking

### Per-Task Progress

```typescript
scheduler.dispatch({
  type: "annotationMeasurements",
  payload: data,
  onProgress: (percent) => {
    // percent is 0-100
    setTaskProgress(percent);
  },
});
```

### Aggregate Progress

Use `useSchedulerProgress()` to get overall scheduler status:

```typescript
const progress = useSchedulerProgress();

// progress = {
//   pending: 3,        // Tasks waiting in queue
//   running: 2,        // Tasks currently executing
//   completed: 10,     // Tasks finished successfully
//   failed: 1,         // Tasks that errored or were cancelled
//   overallPercent: 75 // Completion percentage
// }
```

### Subscribe to Progress Changes

```typescript
const scheduler = useScheduler();

useEffect(() => {
  const unsubscribe = scheduler.onProgress((progress) => {
    console.log(`${progress.running} tasks running`);
  });

  return unsubscribe;
}, [scheduler]);
```

## Available Task Types

### `annotationMeasurements`

Compute measurements for annotations (area, perimeter, etc.).

```typescript
scheduler.dispatch({
  type: "annotationMeasurements",
  payload: {
    annotations: Record<string, PreparedAnnotationData>,
    selectedMeasurements: ["area", "perimeter", "sphericity"],
    recalculate: false, // Force recalculation of existing measurements
  },
  onComplete: (results) => {
    // results: { annId: string, measurements: ObjectMeasurements }[]
  },
});
```

### `channelMeasurements`

Compute intensity statistics for image channels.

```typescript
scheduler.dispatch({
  type: "channelMeasurements",
  payload: {
    id: "image-123",
    existingMeasurements: channelStats,
    channels: [
      { channelId: "ch1", measurements: ["mean", "std", "min", "max"] },
    ],
  },
  onComplete: ({ id, measurements }) => {
    // measurements: ChannelStatistics[]
  },
});
```

### `prepareEntityData`

Prepare entity channel data for measurement computation.

```typescript
scheduler.dispatch({
  type: "prepareEntityData",
  payload: {
    kind: "Annotation",
    entities: preparedEntityData,
  },
  onComplete: ({ kind, data }) => {
    // data: PreparedEntityChannels
  },
});
```

## Error Handling

### Task Errors

```typescript
scheduler.dispatch({
  type: "annotationMeasurements",
  payload: data,
  onError: (error: TaskError) => {
    // error = {
    //   taskId: "task_123",
    //   type: "annotationMeasurements",
    //   code: "WORKER_ERROR" | "CANCELLED" | "TIMEOUT" | "UNKNOWN",
    //   message: "Human-readable error message",
    //   originalError: Error,  // Original error if available
    //   timestamp: 1234567890
    // }
  },
});
```

### Error Log

Access the scheduler's error log for debugging:

```typescript
const scheduler = useScheduler();
const errors = scheduler.getErrorLog();

// errors: readonly TaskError[]
console.log(`Last ${errors.length} errors:`, errors);
```

---

# Adding New Worker Types

This section explains how to extend the scheduler with new task types, such as inference workers.

## Step 1: Define the Task Type

Add your task type to the worker API in `src/workers/scheduler/worker.ts`:

```typescript
// Add to WorkerAPI interface
export interface WorkerAPI {
  // Existing methods...
  annotationMeasurements: (...) => Promise<...>;
  channelMeasurements: (...) => Promise<...>;

  // New inference method
  runInference: (
    modelId: string,
    imageData: Float32Array,
    options: InferenceOptions,
    cancelToken: CancelToken,
    onProgress: (progress: number) => void,
  ) => Promise<InferenceResult>;
}
```

## Step 2: Implement the Worker Method

Add the implementation to the `workerAPI` object in `worker.ts`:

```typescript
const workerAPI: WorkerAPI = {
  // Existing implementations...

  async runInference(
    modelId: string,
    imageData: Float32Array,
    options: InferenceOptions,
    cancelToken: CancelToken,
    onProgress: (progress: number) => void,
  ): Promise<InferenceResult> {
    // Check for cancellation at iteration boundaries
    if (cancelToken.cancelled) {
      throw new DOMException("Task cancelled", "AbortError");
    }

    // Load model (check cancellation periodically)
    const model = await loadModel(modelId);

    if (cancelToken.cancelled) {
      throw new DOMException("Task cancelled", "AbortError");
    }

    // Run inference with progress updates
    const tensor = tf.tensor4d(imageData, [1, height, width, channels]);

    try {
      const predictions = await model.predict(tensor);
      onProgress(50);

      if (cancelToken.cancelled) {
        throw new DOMException("Task cancelled", "AbortError");
      }

      const results = await postProcess(predictions);
      onProgress(100);

      return results;
    } finally {
      tensor.dispose();
    }
  },
};
```

## Step 3: Add Task Routing in WorkerScheduler

Update `runTask()` in `src/workers/scheduler/WorkerScheduler.ts` to route your new task type:

```typescript
private async runTask(task: TaskWithInternals, workerIndex: number): Promise<void> {
  // ... existing setup code ...

  try {
    let result: unknown;

    switch (task.type) {
      // Existing cases...
      case "annotationMeasurements":
        // ...
        break;

      // Add new case
      case "runInference":
        result = await proxy.runInference(
          (task.payload as InferencePayload).modelId,
          (task.payload as InferencePayload).imageData,
          (task.payload as InferencePayload).options,
          cancelToken,
          Comlink.proxy(wrappedProgress),
        );
        break;

      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }

    // ... existing completion code ...
  } catch (error) {
    // ... existing error handling ...
  }
}
```

## Step 4: Define Payload Types (Optional but Recommended)

Create typed payload interfaces for type safety:

```typescript
// In types.ts or a separate inference-types.ts

interface InferencePayload {
  modelId: string;
  imageData: Float32Array;
  options: InferenceOptions;
}

interface InferenceOptions {
  threshold?: number;
  maxDetections?: number;
}

interface InferenceResult {
  predictions: Prediction[];
  timing: { loadMs: number; inferenceMs: number };
}
```

## Step 5: Use the New Task Type

```typescript
import { useScheduler } from "contexts";
import { TaskPriority } from "workers/scheduler";

const InferenceComponent = () => {
  const scheduler = useScheduler();

  const runInference = async (imageData: Float32Array) => {
    const handle = scheduler.dispatch({
      type: "runInference",
      payload: {
        modelId: "yolov5",
        imageData,
        options: { threshold: 0.5 },
      },
      priority: TaskPriority.HIGH,
      onProgress: (percent) => setProgress(percent),
      onComplete: (results) => {
        console.log("Detected:", results.predictions);
      },
      onError: (error) => {
        console.error("Inference failed:", error);
      },
    });

    return handle;
  };
};
```

## Best Practices for Worker Methods

### 1. Check Cancellation Frequently

Check `cancelToken.cancelled` at natural iteration boundaries:

```typescript
for (const item of items) {
  if (cancelToken.cancelled) {
    throw new DOMException("Task cancelled", "AbortError");
  }
  await processItem(item);
}
```

### 2. Report Progress Regularly

Call `onProgress()` to keep the UI responsive:

```typescript
let processed = 0;
for (const item of items) {
  await processItem(item);
  processed++;
  onProgress(Math.floor((processed / items.length) * 100));
}
```

### 3. Clean Up Resources

Always dispose of tensors and other resources:

```typescript
const tensor = tf.tensor4d(data);
try {
  // Use tensor...
  return result;
} finally {
  tensor.dispose();
}
```

### 4. Handle Errors Gracefully

Let errors propagate - the scheduler will catch and log them:

```typescript
async myWorkerMethod(...) {
  // Don't wrap everything in try/catch
  // Let natural errors propagate to the scheduler

  const result = await riskyOperation();
  return result;
}
```

### 5. Keep Tasks Focused

Each task type should do one thing well. If you need multiple operations, dispatch multiple tasks:

```typescript
// Good: Separate tasks
const prepareHandle = scheduler.dispatch({ type: "prepare", ... });
await prepareHandle.promise;

const inferHandle = scheduler.dispatch({ type: "runInference", ... });
const results = await inferHandle.promise;

// Avoid: One monolithic task that does everything
```

---

## Architecture Reference

```
┌─────────────────────────────────────────────────────────────┐
│                      Main Thread                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              WorkerScheduler (class)                 │   │
│  │  - taskQueue: PriorityQueue<Task>                   │   │
│  │  - activeTasks: Map<taskId, Task>                   │   │
│  │  - workerPool: Worker[]                             │   │
│  │  - availableWorkers: Set<Worker>                    │   │
│  │                                                      │   │
│  │  + dispatch(task, options): TaskHandle              │   │
│  │  + cancel(taskId): void                             │   │
│  │  + cancelAll(): void                                │   │
│  │  + getProgress(): AggregateProgress                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│              Comlink proxy connections                      │
│         ┌─────────────────┼─────────────────┐              │
│         ▼                 ▼                 ▼              │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐         │
│  │ Worker 0 │      │ Worker 1 │      │ Worker 2 │  ...    │
│  └──────────┘      └──────────┘      └──────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## File Structure

```
src/workers/scheduler/
├── types.ts           # Type definitions (Task, TaskHandle, etc.)
├── PriorityQueue.ts   # Min-heap priority queue
├── errors.ts          # Error utilities and logging
├── worker.ts          # Worker entry point (add new methods here)
├── WorkerScheduler.ts # Main scheduler class (add routing here)
├── index.ts           # Public exports
└── README.md          # This file

src/contexts/
├── SchedulerProvider.tsx  # React context and hooks
└── index.ts               # Exports useScheduler, useSchedulerProgress
```

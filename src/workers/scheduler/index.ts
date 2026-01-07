// src/workers/scheduler/index.ts

// Enums - exported as values (can be used at runtime)
export { TaskPriority, TaskStatus } from "./types";

// Types - exported as type-only for better tree-shaking
export type {
  Task,
  TaskHandle,
  TaskError,
  TaskErrorCode,
  AggregateProgress,
  TaskDefinition,
  SchedulerOptions,
  CancelToken,
  ProgressListener,
} from "./types";

// Core scheduler class
export { WorkerScheduler } from "./WorkerScheduler";

// Error utilities
export { isAbortError, createTaskError, ErrorLogger } from "./errors";

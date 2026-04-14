// src/workers/scheduler/errors.ts
import type { TaskError, TaskErrorCode } from "./types";

function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === "AbortError") {
    return true;
  }
  if (error instanceof Error && error.name === "AbortError") {
    return true;
  }
  return false;
}

export function createTaskError(
  taskId: string,
  type: string,
  error: unknown,
): TaskError {
  let code: TaskErrorCode = "UNKNOWN";
  let message = "Unknown error";

  if (isAbortError(error)) {
    code = "CANCELLED";
    message = "Task cancelled";
  } else if (error instanceof Error) {
    code = "WORKER_ERROR";
    message = error.message;
  } else if (typeof error === "string") {
    message = error;
  }

  return {
    taskId,
    type,
    code,
    message,
    originalError: error,
    timestamp: Date.now(),
  };
}

export class ErrorLogger {
  private errors: TaskError[] = [];
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  log(error: TaskError): void {
    this.errors.push(error);
    if (this.errors.length > this.maxSize) {
      this.errors.shift();
    }

    if (import.meta.env?.DEV) {
      console.error("[WorkerScheduler] Task failed:", error);
    }
  }

  getErrors(): readonly TaskError[] {
    return [...this.errors];
  }

  clear(): void {
    this.errors = [];
  }
}

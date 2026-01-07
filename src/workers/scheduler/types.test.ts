// src/workers/scheduler/types.test.ts
import { describe, it, expect } from "vitest";
import {
  TaskPriority,
  TaskStatus,
  type Task,
  type TaskHandle,
  type TaskError,
  type AggregateProgress,
  type CancelToken,
} from "./types";

describe("TaskPriority", () => {
  it("should have CRITICAL as highest priority (lowest number)", () => {
    expect(TaskPriority.CRITICAL).toBeLessThan(TaskPriority.HIGH);
    expect(TaskPriority.HIGH).toBeLessThan(TaskPriority.NORMAL);
    expect(TaskPriority.NORMAL).toBeLessThan(TaskPriority.LOW);
  });

  it("should have correct numeric values", () => {
    expect(TaskPriority.CRITICAL).toBe(0);
    expect(TaskPriority.HIGH).toBe(1);
    expect(TaskPriority.NORMAL).toBe(2);
    expect(TaskPriority.LOW).toBe(3);
  });
});

describe("TaskStatus", () => {
  it("should have all required status values", () => {
    expect(TaskStatus.PENDING).toBe("pending");
    expect(TaskStatus.RUNNING).toBe("running");
    expect(TaskStatus.COMPLETED).toBe("completed");
    expect(TaskStatus.CANCELLED).toBe("cancelled");
    expect(TaskStatus.FAILED).toBe("failed");
  });
});

describe("Type definitions", () => {
  it("should allow creating a valid Task", () => {
    const task: Task<string> = {
      id: "test-id",
      type: "testTask",
      payload: { data: "test" },
      priority: TaskPriority.NORMAL,
    };
    expect(task.id).toBe("test-id");
  });

  it("should allow creating a TaskHandle", () => {
    const handle: TaskHandle<string> = {
      id: "test-id",
      status: TaskStatus.PENDING,
      cancel: () => {},
      promise: Promise.resolve("result"),
    };
    expect(handle.status).toBe(TaskStatus.PENDING);
  });

  it("should allow creating a TaskError", () => {
    const error: TaskError = {
      taskId: "test-id",
      type: "testTask",
      code: "WORKER_ERROR",
      message: "Something went wrong",
      timestamp: Date.now(),
    };
    expect(error.code).toBe("WORKER_ERROR");
  });

  it("should allow creating AggregateProgress", () => {
    const progress: AggregateProgress = {
      pending: 5,
      running: 2,
      completed: 10,
      failed: 1,
      overallPercent: 55,
    };
    expect(progress.running).toBe(2);
  });

  it("should allow creating a CancelToken", () => {
    const token: CancelToken = { cancelled: false };
    expect(token.cancelled).toBe(false);
  });
});

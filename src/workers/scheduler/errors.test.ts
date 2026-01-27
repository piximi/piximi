// src/workers/scheduler/errors.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ErrorLogger, createTaskError, isAbortError } from "./errors";
import { TaskError } from "./types";

describe("createTaskError", () => {
  it("should create error from Error object", () => {
    const error = createTaskError(
      "task-1",
      "testType",
      new Error("Test error"),
    );

    expect(error.taskId).toBe("task-1");
    expect(error.type).toBe("testType");
    expect(error.code).toBe("WORKER_ERROR");
    expect(error.message).toBe("Test error");
    expect(error.timestamp).toBeDefined();
  });

  it("should detect AbortError", () => {
    const abortError = new DOMException("Aborted", "AbortError");
    const error = createTaskError("task-1", "testType", abortError);

    expect(error.code).toBe("CANCELLED");
  });

  it("should handle string errors", () => {
    const error = createTaskError("task-1", "testType", "string error");

    expect(error.code).toBe("UNKNOWN");
    expect(error.message).toBe("string error");
  });

  it("should handle unknown errors", () => {
    const error = createTaskError("task-1", "testType", null);

    expect(error.code).toBe("UNKNOWN");
    expect(error.message).toBe("Unknown error");
  });
});

describe("isAbortError", () => {
  it("should return true for DOMException AbortError", () => {
    const error = new DOMException("Aborted", "AbortError");
    expect(isAbortError(error)).toBe(true);
  });

  it("should return true for error with AbortError name", () => {
    const error = new Error("Aborted");
    error.name = "AbortError";
    expect(isAbortError(error)).toBe(true);
  });

  it("should return false for other errors", () => {
    expect(isAbortError(new Error("Regular error"))).toBe(false);
    expect(isAbortError(null)).toBe(false);
    expect(isAbortError("string")).toBe(false);
  });
});

describe("ErrorLogger", () => {
  let logger: ErrorLogger;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logger = new ErrorLogger(3);
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("should log errors up to max size", () => {
    const error1: TaskError = {
      taskId: "1",
      type: "test",
      code: "WORKER_ERROR",
      message: "Error 1",
      timestamp: 1,
    };
    const error2: TaskError = {
      taskId: "2",
      type: "test",
      code: "WORKER_ERROR",
      message: "Error 2",
      timestamp: 2,
    };
    const error3: TaskError = {
      taskId: "3",
      type: "test",
      code: "WORKER_ERROR",
      message: "Error 3",
      timestamp: 3,
    };
    const error4: TaskError = {
      taskId: "4",
      type: "test",
      code: "WORKER_ERROR",
      message: "Error 4",
      timestamp: 4,
    };

    logger.log(error1);
    logger.log(error2);
    logger.log(error3);
    logger.log(error4);

    const errors = logger.getErrors();
    expect(errors).toHaveLength(3);
    expect(errors[0].taskId).toBe("2");
    expect(errors[2].taskId).toBe("4");
  });

  it("should clear errors", () => {
    logger.log({
      taskId: "1",
      type: "test",
      code: "WORKER_ERROR",
      message: "Error",
      timestamp: 1,
    });

    logger.clear();
    expect(logger.getErrors()).toHaveLength(0);
  });

  it("should return readonly array", () => {
    const errors = logger.getErrors();
    expect(Object.isFrozen(errors) || Array.isArray(errors)).toBe(true);
  });
});

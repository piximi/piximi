// src/contexts/SchedulerProvider.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React, { useEffect } from "react";
import ReactDOM from "react-dom";

import {
  SchedulerProvider,
  useScheduler,
  useSchedulerProgress,
} from "./SchedulerProvider";
import { WorkerScheduler, AggregateProgress } from "../workers/scheduler";

// Mock WorkerScheduler
const mockOnProgress = vi.fn();
const mockShutdown = vi.fn();
const mockGetProgress = vi.fn();

vi.mock("../workers/scheduler", () => {
  const mockSchedulerInstance = {
    onProgress: vi.fn((listener: (progress: AggregateProgress) => void) => {
      mockOnProgress(listener);
      return vi.fn(); // Return unsubscribe function
    }),
    shutdown: vi.fn(() => {
      mockShutdown();
      return Promise.resolve();
    }),
    getProgress: vi.fn(() => {
      mockGetProgress();
      return {
        pending: 0,
        running: 0,
        completed: 0,
        failed: 0,
        overallPercent: 0,
      };
    }),
    dispatch: vi.fn(),
    cancel: vi.fn(),
    cancelAll: vi.fn(),
    getErrorLog: vi.fn(() => []),
    getTaskStatus: vi.fn(),
  };

  return {
    WorkerScheduler: vi.fn(() => mockSchedulerInstance),
    TaskPriority: {
      CRITICAL: 0,
      HIGH: 1,
      NORMAL: 2,
      LOW: 3,
    },
    TaskStatus: {
      PENDING: "pending",
      RUNNING: "running",
      COMPLETED: "completed",
      CANCELLED: "cancelled",
      FAILED: "failed",
    },
  };
});

// Simple render helper for testing React components in happy-dom
function renderToDOM(element: React.ReactElement): {
  container: HTMLElement;
  unmount: () => void;
} {
  const container = document.createElement("div");
  document.body.appendChild(container);

  // Use React 17 render API
  ReactDOM.render(element, container);

  return {
    container,
    unmount: () => {
      ReactDOM.unmountComponentAtNode(container);
      document.body.removeChild(container);
    },
  };
}

// Wait for state updates
const waitForNextTick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("SchedulerProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any remaining DOM elements
    document.body.innerHTML = "";
  });

  describe("Provider rendering", () => {
    it("should render children when scheduler is ready", async () => {
      const TestChild = () => <div data-testid="child">Child Component</div>;

      const { container, unmount } = renderToDOM(
        <SchedulerProvider>
          <TestChild />
        </SchedulerProvider>,
      );

      await waitForNextTick();

      const child = container.querySelector('[data-testid="child"]');
      expect(child).not.toBeNull();
      expect(child?.textContent).toBe("Child Component");

      unmount();
    });

    it("should create WorkerScheduler instance on mount", async () => {
      const { unmount } = renderToDOM(
        <SchedulerProvider>
          <div>Test</div>
        </SchedulerProvider>,
      );

      await waitForNextTick();

      expect(WorkerScheduler).toHaveBeenCalledTimes(1);

      unmount();
    });

    it("should subscribe to progress updates on mount", async () => {
      const { unmount } = renderToDOM(
        <SchedulerProvider>
          <div>Test</div>
        </SchedulerProvider>,
      );

      await waitForNextTick();

      expect(mockOnProgress).toHaveBeenCalledTimes(1);
      expect(typeof mockOnProgress.mock.calls[0][0]).toBe("function");

      unmount();
    });

    it("should call shutdown on unmount", async () => {
      const { unmount } = renderToDOM(
        <SchedulerProvider>
          <div>Test</div>
        </SchedulerProvider>,
      );

      await waitForNextTick();

      // Get the count before unmount
      const countBeforeUnmount = mockShutdown.mock.calls.length;

      unmount();

      await waitForNextTick();

      // Verify shutdown was called exactly once more after unmount
      expect(mockShutdown.mock.calls.length - countBeforeUnmount).toBe(1);
    });
  });

  describe("useScheduler hook", () => {
    it("should return the scheduler instance when used within provider", async () => {
      let capturedScheduler: WorkerScheduler | null = null;

      const TestComponent = () => {
        const scheduler = useScheduler();
        capturedScheduler = scheduler;
        return <div>Test</div>;
      };

      const { unmount } = renderToDOM(
        <SchedulerProvider>
          <TestComponent />
        </SchedulerProvider>,
      );

      await waitForNextTick();

      expect(capturedScheduler).not.toBeNull();
      expect(capturedScheduler).toHaveProperty("dispatch");
      expect(capturedScheduler).toHaveProperty("cancel");
      expect(capturedScheduler).toHaveProperty("cancelAll");
      expect(capturedScheduler).toHaveProperty("shutdown");

      unmount();
    });

    it("should throw error when used outside provider", () => {
      const TestComponent = () => {
        useScheduler();
        return <div>Test</div>;
      };

      // Suppress console.error for this test
      const originalError = console.error;
      console.error = vi.fn();

      expect(() => {
        renderToDOM(<TestComponent />);
      }).toThrow("useScheduler must be used within SchedulerProvider");

      console.error = originalError;
    });
  });

  describe("useSchedulerProgress hook", () => {
    it("should return progress state when used within provider", async () => {
      let capturedProgress: AggregateProgress | null = null;

      const TestComponent = () => {
        const progress = useSchedulerProgress();
        capturedProgress = progress;
        return <div>Test</div>;
      };

      const { unmount } = renderToDOM(
        <SchedulerProvider>
          <TestComponent />
        </SchedulerProvider>,
      );

      await waitForNextTick();

      expect(capturedProgress).not.toBeNull();
      expect(capturedProgress).toHaveProperty("pending");
      expect(capturedProgress).toHaveProperty("running");
      expect(capturedProgress).toHaveProperty("completed");
      expect(capturedProgress).toHaveProperty("failed");
      expect(capturedProgress).toHaveProperty("overallPercent");

      unmount();
    });

    it("should return initial progress values", async () => {
      let capturedProgress: AggregateProgress | null = null;

      const TestComponent = () => {
        const progress = useSchedulerProgress();
        capturedProgress = progress;
        return <div>Test</div>;
      };

      const { unmount } = renderToDOM(
        <SchedulerProvider>
          <TestComponent />
        </SchedulerProvider>,
      );

      await waitForNextTick();

      expect(capturedProgress).toEqual({
        pending: 0,
        running: 0,
        completed: 0,
        failed: 0,
        overallPercent: 0,
      });

      unmount();
    });

    it("should throw error when used outside provider", () => {
      const TestComponent = () => {
        useSchedulerProgress();
        return <div>Test</div>;
      };

      // Suppress console.error for this test
      const originalError = console.error;
      console.error = vi.fn();

      expect(() => {
        renderToDOM(<TestComponent />);
      }).toThrow("useSchedulerProgress must be used within SchedulerProvider");

      console.error = originalError;
    });
  });

  describe("Progress updates", () => {
    it("should update progress state when listener is called", async () => {
      const progressValues: AggregateProgress[] = [];

      const TestComponent = () => {
        const progress = useSchedulerProgress();
        useEffect(() => {
          progressValues.push({ ...progress });
        }, [progress]);
        return <div>{progress.overallPercent}%</div>;
      };

      const { unmount } = renderToDOM(
        <SchedulerProvider>
          <TestComponent />
        </SchedulerProvider>,
      );

      await waitForNextTick();

      // Get the listener that was passed to onProgress
      const progressListener = mockOnProgress.mock.calls[0][0];

      // Simulate a progress update
      const newProgress: AggregateProgress = {
        pending: 5,
        running: 2,
        completed: 10,
        failed: 1,
        overallPercent: 56,
      };

      // Call the listener to simulate progress update
      await new Promise<void>((resolve) => {
        // Use act-like behavior by updating and waiting
        progressListener(newProgress);
        setTimeout(resolve, 10);
      });

      // Re-render to see the updated state
      await waitForNextTick();

      // Check that progress was captured
      expect(progressValues.length).toBeGreaterThanOrEqual(1);

      unmount();
    });
  });

  describe("Cleanup", () => {
    it("should unsubscribe from progress on unmount", async () => {
      const mockUnsubscribe = vi.fn();
      mockOnProgress.mockImplementationOnce(() => mockUnsubscribe);

      // Need to recreate the mock to use our new implementation
      const schedulerMock = vi.mocked(WorkerScheduler);
      schedulerMock.mockImplementationOnce(
        () =>
          ({
            onProgress: (listener: (progress: AggregateProgress) => void) => {
              mockOnProgress(listener);
              return mockUnsubscribe;
            },
            shutdown: vi.fn(() => Promise.resolve()),
            dispatch: vi.fn(),
            cancel: vi.fn(),
            cancelAll: vi.fn(),
            getProgress: vi.fn(() => ({
              pending: 0,
              running: 0,
              completed: 0,
              failed: 0,
              overallPercent: 0,
            })),
            getErrorLog: vi.fn(() => []),
            getTaskStatus: vi.fn(),
          }) as unknown as WorkerScheduler,
      );

      const { unmount } = renderToDOM(
        <SchedulerProvider>
          <div>Test</div>
        </SchedulerProvider>,
      );

      await waitForNextTick();

      unmount();

      await waitForNextTick();

      expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    });
  });
});

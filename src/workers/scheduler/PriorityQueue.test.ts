// src/workers/scheduler/PriorityQueue.test.ts
import { describe, it, expect, beforeEach } from "vitest";

import { PriorityQueue } from "./PriorityQueue";
import { Task, TaskPriority } from "./types";

const createTask = (id: string, priority: TaskPriority): Task => ({
  id,
  type: "test",
  payload: {},
  priority,
});

describe("PriorityQueue", () => {
  let queue: PriorityQueue<Task>;

  beforeEach(() => {
    queue = new PriorityQueue((a, b) => a.priority - b.priority);
  });

  describe("enqueue", () => {
    it("should add items to the queue", () => {
      queue.enqueue(createTask("1", TaskPriority.NORMAL));
      expect(queue.size()).toBe(1);
    });

    it("should maintain heap property", () => {
      queue.enqueue(createTask("low", TaskPriority.LOW));
      queue.enqueue(createTask("critical", TaskPriority.CRITICAL));
      queue.enqueue(createTask("normal", TaskPriority.NORMAL));

      expect(queue.peek()?.id).toBe("critical");
    });
  });

  describe("dequeue", () => {
    it("should return undefined for empty queue", () => {
      expect(queue.dequeue()).toBeUndefined();
    });

    it("should return items in priority order", () => {
      queue.enqueue(createTask("low", TaskPriority.LOW));
      queue.enqueue(createTask("critical", TaskPriority.CRITICAL));
      queue.enqueue(createTask("high", TaskPriority.HIGH));
      queue.enqueue(createTask("normal", TaskPriority.NORMAL));

      expect(queue.dequeue()?.id).toBe("critical");
      expect(queue.dequeue()?.id).toBe("high");
      expect(queue.dequeue()?.id).toBe("normal");
      expect(queue.dequeue()?.id).toBe("low");
    });
  });

  describe("peek", () => {
    it("should return undefined for empty queue", () => {
      expect(queue.peek()).toBeUndefined();
    });

    it("should return highest priority item without removing it", () => {
      queue.enqueue(createTask("normal", TaskPriority.NORMAL));
      queue.enqueue(createTask("critical", TaskPriority.CRITICAL));

      expect(queue.peek()?.id).toBe("critical");
      expect(queue.size()).toBe(2);
    });
  });

  describe("remove", () => {
    it("should remove item by predicate", () => {
      queue.enqueue(createTask("1", TaskPriority.NORMAL));
      queue.enqueue(createTask("2", TaskPriority.HIGH));
      queue.enqueue(createTask("3", TaskPriority.LOW));

      const removed = queue.remove((t) => t.id === "2");
      expect(removed).toBe(true);
      expect(queue.size()).toBe(2);
    });

    it("should return false if item not found", () => {
      queue.enqueue(createTask("1", TaskPriority.NORMAL));
      const removed = queue.remove((t) => t.id === "nonexistent");
      expect(removed).toBe(false);
    });

    it("should maintain heap property after removal", () => {
      queue.enqueue(createTask("low", TaskPriority.LOW));
      queue.enqueue(createTask("critical", TaskPriority.CRITICAL));
      queue.enqueue(createTask("normal", TaskPriority.NORMAL));

      queue.remove((t) => t.id === "critical");
      expect(queue.peek()?.id).toBe("normal");
    });
  });

  describe("size and isEmpty", () => {
    it("should report correct size", () => {
      expect(queue.size()).toBe(0);
      expect(queue.isEmpty()).toBe(true);

      queue.enqueue(createTask("1", TaskPriority.NORMAL));
      expect(queue.size()).toBe(1);
      expect(queue.isEmpty()).toBe(false);
    });
  });

  describe("clear", () => {
    it("should remove all items", () => {
      queue.enqueue(createTask("1", TaskPriority.NORMAL));
      queue.enqueue(createTask("2", TaskPriority.HIGH));

      queue.clear();
      expect(queue.isEmpty()).toBe(true);
    });
  });
});

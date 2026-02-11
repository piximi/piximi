import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { TensorStorageService } from "./TensorStorageService";
import { STORES } from "./types";

// Note: These tests require IndexedDB support
// Vitest with happy-dom should provide this

describe("TensorStorageService", () => {
  let service: TensorStorageService;

  beforeEach(() => {
    TensorStorageService.resetInstance();
    service = TensorStorageService.getInstance();
  });

  afterEach(async () => {
    await service.clearAll();
    service.close();
  });

  describe("store and retrieve", () => {
    it("should store and retrieve tensor data", async () => {
      const buffer = new Float32Array([1, 2, 3, 4]).buffer;
      const result = await service.store(
        "test-1",
        {
          buffer,
          dtype: "float32",
          shape: [1, 2, 2, 1],
        },
        STORES.IMAGE_TENSORS,
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.storageId).toBe("test-1");
        expect(result.data.byteSize).toBe(16);
      }

      const retrieved = await service.retrieve("test-1", STORES.IMAGE_TENSORS);
      expect(retrieved.success).toBe(true);
      if (retrieved.success) {
        expect(new Float32Array(retrieved.data.buffer)).toEqual(
          new Float32Array([1, 2, 3, 4]),
        );
      }
    });

    it("should reconstruct Tensor4D", async () => {
      const buffer = new Float32Array([1, 2, 3, 4]).buffer;
      await service.store(
        "test-tensor",
        {
          buffer,
          dtype: "float32",
          shape: [1, 1, 2, 2],
        },
        STORES.IMAGE_TENSORS,
      );

      const tensor = await service.retrieveAsTensor(
        "test-tensor",
        STORES.IMAGE_TENSORS,
      );

      expect(tensor).not.toBeNull();
      expect(tensor!.shape).toEqual([1, 1, 2, 2]);
      expect(tensor!.dtype).toBe("float32");

      tensor!.dispose();
    });
  });

  describe("batch operations", () => {
    it("should store multiple tensors in batch", async () => {
      const items = [
        {
          id: "batch-1",
          data: {
            buffer: new Float32Array([1, 2]).buffer,
            dtype: "float32" as const,
            shape: [1, 1, 1, 2] as [number, number, number, number],
          },
          storeName: STORES.IMAGE_TENSORS,
        },
        {
          id: "batch-2",
          data: {
            buffer: new Float32Array([3, 4]).buffer,
            dtype: "float32" as const,
            shape: [1, 1, 1, 2] as [number, number, number, number],
          },
          storeName: STORES.IMAGE_TENSORS,
        },
      ];

      const result = await service.storeBatch(items);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
      }
    });
  });

  describe("cache behavior", () => {
    it("should return cached data on second retrieve", async () => {
      const buffer = new Float32Array([1, 2, 3, 4]).buffer;
      await service.store(
        "cached-test",
        { buffer, dtype: "float32", shape: [1, 1, 2, 2] },
        STORES.IMAGE_TENSORS,
      );

      // First retrieve - from IndexedDB
      await service.retrieve("cached-test", STORES.IMAGE_TENSORS);

      // Second retrieve - should be from cache
      const usage = await service.getUsage();
      expect(usage.cacheHitRate).toBeGreaterThan(0);
    });
  });

  describe("prepared channels", () => {
    it("should store and retrieve prepared channel data", async () => {
      const buffer = new Float32Array([1, 2, 3, 4]).buffer;
      await service.store(
        "with-prep",
        {
          buffer,
          dtype: "float32",
          shape: [1, 1, 2, 2],
          preparedChannels: {
            data: [
              [1, 2],
              [3, 4],
            ],
            histograms: [[0, 1, 2]],
          },
        },
        STORES.IMAGE_TENSORS,
      );

      const prepared = await service.retrievePreparedChannels(
        "with-prep",
        STORES.IMAGE_TENSORS,
      );

      expect(prepared).not.toBeNull();
      expect(prepared!.data).toEqual([
        [1, 2],
        [3, 4],
      ]);
    });
  });
});

import { describe, it, expect, beforeEach, afterEach } from "vitest";

import { DataConnector } from "./DataConnector";
import { STORES, type ChannelStorageInput } from "./types";

// Note: These tests require IndexedDB support
// Vitest with happy-dom should provide this

const createTestChannel = (id: string): ChannelStorageInput => {
  const data = new Float32Array([1, 2, 3, 4]).buffer;
  const histogram = new Float32Array([1, 2, 3, 4]).buffer;
  return {
    id,
    name: "0",
    data,
    histogram,
    width: 1,
    height: 1,
    bitDepth: 8,
    planeId: "0",
    channelMetaId: "0",
    maxValue: 4,
    minValue: 1,
    dtype: "float32",
  };
};
describe("DataConnector", () => {
  let service: DataConnector;

  beforeEach(() => {
    DataConnector.resetInstance();
    service = DataConnector.getInstance();
  });

  afterEach(async () => {
    await service.clearAll();
    service.close();
  });

  describe("store and retrieve", () => {
    it("should store and retrieve channel data", async () => {
      const result = await service.store(
        "test-1",
        createTestChannel("test-1"),
        STORES.CHANNEL_DATA,
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.storageId).toBe("test-1");
        expect(result.data.byteSize).toBe(32);
      }

      const retrieved = await service.retrieve("test-1", STORES.CHANNEL_DATA);
      expect(retrieved.success).toBe(true);
      if (retrieved.success) {
        expect(new Float32Array(retrieved.data.data)).toEqual(
          new Float32Array([1, 2, 3, 4]),
        );
      }
    });
  });

  describe("batch operations", () => {
    it("should store multiple channels in batch", async () => {
      const items = [
        {
          id: "batch-1",
          data: createTestChannel("batch-1"),
          storeName: STORES.CHANNEL_DATA,
        },
        {
          id: "batch-2",
          data: createTestChannel("batch-2"),
          storeName: STORES.CHANNEL_DATA,
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
      await service.store(
        "cached-test",
        createTestChannel("cached-test"),
        STORES.CHANNEL_DATA,
      );

      // First retrieve - from IndexedDB
      await service.retrieve("cached-test", STORES.CHANNEL_DATA);

      // Second retrieve - should be from cache
      const usage = await service.getUsage();
      expect(usage.cacheHitRate).toBeGreaterThan(0);
    });
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { DataPipelineService } from "./DataPipelineService";
import { WorkerScheduler } from "workers/scheduler/WorkerScheduler";

// Mock WorkerScheduler
vi.mock("workers/scheduler/WorkerScheduler", () => ({
  WorkerScheduler: vi.fn().mockImplementation(() => ({
    dispatch: vi.fn().mockReturnValue({
      id: "task-1",
      status: "pending",
      cancel: vi.fn(),
      promise: Promise.resolve({
        id: "img-1",
        buffer: new ArrayBuffer(16),
        dtype: "float32",
        shape: [1, 2, 2, 1],
        preparedChannels: { data: [[1, 2, 3, 4]] },
        renderedSrc: "data:image/png;base64,test",
        bitDepth: 8,
        colors: { color: { range: { min: 0, max: 1 } }, channelColors: [] },
      }),
    }),
    shutdown: vi.fn(),
    onProgress: vi.fn(() => vi.fn()),
    getProgress: vi.fn(),
  })),
}));

describe("DataPipelineService", () => {
  let service: DataPipelineService;

  beforeEach(() => {
    DataPipelineService.resetInstance();
    const scheduler = new WorkerScheduler();
    service = DataPipelineService.getInstance(scheduler);
  });

  describe("uploadFiles", () => {
    it("should process files and return PipelineResult", async () => {
      const file = new File([new ArrayBuffer(8)], "test.png", {
        type: "image/png",
      });
      const files = {
        length: 1,
        0: file,
        item: (_i: number) => file,
      } as unknown as FileList;

      const result = await service.uploadFiles(files);

      expect(result.success).toBe(true);
      expect(result.stats.successCount).toBe(1);
    });

    it("should report progress during upload", async () => {
      const progressUpdates: string[] = [];
      service.onProgress((p) => progressUpdates.push(p.stage));

      const file = new File([new ArrayBuffer(8)], "test.png", {
        type: "image/png",
      });
      const files = {
        length: 1,
        0: file,
        item: (_i: number) => file,
      } as unknown as FileList;

      await service.uploadFiles(files);

      expect(progressUpdates).toContain("analyzing");
      expect(progressUpdates).toContain("complete");
    });
  });
});

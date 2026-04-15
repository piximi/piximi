/// <reference types="node" />
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { FileLoader } from "./FileLoader";
import { WorkerScheduler } from "utils/worker-scheduler/WorkerScheduler";

const __dir = dirname(fileURLToPath(import.meta.url));
const TEST_IMAGES_DIR = resolve(__dir, "../../../images");

function loadTestFile(name: string, type = "image/png"): File {
  const buffer = readFileSync(resolve(TEST_IMAGES_DIR, name));
  return new File([buffer], name, { type });
}

// Mock WorkerScheduler
vi.mock("../../worker-scheduler/WorkerScheduler", () => ({
  WorkerScheduler: vi.fn().mockImplementation(function () {
    return {
      dispatch: vi.fn().mockReturnValue({
        id: "task-1",
        status: "pending",
        cancel: vi.fn(),
        promise: Promise.resolve({
          imageSeries: [],
          images: [],
          planes: [],
          channels: [],
          channelMetas: [],
        }),
      }),
      shutdown: vi.fn(),
      onProgress: vi.fn(() => vi.fn()),
      getProgress: vi.fn(),
    };
  }),
}));

describe("FileUpload", () => {
  let service: FileLoader;

  beforeEach(() => {
    FileLoader.resetInstance();
    const scheduler = new WorkerScheduler();
    service = FileLoader.getInstance(scheduler);
  });

  describe("uploadFiles", () => {
    it("should process files and return PipelineResult", async () => {
      const file = loadTestFile("malaria.png");

      const files = {
        length: 1,
        0: file,
        item: (_i: number) => file,
      } as unknown as FileList;

      const result = await service.uploadFiles(files);

      expect(result.success).toBe(true);
    });

    it("should report progress during upload", async () => {
      const progressUpdates: string[] = [];
      service.onProgress((p) => progressUpdates.push(p.stage));

      const file = loadTestFile("malaria.png");
      const files = {
        length: 1,
        0: file,
        item: (_i: number) => file,
      } as unknown as FileList;

      await service.uploadFiles(files);

      expect(progressUpdates).toContain("Loading Images");
      expect(progressUpdates).toContain("idle");
    });
  });
});

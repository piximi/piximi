import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { DataConnector } from "utils/data-connector";
import { Partition } from "utils/dl/enums";

import { FileLoader } from "./FileLoader";
import { MIME, FILE } from "./types";

import type {
  FileInterpretationResult,
  LoadAndPrepareOutput,
  MimeType,
  TiffImportConfig,
} from "./types";

// ============================================================
// Module mocks
// ============================================================

// The worker is mocked at the Comlink boundary. `mockLoadImage` is the stand-in
// for the worker's `loadImage`; every `Comlink.wrap()` call returns an object
// that delegates to it, so tests control the worker's output/behaviour directly.
const { mockLoadImage } = vi.hoisted(() => ({ mockLoadImage: vi.fn() }));

vi.mock("comlink", () => ({
  wrap: () => ({ loadImage: mockLoadImage }),
  // FileLoader wraps the progress callback in Comlink.proxy(...) — pass it through.
  proxy: (fn: unknown) => fn,
}));

// FileLoader constructs `new Worker(new URL(...), { type: "module" })`; the mock
// ignores those args entirely and only needs to satisfy the calls FileLoader makes
// (it calls `worker.terminate()` after each task).
class MockWorker {
  postMessage = vi.fn();
  terminate = vi.fn();
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
}
vi.stubGlobal(
  "Worker",
  vi.fn(() => new MockWorker()),
);

// ============================================================
// Fixtures / helpers
// ============================================================

// The worker is mocked, so the file's bytes are irrelevant — a tiny synthetic
// File is enough to exercise FileLoader's orchestration.
const makeFile = (name = "test.png", type: string = MIME.PNG): File =>
  new File([new Uint8Array([1, 2, 3, 4])], name, { type });

const makeFileList = (...files: File[]): FileList =>
  ({
    length: files.length,
    item: (i: number) => files[i] ?? null,
    ...Object.fromEntries(files.map((f, i) => [i, f])),
  }) as unknown as FileList;

// FileLoader only reads `fileResults[file.name].mimeType`, so the interpretation
// must be keyed by the exact File.name.
const makeInterpretation = (
  files: File[],
  mimeType: MimeType = MIME.PNG,
): FileInterpretationResult => ({
  imageType: FILE.BASIC,
  fileResults: Object.fromEntries(
    files.map((f) => [
      f.name,
      {
        fileName: f.name,
        fileSize: f.size,
        mimeType,
        imageType: FILE.BASIC,
      },
    ]),
  ),
});

// A worker result. `channels` drives the same-channel-count check in
// processImages; `withImage: false` produces the "no images" case. The single
// channel carries real ArrayBuffers so the (unmocked) DataConnector.storeBatch
// succeeds and attaches a storageReference.
const makeOutput = (
  opts: { channels?: number; withImage?: boolean; id?: string } = {},
): LoadAndPrepareOutput => {
  const { channels = 1, withImage = true, id = "image-1" } = opts;
  const shape = { planes: 1, height: 2, width: 2, channels };
  return {
    imageSeries: [
      {
        id: `series-${id}`,
        name: "series",
        bitDepth: 8,
        shape,
        timeSeries: false,
        activeImageId: id,
      },
    ],
    images: withImage
      ? [
          {
            id,
            name: "test.png",
            seriesId: `series-${id}`,
            shape,
            categoryId: "cat-1",
            activePlaneId: `plane-${id}`,
            timepoint: 0,
            bitDepth: 8,
            partition: Partition.Unassigned,
          },
        ]
      : [],
    planes: [{ id: `plane-${id}`, imageId: id, zIndex: 0 }],
    channels: [
      {
        id: `channel-${id}`,
        planeId: `plane-${id}`,
        channelMetaId: `meta-${id}`,
        name: "channel",
        dtype: "uint8",
        bitDepth: 8,
        width: 2,
        height: 2,
        maxValue: 255,
        minValue: 0,
        data: new Uint8Array([0, 1, 2, 3]).buffer,
        histogram: new Uint8Array([0, 0, 0, 0]).buffer,
      },
    ],
    channelMetas: [
      {
        id: `meta-${id}`,
        name: "channel",
        bitDepth: 8,
        colorMap: [255, 255, 255],
        visible: true,
        minValue: 0,
        maxValue: 255,
        rampMin: 0,
        rampMax: 255,
        rampMinLimit: 0,
        rampMaxLimit: 255,
      },
    ],
  };
};

// ============================================================
// Tests
// ============================================================

describe("FileLoader", () => {
  let service: FileLoader;

  beforeEach(() => {
    // FileLoader's constructor re-creates the singleton via getInstance().
    DataConnector.resetInstance();
    mockLoadImage.mockReset();
    mockLoadImage.mockResolvedValue(makeOutput({ channels: 1 }));
  });

  afterEach(async () => {
    await DataConnector.getInstance().clearAll();
    DataConnector.resetInstance();
  });

  describe("uploadFiles — success", () => {
    it("returns success with prepared, storage-backed data", async () => {
      const file = makeFile("test.png");
      service = new FileLoader(makeInterpretation([file]));

      const result = await service.uploadFiles(makeFileList(file));

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.cancelled).toBe(false);
      expect(result.data).toHaveLength(1);

      const [fileResult] = result.data;
      expect(fileResult.fileName).toBe("test.png");
      expect(fileResult.imageSeries).toHaveLength(1);
      expect(fileResult.images).toHaveLength(1);
      expect(fileResult.planes).toHaveLength(1);
      expect(fileResult.channelMetas).toHaveLength(1);
      expect(fileResult.channels).toHaveLength(1);
    });

    it("attaches a storage reference to each returned channel", async () => {
      const file = makeFile();
      service = new FileLoader(makeInterpretation([file]));

      const result = await service.uploadFiles(makeFileList(file));

      expect(result.success).toBe(true);
      if (!result.success) return;

      const channel = result.data[0].channels[0];
      expect(channel.storageReference).toBeDefined();
      expect(channel.storageReference.storageId).toBe(channel.id);
      // The raw buffers are stripped from the Redux-facing channel.
      expect("data" in channel).toBe(false);
      expect("histogram" in channel).toBe(false);
    });

    it("forwards the interpreted mimeType to the worker", async () => {
      const file = makeFile("scan.tif", MIME.TIFF);
      service = new FileLoader(makeInterpretation([file], MIME.TIFF));

      await service.uploadFiles(makeFileList(file));

      expect(mockLoadImage).toHaveBeenCalledTimes(1);
      const [payload] = mockLoadImage.mock.calls[0];
      expect(payload.mimeType).toBe(MIME.TIFF);
      expect(payload.fileName).toBe("scan.tif");
    });
  });

  describe("uploadFiles — progress", () => {
    it("reports the 'Loading Images' stage and settles at 'idle'", async () => {
      const file = makeFile();
      service = new FileLoader(makeInterpretation([file]));

      const stages: string[] = [];
      service.onProgress((p) => stages.push(p.stage));

      await service.uploadFiles(makeFileList(file));

      expect(stages).toContain("Loading Images");
      expect(stages.at(-1)).toBe("idle");
    });

    it("exposes 'idle' status after a successful upload", async () => {
      const file = makeFile();
      service = new FileLoader(makeInterpretation([file]));

      await service.uploadFiles(makeFileList(file));

      expect(service.getStatus()).toBe("idle");
      expect(service.getProgress().stage).toBe("idle");
    });
  });

  describe("uploadFiles — failure", () => {
    it("returns a failure result when every worker task rejects", async () => {
      mockLoadImage.mockReset();
      mockLoadImage.mockRejectedValue(new Error("decode failed"));

      const file = makeFile();
      service = new FileLoader(makeInterpretation([file]));

      const result = await service.uploadFiles(makeFileList(file));

      expect(result.success).toBe(false);
      if (result.success || result.cancelled)
        throw new Error("expected failure");
      expect(result.error.message).toContain("decode failed");
      expect(service.getStatus()).toBe("error");
    });

    it("fails when images across files have different channel counts", async () => {
      mockLoadImage.mockReset();
      mockLoadImage
        .mockResolvedValueOnce(makeOutput({ channels: 1, id: "image-a" }))
        .mockResolvedValueOnce(makeOutput({ channels: 3, id: "image-b" }));

      const fileA = makeFile("a.png");
      const fileB = makeFile("b.png");
      service = new FileLoader(makeInterpretation([fileA, fileB]));

      const result = await service.uploadFiles(makeFileList(fileA, fileB));

      expect(result.success).toBe(false);
      if (result.success || result.cancelled)
        throw new Error("expected failure");
      expect(result.error.message).toMatch(/same number of channels/);
    });

    it("fails when no images are produced", async () => {
      mockLoadImage.mockReset();
      mockLoadImage.mockResolvedValue(makeOutput({ withImage: false }));

      const file = makeFile();
      service = new FileLoader(makeInterpretation([file]));

      const result = await service.uploadFiles(makeFileList(file));

      expect(result.success).toBe(false);
      if (result.success || result.cancelled)
        throw new Error("expected failure");
      expect(result.error.message).toMatch(/same number of channels/);
    });
  });

  describe("dispatch wiring", () => {
    it("uses cachedBuffers and forwards dimConfig without reading the file", async () => {
      const file = makeFile("scan.tif", MIME.TIFF);
      const cached = new Uint8Array([9, 9, 9]).buffer;
      const cachedBuffers = new Map([[file.name, cached]]);
      const dimConfig: TiffImportConfig = {
        dimensionOrder: "xyczt",
        channels: 1,
        slices: 1,
        frames: 1,
      };
      const tiffConfigs = new Map([[file.name, dimConfig]]);
      const arrayBufferSpy = vi.spyOn(file, "arrayBuffer");

      service = new FileLoader(
        makeInterpretation([file], MIME.TIFF),
        tiffConfigs,
        cachedBuffers,
      );

      await service.uploadFiles(makeFileList(file));

      // cachedBuffers short-circuits `file.arrayBuffer()`.
      expect(arrayBufferSpy).not.toHaveBeenCalled();
      const [payload] = mockLoadImage.mock.calls[0];
      expect(payload.fileData).toBe(cached);
      expect(payload.dimConfig).toEqual(dimConfig);
    });
  });
});

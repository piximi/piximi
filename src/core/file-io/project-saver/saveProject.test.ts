import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clean, gte, lt } from "semver";
import JSZip from "jszip";
import { group } from "zarr";

import type { ClassifierState } from "store/classifier/types";
import type {
  AnnotationObject,
  AnnotationVolume,
  Category,
  Channel,
  ChannelMeta,
  DataStateV2,
  ImageObject,
  ImageSeries,
  Kind,
  Plane,
} from "store/data/types";
import {
  CropSchema,
  LossFunction,
  Metric,
  OptimizationAlgorithm,
  Partition,
} from "core/dl/enums";
import { ModelArch } from "core/dl/classification/types";

import { MODEL_JSON_FILENAME, MODEL_WEIGHTS_FILENAME } from "../consts";
import { PiximiStore, ZipStore } from "../zarr/stores";
import { readV2 } from "../project-loader/version-readers/readV2";
import { loadProject } from "../project-loader/loadProject";
import { writeV2 } from "./version-writers/writeV2";

import type { SerializedModels } from "core/dl/types";
import type { ModelInfo, Run } from "core/dl/classification/types";
import type { ChannelDataAccessor, SerializableProject } from "./types";
import type { EntityState } from "@reduxjs/toolkit";

// ============================================================
// Fixture
// ============================================================

const asEntityState = <T extends { id: string }>(
  items: T[],
): EntityState<T, string> => ({
  ids: items.map((i) => i.id),
  entities: Object.fromEntries(items.map((i) => [i.id, i])),
});

/** Deterministic pixel values so byte equality is meaningful. */
const pixelsFor = (channelId: string, size: number, bitDepth: 8 | 16) => {
  const seed = channelId.charCodeAt(channelId.length - 1);
  const view = bitDepth === 8 ? new Uint8Array(size) : new Uint16Array(size);
  for (let i = 0; i < size; i++) {
    view[i] = (i * 7 + seed) % (bitDepth === 8 ? 256 : 65536);
  }
  return view;
};

const histogramFor = (channelId: string) => {
  const seed = channelId.charCodeAt(channelId.length - 1);
  return Uint32Array.from({ length: 16 }, (_, i) => i * 3 + seed);
};

/**
 * Two images: one 8-bit single-plane 2-channel, one 16-bit two-plane
 * 1-channel. Annotations across two kinds, on two different planes.
 */
const buildFixture = () => {
  const imageSeries: ImageSeries[] = [
    {
      id: "series-1",
      experimentId: "exp-1",
      name: "series one",
      bitDepth: 8,
      shape: { planes: 1, height: 4, width: 3, channels: 2 },
      timeSeries: false,
      activeImageId: "image-1",
    },
    {
      id: "series-2",
      experimentId: "exp-1",
      name: "series two",
      bitDepth: 16,
      shape: { planes: 2, height: 2, width: 2, channels: 1 },
      timeSeries: true,
      activeImageId: "image-2",
    },
  ];

  const images: ImageObject[] = [
    {
      id: "image-1",
      name: "first.png",
      seriesId: "series-1",
      shape: { planes: 1, height: 4, width: 3, channels: 2 },
      categoryId: "cat-image-a",
      activePlaneId: "plane-1",
      timepoint: 0,
      bitDepth: 8,
      partition: Partition.Training,
      // Exercises the optional prediction columns.
      predictionConfidence: 0.87,
      predictedAtRunId: "run-1",
      predictionCorrected: {
        correctedFromRunId: "run-1",
        predictedCategoryId: "cat-image-b",
        predictionConfidence: 0.42,
        correctedAt: "2026-01-02T03:04:05.000Z",
      },
    },
    {
      id: "image-2",
      name: "second.tif",
      seriesId: "series-2",
      shape: { planes: 2, height: 2, width: 2, channels: 1 },
      categoryId: "cat-image-b",
      activePlaneId: "plane-2",
      timepoint: 3,
      bitDepth: 16,
      partition: Partition.Inference,
    },
  ];

  const planes: Plane[] = [
    { id: "plane-1", imageId: "image-1", zIndex: 0 },
    { id: "plane-2", imageId: "image-2", zIndex: 0 },
    { id: "plane-3", imageId: "image-2", zIndex: 1 },
  ];

  const channelMetas: ChannelMeta[] = [
    {
      id: "meta-1",
      name: "red",
      bitDepth: 8,
      colorMap: [255, 0, 0],
      visible: true,
      minValue: 0,
      maxValue: 255,
      rampMin: 10,
      rampMax: 240,
      rampMinLimit: 0,
      rampMaxLimit: 255,
    },
    {
      id: "meta-2",
      name: "green",
      bitDepth: 8,
      colorMap: [0, 255, 0],
      visible: false,
      minValue: 0,
      maxValue: 255,
      rampMin: 5,
      rampMax: 250,
      rampMinLimit: 0,
      rampMaxLimit: 255,
    },
    {
      id: "meta-3",
      name: "gray",
      bitDepth: 16,
      colorMap: [255, 255, 255],
      visible: true,
      minValue: 0,
      maxValue: 65535,
      rampMin: 100,
      rampMax: 60000,
      rampMinLimit: 0,
      rampMaxLimit: 65535,
    },
  ];

  const channels: Channel[] = [
    {
      id: "channel-1",
      planeId: "plane-1",
      channelMetaId: "meta-1",
      name: "red",
      dtype: "uint8",
      storageReference: {
        storageId: "channel-1",
        storeName: "channel-data",
        width: 3,
        height: 4,
        dtype: "uint8",
        byteSize: 12,
      },
      bitDepth: 8,
      width: 3,
      height: 4,
      minValue: 0,
      maxValue: 255,
      // Exercises the optional statistics columns being partially populated.
      mean: 12.5,
      median: 11,
    },
    {
      id: "channel-2",
      planeId: "plane-1",
      channelMetaId: "meta-2",
      name: "green",
      dtype: "uint8",
      storageReference: {
        storageId: "channel-2",
        storeName: "channel-data",
        width: 3,
        height: 4,
        dtype: "uint8",
        byteSize: 12,
      },
      bitDepth: 8,
      width: 3,
      height: 4,
      minValue: 0,
      maxValue: 255,
    },
    {
      id: "channel-3",
      planeId: "plane-2",
      channelMetaId: "meta-3",
      name: "gray",
      dtype: "uint8",
      storageReference: {
        storageId: "channel-3",
        storeName: "channel-data",
        width: 2,
        height: 2,
        dtype: "uint8",
        byteSize: 8,
      },
      bitDepth: 16,
      width: 2,
      height: 2,
      minValue: 0,
      maxValue: 65535,
    },
    {
      id: "channel-4",
      planeId: "plane-3",
      channelMetaId: "meta-3",
      name: "gray",
      dtype: "uint8",
      storageReference: {
        storageId: "channel-4",
        storeName: "channel-data",
        width: 2,
        height: 2,
        dtype: "uint8",
        byteSize: 8,
      },
      bitDepth: 16,
      width: 2,
      height: 2,
      minValue: 0,
      maxValue: 65535,
    },
  ];

  const kinds: Kind[] = [
    { id: "Image", name: "Image", unknownCategoryId: "cat-image-unknown" },
    { id: "cell", name: "cell", unknownCategoryId: "cat-cell-unknown" },
    {
      id: "nucleus",
      name: "nucleus",
      unknownCategoryId: "cat-nucleus-unknown",
    },
  ];

  const categories: Category[] = [
    {
      id: "cat-image-unknown",
      name: "Unknown",
      color: "#AAAAAA",
      isUnknown: true,
      type: "image",
    },
    {
      id: "cat-image-a",
      name: "positive",
      color: "#FF0000",
      isUnknown: false,
      type: "image",
    },
    {
      id: "cat-image-b",
      name: "negative",
      color: "#00FF00",
      isUnknown: false,
      type: "image",
    },
    {
      id: "cat-cell-unknown",
      name: "Unknown",
      color: "#AAAAAA",
      isUnknown: true,
      type: "annotation",
      kindId: "cell",
    },
    {
      id: "cat-cell-a",
      name: "alive",
      color: "#0000FF",
      isUnknown: false,
      type: "annotation",
      kindId: "cell",
    },
    {
      id: "cat-nucleus-unknown",
      name: "Unknown",
      color: "#AAAAAA",
      isUnknown: true,
      type: "annotation",
      kindId: "nucleus",
    },
  ];

  const annotationVolumes: AnnotationVolume[] = [
    {
      id: "volume-1",
      imageId: "image-1",
      kindId: "cell",
      categoryId: "cat-cell-a",
      timepoint: 0,
      predictionConfidence: 0.55,
      predictedAtRunId: "run-1",
    },
    {
      id: "volume-2",
      imageId: "image-2",
      kindId: "nucleus",
      categoryId: "cat-nucleus-unknown",
    },
  ];

  const annotations: AnnotationObject[] = [
    {
      id: "annotation-1",
      planeId: "plane-1",
      imageId: "image-1",
      volumeId: "volume-1",
      partition: Partition.Training,
      shape: { planes: 1, height: 4, width: 3, channels: 2 },
      boundingBox: [0, 0, 2, 2],
      encodedMask: [0, 2, 1, 1],
    },
    {
      id: "annotation-2",
      planeId: "plane-2",
      imageId: "image-2",
      volumeId: "volume-2",
      partition: Partition.Unassigned,
      shape: { planes: 2, height: 2, width: 2, channels: 1 },
      boundingBox: [0, 0, 2, 2],
      // Different length from the first — exercises the ragged mask offsets.
      encodedMask: [1, 3],
    },
    {
      id: "annotation-3",
      planeId: "plane-3",
      imageId: "image-2",
      volumeId: "volume-2",
      partition: Partition.Validation,
      shape: { planes: 2, height: 2, width: 2, channels: 1 },
      boundingBox: [1, 1, 2, 2],
      encodedMask: [0, 1, 2, 1, 3],
    },
  ];

  const data: DataStateV2 = {
    experiment: { id: "exp-1", name: "test experiment", channels: 2 },
    imageSeries: asEntityState(imageSeries),
    images: asEntityState(images),
    planes: asEntityState(planes),
    kinds: asEntityState(kinds),
    categories: asEntityState(categories),
    channels: asEntityState(channels),
    channelMetas: asEntityState(channelMetas),
    annotationVolumes: asEntityState(annotationVolumes),
    annotations: asEntityState(annotations),
  };

  const run: Run = {
    id: "run-1",
    startedAt: "2026-01-01T00:00:00.000Z",
    finishedAt: "2026-01-01T00:05:00.000Z",
    status: "completed",
    trigger: "fresh",
    seed: 1234,
    appVersion: "1.1.4",
    tfjsVersion: "4.2.0",
    backend: "webgl",
    hyperparameters: {
      architecture: ModelArch.SIMPLE_CNN,
      optimizer: {
        epochs: 10,
        batchSize: 32,
        // Deliberately awkward: the v1.1 reader had to repair this value.
        learningRate: 0.0123456789,
        lossFunction: LossFunction.CategoricalCrossEntropy,
        metrics: [Metric.CategoricalAccuracy],
        optimizationAlgorithm: OptimizationAlgorithm.Adam,
      },
      preprocess: {
        // Larger than 255 in both dimensions — the v1.1 writer truncated these.
        inputShape: { planes: 1, height: 512, width: 300, channels: 2 },
        shuffle: true,
        normalizeOptions: { normalize: true, center: false },
        cropOptions: { numCrops: 1, cropSchema: CropSchema.None },
        trainingPercentage: 0.8,
      },
    },
    classMap: { 0: "cat-image-a", 1: "cat-image-b" },
    trainingFingerprint: "train-fp",
    validationFingerprint: "val-fp",
    valIds: ["image-2"],
    categorySetHash: "cat-hash",
    history: [
      { epoch: 0, loss: 0.9, valLoss: 1.1, accuracy: 0.4, valAccuracy: 0.35 },
      { epoch: 1, loss: 0.5, valLoss: 0.7, accuracy: 0.8, valAccuracy: 0.75 },
    ],
    evalResults: {
      confusionMatrix: [
        [5, 1],
        [2, 4],
      ],
      accuracy: 0.75,
      crossEntropy: 0.42,
      precision: 0.71,
      recall: 0.68,
      f1Score: 0.695,
    },
  };

  const modelInfo: ModelInfo = {
    classMap: { 0: "cat-image-a", 1: "cat-image-b" },
    preprocessSettings: run.hyperparameters.preprocess,
    optimizerSettings: run.hyperparameters.optimizer,
    confidenceThreshold: 0.5,
    runs: [run],
    valid: true,
    initSeed: 1234,
    trained: true,
  };

  const classifier: ClassifierState = {
    kindClassifiers: {
      Image: {
        modelTargetId: "Image",
        modelTargetName: "Image",
        activeModel: "SimpleCNN-1",
        newModelArch: ModelArch.SIMPLE_CNN,
        modelInfoDict: { "SimpleCNN-1": modelInfo },
        status: "idle",
      },
      cell: {
        modelTargetId: "cell",
        modelTargetName: "cell",
        // No model trained for this kind yet.
        activeModel: undefined,
        newModelArch: ModelArch.MOBILE_NET,
        modelInfoDict: {},
        status: "idle",
      },
    },
  };

  return { data, classifier } satisfies SerializableProject;
};

const channelAccessor: ChannelDataAccessor = async (channelIds) => {
  const buffers = new Map<
    string,
    { data: ArrayBuffer; histogram: ArrayBuffer }
  >();
  for (const id of channelIds) {
    const bitDepth = id === "channel-3" || id === "channel-4" ? 16 : 8;
    const size = bitDepth === 16 ? 4 : 12;
    buffers.set(id, {
      data: pixelsFor(id, size, bitDepth).buffer as ArrayBuffer,
      histogram: histogramFor(id).buffer as ArrayBuffer,
    });
  }
  return buffers;
};

/**
 * Stand-in for `getSavedModelData`, which stamps every model with the same
 * canonical filenames — the reason models need folders rather than renames.
 */
const fakeSerializedModel = (
  topology: string,
  weights: string,
): SerializedModels[string] => ({
  modelJson: {
    blob: new Blob([topology], { type: "application/json" }),
    fileName: MODEL_JSON_FILENAME,
  },
  modelWeights: {
    blob: new Blob([weights], { type: "application/octet-stream" }),
    fileName: MODEL_WEIGHTS_FILENAME,
  },
});

const writeFixture = async (name = "test-project") => {
  const fixture = buildFixture();
  const store = new PiximiStore(name);
  const root = await group(store, store.rootName);
  await writeV2(root, fixture, channelAccessor, () => {});
  return { fixture, store };
};

// ============================================================
// Tests
// ============================================================

// The file stamps `import.meta.env.VITE_APP_VERSION`, which the npm scripts
// supply from package.json but vitest does not. Pin it so these tests don't
// depend on how the runner was invoked.
beforeEach(() => {
  vi.stubEnv("VITE_APP_VERSION", "2.0.0");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("v2 project round trip", () => {
  it("preserves every entity collection", async () => {
    const { fixture, store } = await writeFixture();
    const result = await readV2(store, () => {});

    expect(result.data.experiment).toEqual(fixture.data.experiment);
    expect(result.data.imageSeries).toEqual(fixture.data.imageSeries);
    expect(result.data.images).toEqual(fixture.data.images);
    expect(result.data.planes).toEqual(fixture.data.planes);
    expect(result.data.kinds).toEqual(fixture.data.kinds);
    expect(result.data.categories).toEqual(fixture.data.categories);
    expect(result.data.channelMetas).toEqual(fixture.data.channelMetas);
    expect(result.data.annotationVolumes).toEqual(
      fixture.data.annotationVolumes,
    );
  });

  it("preserves channel pixel and histogram bytes exactly", async () => {
    const { fixture, store } = await writeFixture();
    const result = await readV2(store, () => {});

    for (const id of fixture.data.channels.ids) {
      const original = fixture.data.channels.entities[id]!;
      const restored = result.data.channels.entities[id]!;

      const expectedPixels = pixelsFor(
        id,
        original.bitDepth === 16 ? 4 : 12,
        original.bitDepth === 16 ? 16 : 8,
      );
      const restoredPixels =
        original.bitDepth === 8
          ? new Uint8Array(restored.data)
          : new Uint16Array(restored.data);

      expect(Array.from(restoredPixels)).toEqual(Array.from(expectedPixels));
      expect(Array.from(new Uint32Array(restored.histogram))).toEqual(
        Array.from(histogramFor(id)),
      );
    }
  });

  it("preserves channel metadata, including partially-populated statistics", async () => {
    const { fixture, store } = await writeFixture();
    const result = await readV2(store, () => {});

    for (const id of fixture.data.channels.ids) {
      const original = fixture.data.channels.entities[id]!;
      const restored = result.data.channels.entities[id]!;

      // `storageReference` is re-issued by ProjectLoader after the buffers land
      // in IndexedDB, so it's the one field the file deliberately drops.
      const { storageReference: _ref, ...expected } = original;
      const { data: _data, histogram: _hist, ...actual } = restored;

      expect(actual).toEqual(expected);
    }
  });

  it("preserves ragged annotation masks", async () => {
    const { fixture, store } = await writeFixture();
    const result = await readV2(store, () => {});

    expect(result.data.annotations.ids).toEqual(fixture.data.annotations.ids);
    for (const id of fixture.data.annotations.ids) {
      expect(result.data.annotations.entities[id]).toEqual(
        fixture.data.annotations.entities[id],
      );
    }
  });

  it("preserves classifier state, hyperparameters and run history", async () => {
    const { fixture, store } = await writeFixture();
    const result = await readV2(store, () => {});

    expect(result.classifier).toEqual(fixture.classifier);
  });

  it("does not truncate an input shape larger than 255", async () => {
    const { store } = await writeFixture();
    const result = await readV2(store, () => {});

    const run =
      result.classifier.kindClassifiers.Image.modelInfoDict["SimpleCNN-1"]
        .runs[0];
    expect(run.hyperparameters.preprocess.inputShape).toEqual({
      planes: 1,
      height: 512,
      width: 300,
      channels: 2,
    });
  });

  it("does not lose learning rate precision", async () => {
    const { store } = await writeFixture();
    const result = await readV2(store, () => {});

    const info =
      result.classifier.kindClassifiers.Image.modelInfoDict["SimpleCNN-1"];
    expect(info.optimizerSettings.learningRate).toBe(0.0123456789);
  });

  /**
   * The file stamps the app version, so package.json's version *is* the format
   * version. `detectVersion` sends anything below 1.2.0 to readV11 (which fails
   * with "key project not present") and anything from 3.0.0 up to "unsupported".
   * Bumping package.json across either boundary silently breaks reopening every
   * saved project, so assert the routing window rather than a literal.
   */
  it("stamps a version detectVersion routes to the v2 reader", async () => {
    const { store } = await writeFixture();
    const root = await group(store, store.rootName);
    const written = clean((await root.attrs.getItem("version")) as string);

    expect(written).not.toBeNull();
    expect(gte(written!, "1.2.0")).toBe(true);
    expect(lt(written!, "3.0.0")).toBe(true);
  });

  it("refuses to write an unversioned file", async () => {
    vi.stubEnv("VITE_APP_VERSION", "");
    const store = new PiximiStore("unversioned");
    const root = await group(store, store.rootName);

    // Silently omitting the attr would produce an archive nothing can reopen.
    await expect(
      writeV2(root, buildFixture(), channelAccessor, () => {}),
    ).rejects.toThrow(/VITE_APP_VERSION/);
  });

  it("handles a project with no annotations", async () => {
    const fixture = buildFixture();
    fixture.data.annotations = { ids: [], entities: {} };
    fixture.data.annotationVolumes = { ids: [], entities: {} };

    const store = new PiximiStore("empty-annotations");
    const root = await group(store, store.rootName);
    await writeV2(root, fixture, channelAccessor, () => {});

    const result = await readV2(store, () => {});
    expect(result.data.annotations.ids).toEqual([]);
    expect(result.data.annotationVolumes.ids).toEqual([]);
  });
});

describe("v2 project archive", () => {
  it("keeps the zarr root discoverable after a name with dots", async () => {
    // `createStoreFromZip` splits the root folder name on "." to recover it, so
    // an unsanitized name would produce an archive that can't be reopened.
    const store = new PiximiStore("my_v1.2_project".replace(/[./\\]/g, "_"));
    const root = await group(store, store.rootName);
    await writeV2(root, buildFixture(), channelAccessor, () => {});

    const blob = await store.zip.generateAsync({ type: "blob" });
    const reopened = await new JSZip().loadAsync(blob);
    const rootFolders = reopened.folder(/.*\.zarr\/$/);

    expect(rootFolders).toHaveLength(1);

    const rootName = rootFolders[0].name.split(".")[0];
    const result = await readV2(new ZipStore(rootName, reopened), () => {});
    expect(result.data.images.ids).toEqual(["image-1", "image-2"]);
  });

  /**
   * TF.js resolves weight files by basename against the `weightsManifest` baked
   * into the topology, which `Model.getSavedModelFiles` hardcodes to
   * `./model.weights.bin`. So each model needs its own folder — renaming files
   * to disambiguate them produces an archive TF.js refuses to load.
   */
  it("gives each model its own folder and preserves canonical basenames", async () => {
    const models: SerializedModels = {
      "SimpleCNN-1": fakeSerializedModel("topology-one", "weights-one"),
      // A dot in the name must not leak into the folder, or
      // `zip.folder(/.*\.zarr\/$/)` would see a second zarr root.
      "MobileNet.v2": fakeSerializedModel("topology-two", "weights-two"),
    };

    const store = new PiximiStore("with-models");
    const root = await group(store, store.rootName);
    await writeV2(root, buildFixture(), channelAccessor, () => {});
    store.attachModels(models);

    const blob = await store.zip.generateAsync({ type: "blob" });
    const file = new File([blob], "with-models.zip", {
      type: "application/zip",
    });
    const { modelFiles } = await loadProject(
      { files: [file] },
      { cancelled: false },
      () => {},
    );

    // Keyed by real model name, recovered from the manifest — not the folder.
    expect(Object.keys(modelFiles).sort()).toEqual([
      "MobileNet.v2",
      "SimpleCNN-1",
    ]);

    for (const modelName of Object.keys(models)) {
      const entry = modelFiles[modelName];
      expect(entry.modelJson!.name).toBe(MODEL_JSON_FILENAME);
      expect(entry.modelWeights!.name).toBe(MODEL_WEIGHTS_FILENAME);
    }

    // Contents didn't cross over, i.e. one model didn't overwrite the other.
    expect(await modelFiles["SimpleCNN-1"].modelJson!.text()).toBe(
      "topology-one",
    );
    expect(await modelFiles["MobileNet.v2"].modelWeights!.text()).toBe(
      "weights-two",
    );
  });

  it("still reads legacy archives that carry no model manifest", async () => {
    const store = new PiximiStore("legacy-models");
    const root = await group(store, store.rootName);
    await writeV2(root, buildFixture(), channelAccessor, () => {});
    // Pre-manifest layout: files at the archive root, named after the model.
    store.zip.file("LegacyModel.json", "legacy-topology");
    store.zip.file("LegacyModel.weights.bin", "legacy-weights");

    const blob = await store.zip.generateAsync({ type: "blob" });
    const { modelFiles } = await loadProject(
      {
        files: [
          new File([blob], "legacy-models.zip", { type: "application/zip" }),
        ],
      },
      { cancelled: false },
      () => {},
    );

    expect(Object.keys(modelFiles)).toEqual(["LegacyModel"]);
    expect(await modelFiles["LegacyModel"].modelJson!.text()).toBe(
      "legacy-topology",
    );
  });

  /**
   * The tests above call `readV2` directly, which skips `detectVersion` — the
   * step that decides which reader runs at all. A saved file whose `version`
   * attr routes to the wrong reader passes every one of them and still fails
   * the moment a user opens it. This drives the real entry point instead.
   */
  it("routes a saved archive back through loadProject to the v2 reader", async () => {
    const store = new PiximiStore("round-trip");
    const root = await group(store, store.rootName);
    await writeV2(root, buildFixture(), channelAccessor, () => {});

    const blob = await store.zip.generateAsync({ type: "blob" });
    const file = new File([blob], "round-trip.zip", {
      type: "application/zip",
    });

    const { project } = await loadProject(
      { files: [file] },
      { cancelled: false },
      () => {},
    );

    expect(project.data.images.ids).toEqual(["image-1", "image-2"]);
    expect(project.data.annotations.ids).toHaveLength(3);
    expect(
      project.classifier.kindClassifiers.Image.modelInfoDict["SimpleCNN-1"]
        .runs,
    ).toHaveLength(1);
  });
});

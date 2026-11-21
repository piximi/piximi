import { describe, expect, it } from "vitest";
import { configureStore } from "@reduxjs/toolkit";

import { DataConnector } from "core/data-connector";
import {
  STORES,
  UNKNOWN_IMAGE_CATEGORY,
  UNKNOWN_KIND,
  UNKNOWN_KIND_CATEGORY,
  generateUUID,
} from "core/entities";
import { ModelTask, Partition } from "core/dl/enums";
import { CHANNEL_MODE } from "core/dl/segmentation/optionUtils";
import { OUTPUT_MODE } from "core/dl/segmentation/models/consts";
import { getDefaultModelParams } from "core/dl/classification/utils";

import { appTasksSlice } from "store/appTasks/appTasksSlice";
import { classifierSlice } from "store/classifier";
import { IMAGE_CLASSIFIER_ID } from "store/classifier/constants";
import { dataSlice } from "store/data";

import { computeObjectFeatures } from "utils/measurements/computeObjectFeatures";
import { computeObjectIntensityMeasurements } from "utils/measurements/computeObjectIntensityMeasurements";

import { describeBackendConformance } from "../conformance/backendConformance";
import { BackendError } from "../errors";
import { connectBackendToStore } from "../sync/connectBackendToStore";
import { LocalBackend } from "./LocalBackend";
import { createMainThreadThumbnailRenderer } from "./thumbnails";

import type { Channel, ChannelMeta } from "core/entities";
import type { ChannelStorageInput } from "core/data-connector/types";
import type {
  IClassifierApi,
  ModelInfoDTO,
} from "core/dl/classification/types";
import type {
  ISegmenterApi,
  SegmentationModelDetails,
} from "core/dl/segmentation/types";

import type { StoreHandle } from "./store";

const FAKE_MODEL = "fake-whole-image";

/* Stands in for the segmenter worker: one whole-image object per input. */
const createFakeSegmenter = (): ISegmenterApi => {
  let loaded = false;
  const details = (): SegmentationModelDetails => ({
    name: FAKE_MODEL,
    displayName: "Whole-image labeller",
    modelLoaded: loaded,
    outputPolicy: { mode: OUTPUT_MODE.SINGLE, defaultKindName: "Object" },
    channelPolicy: { mode: CHANNEL_MODE.PASSTHROUGH, maxChannels: 1 },
    cancellableLoad: false,
  });
  const unsupported = {
    success: false as const,
    reason: { code: "UNKNOWN" as const, message: "not supported by the fake" },
  };
  return {
    getModelNames: async () => ({ success: true, data: [FAKE_MODEL] }),
    getModelInfo: async () => ({ success: true, data: details() }),
    hasModel: async (name) => ({ success: true, data: name === FAKE_MODEL }),
    getAvailableSegmentationModels: async () => ({
      success: true,
      data: { [FAKE_MODEL]: details() },
    }),
    loadModel: async (_name, loadCB) => {
      loaded = true;
      loadCB?.(100, "Loaded");
      return { success: true };
    },
    cancelLoadModel: async () => ({ success: true }),
    predict: async (_name, items, _token, _loadCB, _options, kindName) => ({
      success: true,
      data: {
        annotations: items.map((item) => [
          {
            id: generateUUID(),
            partition: Partition.Unassigned,
            boundingBox: [0, 0, item.shape.width, item.shape.height] as const,
            encodedMask: [0, item.shape.width * item.shape.height],
            kindName: kindName ?? "Object",
          },
        ]),
      },
    }),
    getSavedModelData: async () => unsupported,
    getZippedModelsBuffer: async () => unsupported,
    destroy: async () => ({ success: true }),
  };
};

/*
 * Stands in for the classifier worker: a majority-class model that reports
 * what the handler reports, without tfjs.
 */
const createFakeClassifier = (): IClassifierApi => {
  type Model = {
    loaded: boolean;
    trainingLoaded: boolean;
    classes: string[];
    majority?: string;
    pending: number;
  };
  const models = new Map<string, Model>();
  const unsupported = {
    success: false as const,
    reason: { code: "UNKNOWN" as const, message: "not supported by the fake" },
  };
  const dto = (name: string): ModelInfoDTO => {
    const model = models.get(name)!;
    return {
      name,
      modelArch: 0,
      task: ModelTask.Classification,
      graph: false,
      trainable: true,
      pretrained: model.loaded,
      classes: model.classes,
      numClasses: model.classes.length,
      preprocessingSettings: undefined,
      optimizerSettings: undefined,
      currentFitHistory: [],
      modelSummary: undefined,
      modelLoaded: model.loaded,
      trainingLoaded: model.trainingLoaded,
      validationLoaded: model.trainingLoaded,
      inferenceLoaded: true,
      defaultInputShape: undefined,
      defaultOutputShape: undefined,
    };
  };
  const missing = (name: string) => ({
    success: false as const,
    reason: { code: "MODEL_NOT_FOUND" as const, message: `No model ${name}` },
  });
  const evaluation = {
    confusionMatrix: [
      [1, 0],
      [0, 1],
    ],
    accuracy: 1,
    crossEntropy: 0.1,
    precision: 1,
    recall: 1,
    f1Score: 1,
  };
  return {
    getModelBackend: async () => ({ success: true, data: "fake" }),
    getModelNames: async () => ({ success: true, data: [...models.keys()] }),
    getModelInfo: async (name) =>
      models.has(name) ? { success: true, data: dto(name) } : missing(name),
    hasModel: async (name) => ({ success: true, data: models.has(name) }),
    createNewModel: async (name) => {
      models.set(name, {
        loaded: false,
        trainingLoaded: false,
        classes: [],
        pending: 0,
      });
      return { success: true, data: dto(name) };
    },
    removeModel: async (name) => {
      models.delete(name);
      return { success: true, data: name };
    },
    removeAllModels: async () => {
      models.clear();
      return { success: true };
    },
    loadTraining: async (name) => ({ success: true, data: name }),
    loadValidation: async (name) => ({ success: true, data: name }),
    loadInference: async (name, items) => {
      const model = models.get(name);
      if (!model) return missing(name);
      model.pending = items.length;
      return { success: true, data: name };
    },
    loadData: async (name) => ({ success: true, data: name }),
    prepareModel: async (name, training, _validation, _n, categories) => {
      const model = models.get(name);
      if (!model) return missing(name);
      model.loaded = true;
      model.trainingLoaded = true;
      model.classes = categories.map((c) => c.id);
      const counts = new Map<string, number>();
      for (const item of training) {
        counts.set(item.categoryId, (counts.get(item.categoryId) ?? 0) + 1);
      }
      model.majority = [...counts.entries()].sort(
        (x, y) => y[1] - x[1],
      )[0]?.[0];
      return { success: true };
    },
    recompile: async (name) => ({ success: true, data: name }),
    train: async (name, options, callbacks) => {
      if (!models.has(name)) return missing(name);
      for (let epoch = 0; epoch < options.epochs; epoch++) {
        await callbacks.onEpochEnd(epoch, {
          loss: 1 / (epoch + 1),
          val_loss: 1.1 / (epoch + 1),
          categoricalAccuracy: 0.5,
          val_categoricalAccuracy: 0.5,
        });
      }
      return {
        success: true,
        data: {
          weightsRef: name,
          status: "completed",
          evalResults: evaluation,
        },
      };
    },
    cancelTraining: async (name) => ({ success: true, data: name }),
    predict: async (name, categories) => {
      const model = models.get(name);
      if (!model) return missing(name);
      const index = Math.max(
        0,
        categories.findIndex((c) => c.id === model.majority),
      );
      const softmax = categories.map((_, i) => (i === index ? 0.75 : 0.25));
      return {
        success: true,
        data: Array.from({ length: model.pending }, () => ({
          categoryId: categories[index].id,
          maxProb: 0.75,
          softmax,
        })),
      };
    },
    evaluate: async (name) =>
      models.has(name) ? { success: true, data: evaluation } : missing(name),
    modelFromFiles: async () => unsupported,
    // Stands in for tfjs fetching `model.json`: anything on https resolves
    // to a pretrained two-class model named after its folder.
    modelFromUrl: async (url, isGraph) => {
      if (!url.startsWith("https://")) return unsupported;
      const name = url.split("/").at(-2) ?? "remote";
      models.set(name, {
        loaded: true,
        trainingLoaded: false,
        classes: ["cat", "dog"],
        pending: 0,
      });
      const { preprocessSettings, optimizerSettings } = getDefaultModelParams();
      return {
        success: true,
        data: {
          ...dto(name),
          modelArch: undefined,
          graph: isGraph,
          trainable: isGraph,
          preprocessingSettings: {
            cropSchema: preprocessSettings.cropOptions.cropSchema,
            numCrops: preprocessSettings.cropOptions.numCrops,
            inputShape: preprocessSettings.inputShape,
            shuffle: preprocessSettings.shuffle,
            normalize: preprocessSettings.normalizeOptions.normalize,
            batchSize: optimizerSettings.batchSize,
          },
          optimizerSettings,
        },
      };
    },
    modelsFromZipBuffer: async () => unsupported,
    getSavedModelData: async () => unsupported,
    getZippedModelsBuffer: async () => unsupported,
    destroy: async () => ({ success: true }),
  };
};

type ImageSeed = {
  id: string;
  width: number;
  height: number;
  channels: number;
};

const seed: ImageSeed[] = [
  { id: "img-a", width: 4, height: 3, channels: 2 },
  { id: "img-b", width: 2, height: 2, channels: 2 },
  { id: "img-c", width: 5, height: 1, channels: 2 },
  { id: "img-d", width: 3, height: 3, channels: 2 },
  { id: "img-e", width: 2, height: 3, channels: 2 },
];

const channelId = (imageId: string, c: number) => `${imageId}-ch${c}`;

const makeChannel = (im: ImageSeed, c: number): Channel => ({
  id: channelId(im.id, c),
  planeId: `${im.id}-plane`,
  channelMetaId: `meta-${c}`,
  name: `Channel ${c}`,
  dtype: "uint8",
  bitDepth: 8,
  width: im.width,
  height: im.height,
  minValue: 0,
  maxValue: 255,
  storageReference: {
    storageId: channelId(im.id, c),
    storeName: STORES.CHANNEL_DATA,
    width: im.width,
    height: im.height,
    dtype: "uint8",
    byteSize: im.width * im.height,
  },
});

const makeStorageInput = (im: ImageSeed, c: number): ChannelStorageInput => {
  const { storageReference: _ref, ...channel } = makeChannel(im, c);
  const data = new Uint8Array(im.width * im.height);
  for (let i = 0; i < data.length; i++) data[i] = (i * 37 + c * 64) % 256;
  return { ...channel, data: data.buffer, histogram: new Uint8Array(1).buffer };
};

const makeProject = () => ({
  experiment: { id: "exp", name: "exp" },
  imageSeries: seed.map((im) => ({
    id: `${im.id}-series`,
    experimentId: "exp",
    name: im.id,
    bitDepth: 8 as const,
    shape: {
      planes: 1,
      height: im.height,
      width: im.width,
      channels: im.channels,
    },
    timeSeries: false,
    activeImageId: im.id,
  })),
  images: seed.map((im) => ({
    id: im.id,
    name: im.id,
    seriesId: `${im.id}-series`,
    shape: {
      planes: 1,
      height: im.height,
      width: im.width,
      channels: im.channels,
    },
    categoryId: UNKNOWN_IMAGE_CATEGORY.id,
    activePlaneId: `${im.id}-plane`,
    timepoint: 0,
    bitDepth: 8 as const,
    partition: Partition.Unassigned,
  })),
  planes: seed.map((im) => ({
    id: `${im.id}-plane`,
    imageId: im.id,
    zIndex: 0,
  })),
  channels: seed.flatMap((im) =>
    Array.from({ length: im.channels }, (_, c) => makeChannel(im, c)),
  ),
  channelMetas: [0, 1].map(
    (c): ChannelMeta => ({
      id: `meta-${c}`,
      name: `Channel ${c}`,
      bitDepth: 8,
      colorMap: [c === 0 ? 1 : 0, c === 1 ? 1 : 0, 0],
      visible: true,
      minValue: 0,
      maxValue: 255,
      rampMin: 0,
      rampMax: 255,
      rampMinLimit: 0,
      rampMaxLimit: 255,
    }),
  ),
  kinds: [UNKNOWN_KIND],
  categories: [UNKNOWN_IMAGE_CATEGORY, UNKNOWN_KIND_CATEGORY],
  annotations: [],
  annotationVolumes: [],
});

const createLocalBackend = async () => {
  DataConnector.resetInstance();
  const storage = DataConnector.getInstance();
  await storage.storeBatch(
    seed.flatMap((im) =>
      Array.from({ length: im.channels }, (_, c) => ({
        id: channelId(im.id, c),
        storeName: STORES.CHANNEL_DATA,
        data: makeStorageInput(im, c),
      })),
    ),
  );

  const store = configureStore({
    reducer: {
      data: dataSlice.reducer,
      appTasks: appTasksSlice.reducer,
      classifier: classifierSlice.reducer,
    },
    middleware: (getDefault) => getDefault({ serializableCheck: false }),
  });
  store.dispatch(dataSlice.actions.setState(makeProject()));

  const handle = store as unknown as StoreHandle;
  const segmenter = createFakeSegmenter();
  const classifier = createFakeClassifier();
  const backend = new LocalBackend({
    store: handle,
    dataConnector: storage,
    thumbnails: createMainThreadThumbnailRenderer(storage),
    segmenter: () => segmenter,
    classifier: () => classifier,
    // The worker-free versions; the intensity one reads the same IndexedDB.
    measurements: () => ({
      computeFeatures: async (objects) => computeObjectFeatures(objects),
      computeIntensityMeasurements: computeObjectIntensityMeasurements,
    }),
  });
  // The local backend's own state is the store, so its queries only reflect
  // a run once the sync has applied the events.
  connectBackendToStore(backend, handle);

  return {
    backend,
    images: seed.map((im) => ({
      ...im,
      name: im.id,
      channelIds: Array.from({ length: im.channels }, (_, c) =>
        channelId(im.id, c),
      ),
    })),
    teardown: async () => {
      await storage.clearAll();
      storage.close();
    },
  };
};

describeBackendConformance("LocalBackend", createLocalBackend);

describe("LocalBackend: tfjs models by URL", () => {
  const withBackend = async (run: (backend: LocalBackend) => Promise<void>) => {
    const { backend, teardown } = await createLocalBackend();
    await backend.connect();
    try {
      await run(backend);
    } finally {
      await backend.dispose();
      await teardown();
    }
  };

  it("writes the fetched model as a pretrained record of the target", () =>
    withBackend(async (backend) => {
      expect(backend.capabilities).toContain("classification.import-url");
      const record = await backend.classification.importFromUrl!({
        targetId: IMAGE_CLASSIFIER_ID,
        url: "https://models.example/pets/model.json",
        format: "graph",
      });
      expect(record).toMatchObject({
        name: "pets",
        targetId: IMAGE_CLASSIFIER_ID,
        architectureId: "uploaded",
        framework: "tensorflow.js",
        classes: ["cat", "dog"],
        trained: true,
        trainable: true,
        runs: [],
      });
      expect(record.classMap).toBeUndefined();
      expect(await backend.classification.list()).toContainEqual(
        expect.objectContaining({ id: record.id }),
      );
    }));

  it("surfaces the worker's failure as a backend error", () =>
    withBackend(async (backend) => {
      await expect(
        backend.classification.importFromUrl!({
          targetId: IMAGE_CLASSIFIER_ID,
          url: "ftp://nowhere/model.json",
          format: "layers",
        }),
      ).rejects.toBeInstanceOf(BackendError);
      expect(await backend.classification.list()).toEqual([]);
    }));
});

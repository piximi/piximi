import { openGroup } from "zarr";

import type { ClassifierState, KindClassifier } from "store/classifier/types";
import type {
  BitDepth,
  ColorMap,
  DType,
  PredictionCorrection,
  Shape,
} from "store/data/types";

import { getAttr, getDataset, getGroup } from "../../zarr/utils";
import {
  ZARR_V2_ANNOTATION,
  ZARR_V2_ANNOTATION_VOLUME,
  ZARR_V2_CATEGORY,
  ZARR_V2_CHANNEL,
  ZARR_V2_CHANNEL_META,
  ZARR_V2_CLASSIFIER,
  ZARR_V2_DATA,
  ZARR_V2_DATASET,
  ZARR_V2_EVAL,
  ZARR_V2_GROUP,
  ZARR_V2_IMAGE,
  ZARR_V2_IMAGE_SERIES,
  ZARR_V2_KIND,
  ZARR_V2_MODEL_INFO,
  ZARR_V2_OPTIMIZER,
  ZARR_V2_PLANE,
  ZARR_V2_PREDICTION_CORRECTION,
  ZARR_V2_PREPROCESS,
  ZARR_V2_RUN,
  ZARR_V2_RUN_HISTORY_COLUMNS,
  ZARR_V2_RUNS,
  ZARR_V2_SHAPE,
} from "../../zarr/types";
import { subProgress } from "../progress";

import type {
  ModelArch,
  ModelClassMap,
  ModelInfo,
  ModelLifecycleStatus,
  OptimizerSettings,
  PreprocessSettings,
  Run,
  RunHistoryEpoch,
  RunStatus,
  RunTrigger,
} from "core/dl/classification/types";
import type { Partition } from "core/dl/enums";
import type { CustomStore } from "../../zarr/stores";
import type {
  V2AnnotationObject,
  V2AnnotationVolume,
  V2Category,
  V2Channel,
  V2ChannelMeta,
  V2ImageObject,
  V2ImageSeries,
  V2Kind,
  V2PiximiState,
  V2Plane,
} from "./version-types/v2Types";
import type { EntityState } from "@reduxjs/toolkit";
import type { Group } from "zarr";
import type { RawArray } from "zarr/types/rawArray";

/**
 * Read a v2 project file.
 *
 * The exact inverse of `project-saver/version-writers/writeV2.ts` — every
 * collection is one group whose attrs are parallel arrays, and both sides pull
 * their literals from `ZARR_V2_*`. Edit the two together.
 *
 * Unlike the older readers this needs no converter; v2 is the current format,
 * so what comes off disk is what Redux consumes.
 */

const STAGES = {
  metadata: { start: 0.0, end: 0.1 },
  channels: { start: 0.1, end: 0.9 },
  annotations: { start: 0.9, end: 0.95 },
  classifier: { start: 0.95, end: 1.0 },
} as const;

type Nullable<T> = T | null;

/** Parallel arrays store absent optionals as `null`. */
const optional = <T>(value: Nullable<T> | undefined): T | undefined =>
  value === null || value === undefined ? undefined : value;

const toBool = (value: number) => Boolean(value);

/**
 * zarr hands back a view onto a larger buffer, so the raw `.buffer` can carry
 * neighbouring bytes. Slice to exactly this view's extent before it becomes an
 * IndexedDB record.
 */
const toArrayBuffer = (view: ArrayBufferView): ArrayBuffer =>
  view.buffer.slice(
    view.byteOffset,
    view.byteOffset + view.byteLength,
  ) as ArrayBuffer;

/**
 * `getRaw()` is typed as `number | RawArray` to cover scalar selections; every
 * read here is a whole-array read, so it's always the latter.
 */
const readRaw = async (group: Group, key: string): Promise<RawArray> =>
  (await (await getDataset(group, key)).getRaw()) as RawArray;

const toEntityState = <T extends { id: string }>(
  items: T[],
): EntityState<T, string> => ({
  ids: items.map((item) => item.id),
  entities: items.reduce<Record<string, T>>((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {}),
});

/** Rebuild `Shape` from its four parallel columns. */
const readShapes = async (group: Group): Promise<Shape[]> => {
  const planes = (await getAttr(group, ZARR_V2_SHAPE.Planes)) as number[];
  const height = (await getAttr(group, ZARR_V2_SHAPE.Height)) as number[];
  const width = (await getAttr(group, ZARR_V2_SHAPE.Width)) as number[];
  const channels = (await getAttr(group, ZARR_V2_SHAPE.Channels)) as number[];
  return planes.map((_, i) => ({
    planes: planes[i],
    height: height[i],
    width: width[i],
    channels: channels[i],
  }));
};

/** Rebuild `PredictionCorrection` from its four parallel columns. */
const readPredictionCorrections = async (
  group: Group,
): Promise<Array<PredictionCorrection | undefined>> => {
  const fromRunId = (await getAttr(
    group,
    ZARR_V2_PREDICTION_CORRECTION.FromRunId,
  )) as Nullable<string>[];
  const categoryId = (await getAttr(
    group,
    ZARR_V2_PREDICTION_CORRECTION.CategoryId,
  )) as Nullable<string>[];
  const confidence = (await getAttr(
    group,
    ZARR_V2_PREDICTION_CORRECTION.Confidence,
  )) as Nullable<number>[];
  const at = (await getAttr(
    group,
    ZARR_V2_PREDICTION_CORRECTION.At,
  )) as Nullable<string>[];

  return fromRunId.map((runId, i) =>
    runId === null
      ? undefined
      : {
          correctedFromRunId: runId,
          predictedCategoryId: categoryId[i]!,
          predictionConfidence: confidence[i]!,
          correctedAt: at[i]!,
        },
  );
};

const readClassMap = (
  entries: Nullable<Array<[number, string]>>,
): ModelClassMap | undefined =>
  entries === null ? undefined : (Object.fromEntries(entries) as ModelClassMap);

export const readV2 = async (
  store: CustomStore,
  onProgress: (p: number) => void,
): Promise<V2PiximiState> => {
  const rootGroup = await openGroup(store, store.rootName, "r");
  const dataGroup = await getGroup(rootGroup, ZARR_V2_GROUP.Data);

  const experiment = {
    id: (await getAttr(dataGroup, ZARR_V2_DATA.ExperimentId)) as string,
    name: (await getAttr(dataGroup, ZARR_V2_DATA.ExperimentName)) as string,
    channels: optional(
      (await getAttr(
        dataGroup,
        ZARR_V2_DATA.ExperimentChannels,
      )) as Nullable<number>,
    ),
  };

  const imageSeries = await readImageSeries(dataGroup);
  const images = await readImages(dataGroup);
  const planes = await readPlanes(dataGroup);
  const kinds = await readKinds(dataGroup);
  const categories = await readCategories(dataGroup);
  const channelMetas = await readChannelMetas(dataGroup);
  onProgress(STAGES.metadata.end);

  const channels = await readChannels(
    dataGroup,
    subProgress(onProgress, STAGES.channels),
  );

  const annotationVolumes = await readAnnotationVolumes(dataGroup);
  const annotations = await readAnnotations(dataGroup);
  onProgress(STAGES.annotations.end);

  const classifierGroup = await getGroup(rootGroup, ZARR_V2_GROUP.Classifier);
  const classifier = await readClassifier(classifierGroup);
  onProgress(STAGES.classifier.end);

  return {
    classifier,
    data: {
      experiment,
      imageSeries,
      images,
      planes,
      kinds,
      categories,
      channels,
      channelMetas,
      annotationVolumes,
      annotations,
    },
  };
};

const readImageSeries = async (
  dataGroup: Group,
): Promise<EntityState<V2ImageSeries, string>> => {
  const group = await getGroup(dataGroup, ZARR_V2_GROUP.ImageSeries);
  const ids = (await getAttr(group, ZARR_V2_IMAGE_SERIES.Id)) as string[];
  const experimentIds = (await getAttr(
    group,
    ZARR_V2_IMAGE_SERIES.ExperimentId,
  )) as string[];
  const names = (await getAttr(group, ZARR_V2_IMAGE_SERIES.Name)) as string[];
  const bitDepths = (await getAttr(
    group,
    ZARR_V2_IMAGE_SERIES.BitDepth,
  )) as BitDepth[];
  const timeSeries = (await getAttr(
    group,
    ZARR_V2_IMAGE_SERIES.TimeSeries,
  )) as number[];
  const activeImageIds = (await getAttr(
    group,
    ZARR_V2_IMAGE_SERIES.ActiveImageId,
  )) as string[];
  const shapes = await readShapes(group);

  return toEntityState(
    ids.map((id, i) => ({
      id,
      experimentId: experimentIds[i],
      name: names[i],
      bitDepth: bitDepths[i],
      shape: shapes[i],
      timeSeries: toBool(timeSeries[i]),
      activeImageId: activeImageIds[i],
    })),
  );
};

const readImages = async (
  dataGroup: Group,
): Promise<EntityState<V2ImageObject, string>> => {
  const group = await getGroup(dataGroup, ZARR_V2_GROUP.Images);
  const ids = (await getAttr(group, ZARR_V2_IMAGE.Id)) as string[];
  const names = (await getAttr(group, ZARR_V2_IMAGE.Name)) as string[];
  const seriesIds = (await getAttr(group, ZARR_V2_IMAGE.SeriesId)) as string[];
  const categoryIds = (await getAttr(
    group,
    ZARR_V2_IMAGE.CategoryId,
  )) as string[];
  const activePlaneIds = (await getAttr(
    group,
    ZARR_V2_IMAGE.ActivePlaneId,
  )) as string[];
  const timepoints = (await getAttr(
    group,
    ZARR_V2_IMAGE.Timepoint,
  )) as number[];
  const bitDepths = (await getAttr(
    group,
    ZARR_V2_IMAGE.BitDepth,
  )) as BitDepth[];
  const partitions = (await getAttr(
    group,
    ZARR_V2_IMAGE.Partition,
  )) as Partition[];
  const confidences = (await getAttr(
    group,
    ZARR_V2_IMAGE.PredictionConfidence,
  )) as Nullable<number>[];
  const runIds = (await getAttr(
    group,
    ZARR_V2_IMAGE.PredictedAtRunId,
  )) as Nullable<string>[];
  const shapes = await readShapes(group);
  const corrections = await readPredictionCorrections(group);

  return toEntityState(
    ids.map((id, i) => ({
      id,
      name: names[i],
      seriesId: seriesIds[i],
      shape: shapes[i],
      categoryId: categoryIds[i],
      activePlaneId: activePlaneIds[i],
      timepoint: timepoints[i],
      bitDepth: bitDepths[i],
      partition: partitions[i],
      predictionConfidence: optional(confidences[i]),
      predictedAtRunId: optional(runIds[i]),
      predictionCorrected: corrections[i],
    })),
  );
};

const readPlanes = async (
  dataGroup: Group,
): Promise<EntityState<V2Plane, string>> => {
  const group = await getGroup(dataGroup, ZARR_V2_GROUP.Planes);
  const ids = (await getAttr(group, ZARR_V2_PLANE.Id)) as string[];
  const imageIds = (await getAttr(group, ZARR_V2_PLANE.ImageId)) as string[];
  const zIndices = (await getAttr(group, ZARR_V2_PLANE.ZIndex)) as number[];

  return toEntityState(
    ids.map((id, i) => ({ id, imageId: imageIds[i], zIndex: zIndices[i] })),
  );
};

const readKinds = async (
  dataGroup: Group,
): Promise<EntityState<V2Kind, string>> => {
  const group = await getGroup(dataGroup, ZARR_V2_GROUP.Kinds);
  const ids = (await getAttr(group, ZARR_V2_KIND.Id)) as string[];
  const names = (await getAttr(group, ZARR_V2_KIND.Name)) as string[];
  const unknownCategoryIds = (await getAttr(
    group,
    ZARR_V2_KIND.UnknownCategoryId,
  )) as string[];

  return toEntityState(
    ids.map((id, i) => ({
      id,
      name: names[i],
      unknownCategoryId: unknownCategoryIds[i],
    })),
  );
};

const readCategories = async (
  dataGroup: Group,
): Promise<EntityState<V2Category, string>> => {
  const group = await getGroup(dataGroup, ZARR_V2_GROUP.Categories);
  const ids = (await getAttr(group, ZARR_V2_CATEGORY.Id)) as string[];
  const names = (await getAttr(group, ZARR_V2_CATEGORY.Name)) as string[];
  const colors = (await getAttr(group, ZARR_V2_CATEGORY.Color)) as string[];
  const isUnknown = (await getAttr(
    group,
    ZARR_V2_CATEGORY.IsUnknown,
  )) as number[];
  const types = (await getAttr(group, ZARR_V2_CATEGORY.Type)) as Array<
    "image" | "annotation"
  >;
  const kindIds = (await getAttr(
    group,
    ZARR_V2_CATEGORY.KindId,
  )) as Nullable<string>[];

  return toEntityState(
    ids.map((id, i) => {
      const base = {
        id,
        name: names[i],
        color: colors[i],
        isUnknown: toBool(isUnknown[i]),
      };
      return types[i] === "annotation"
        ? { ...base, type: "annotation" as const, kindId: kindIds[i]! }
        : { ...base, type: "image" as const };
    }),
  );
};

const readChannelMetas = async (
  dataGroup: Group,
): Promise<EntityState<V2ChannelMeta, string>> => {
  const group = await getGroup(dataGroup, ZARR_V2_GROUP.ChannelMetas);
  const ids = (await getAttr(group, ZARR_V2_CHANNEL_META.Id)) as string[];
  const names = (await getAttr(group, ZARR_V2_CHANNEL_META.Name)) as string[];
  const bitDepths = (await getAttr(
    group,
    ZARR_V2_CHANNEL_META.BitDepth,
  )) as BitDepth[];
  const colorMaps = (await getAttr(
    group,
    ZARR_V2_CHANNEL_META.ColorMap,
  )) as ColorMap[];
  const visible = (await getAttr(
    group,
    ZARR_V2_CHANNEL_META.Visible,
  )) as number[];
  const minValues = (await getAttr(
    group,
    ZARR_V2_CHANNEL_META.MinValue,
  )) as number[];
  const maxValues = (await getAttr(
    group,
    ZARR_V2_CHANNEL_META.MaxValue,
  )) as number[];
  const rampMins = (await getAttr(
    group,
    ZARR_V2_CHANNEL_META.RampMin,
  )) as number[];
  const rampMaxs = (await getAttr(
    group,
    ZARR_V2_CHANNEL_META.RampMax,
  )) as number[];
  const rampMinLimits = (await getAttr(
    group,
    ZARR_V2_CHANNEL_META.RampMinLimit,
  )) as number[];
  const rampMaxLimits = (await getAttr(
    group,
    ZARR_V2_CHANNEL_META.RampMaxLimit,
  )) as number[];

  return toEntityState(
    ids.map((id, i) => ({
      id,
      name: names[i],
      bitDepth: bitDepths[i],
      colorMap: colorMaps[i],
      visible: toBool(visible[i]),
      minValue: minValues[i],
      maxValue: maxValues[i],
      rampMin: rampMins[i],
      rampMax: rampMaxs[i],
      rampMinLimit: rampMinLimits[i],
      rampMaxLimit: rampMaxLimits[i],
    })),
  );
};

const readChannels = async (
  dataGroup: Group,
  onProgress: (p: number) => void,
): Promise<EntityState<V2Channel, string>> => {
  const group = await getGroup(dataGroup, ZARR_V2_GROUP.Channels);
  const ids = (await getAttr(group, ZARR_V2_CHANNEL.Id)) as string[];
  const planeIds = (await getAttr(group, ZARR_V2_CHANNEL.PlaneId)) as string[];
  const channelMetaIds = (await getAttr(
    group,
    ZARR_V2_CHANNEL.ChannelMetaId,
  )) as string[];
  const names = (await getAttr(group, ZARR_V2_CHANNEL.Name)) as string[];
  const dtypes = (await getAttr(group, ZARR_V2_CHANNEL.DType)) as DType[];
  const bitDepths = (await getAttr(
    group,
    ZARR_V2_CHANNEL.BitDepth,
  )) as BitDepth[];
  const widths = (await getAttr(group, ZARR_V2_CHANNEL.Width)) as number[];
  const heights = (await getAttr(group, ZARR_V2_CHANNEL.Height)) as number[];
  const minValues = (await getAttr(
    group,
    ZARR_V2_CHANNEL.MinValue,
  )) as number[];
  const maxValues = (await getAttr(
    group,
    ZARR_V2_CHANNEL.MaxValue,
  )) as number[];
  const totals = (await getAttr(
    group,
    ZARR_V2_CHANNEL.Total,
  )) as Nullable<number>[];
  const means = (await getAttr(
    group,
    ZARR_V2_CHANNEL.Mean,
  )) as Nullable<number>[];
  const medians = (await getAttr(
    group,
    ZARR_V2_CHANNEL.Median,
  )) as Nullable<number>[];
  const stds = (await getAttr(
    group,
    ZARR_V2_CHANNEL.Std,
  )) as Nullable<number>[];
  const mads = (await getAttr(
    group,
    ZARR_V2_CHANNEL.Mad,
  )) as Nullable<number>[];
  const lowerQuartiles = (await getAttr(
    group,
    ZARR_V2_CHANNEL.LowerQuartile,
  )) as Nullable<number>[];
  const upperQuartiles = (await getAttr(
    group,
    ZARR_V2_CHANNEL.UpperQuartile,
  )) as Nullable<number>[];
  const features = (await getAttr(group, ZARR_V2_CHANNEL.Features)) as Array<
    Nullable<V2Channel["features"]>
  >;

  const channels: V2Channel[] = [];
  for (const [i, id] of ids.entries()) {
    const channelGroup = await getGroup(group, id);
    const pixels = (await readRaw(channelGroup, ZARR_V2_DATASET.ChannelData))
      .data as ArrayBufferView;
    const histogram = (
      await readRaw(channelGroup, ZARR_V2_DATASET.ChannelHistogram)
    ).data as ArrayBufferView;

    channels.push({
      id,
      planeId: planeIds[i],
      channelMetaId: channelMetaIds[i],
      name: names[i],
      dtype: dtypes[i],
      data: toArrayBuffer(pixels),
      histogram: toArrayBuffer(histogram),
      bitDepth: bitDepths[i],
      width: widths[i],
      height: heights[i],
      minValue: minValues[i],
      maxValue: maxValues[i],
      total: optional(totals[i]),
      mean: optional(means[i]),
      median: optional(medians[i]),
      std: optional(stds[i]),
      mad: optional(mads[i]),
      lowerQuartile: optional(lowerQuartiles[i]),
      upperQuartile: optional(upperQuartiles[i]),
      features: optional(features[i]),
    });

    onProgress((i + 1) / ids.length);
  }
  if (ids.length === 0) onProgress(1);

  return toEntityState(channels);
};

const readAnnotationVolumes = async (
  dataGroup: Group,
): Promise<EntityState<V2AnnotationVolume, string>> => {
  const group = await getGroup(dataGroup, ZARR_V2_GROUP.AnnotationVolumes);
  const ids = (await getAttr(group, ZARR_V2_ANNOTATION_VOLUME.Id)) as string[];
  const imageIds = (await getAttr(
    group,
    ZARR_V2_ANNOTATION_VOLUME.ImageId,
  )) as string[];
  const kindIds = (await getAttr(
    group,
    ZARR_V2_ANNOTATION_VOLUME.KindId,
  )) as string[];
  const categoryIds = (await getAttr(
    group,
    ZARR_V2_ANNOTATION_VOLUME.CategoryId,
  )) as string[];
  const timepoints = (await getAttr(
    group,
    ZARR_V2_ANNOTATION_VOLUME.Timepoint,
  )) as Nullable<number>[];
  const confidences = (await getAttr(
    group,
    ZARR_V2_ANNOTATION_VOLUME.PredictionConfidence,
  )) as Nullable<number>[];
  const runIds = (await getAttr(
    group,
    ZARR_V2_ANNOTATION_VOLUME.PredictedAtRunId,
  )) as Nullable<string>[];
  const corrections = await readPredictionCorrections(group);

  return toEntityState(
    ids.map((id, i) => ({
      id,
      imageId: imageIds[i],
      kindId: kindIds[i],
      categoryId: categoryIds[i],
      timepoint: optional(timepoints[i]),
      predictionConfidence: optional(confidences[i]),
      predictedAtRunId: optional(runIds[i]),
      predictionCorrected: corrections[i],
    })),
  );
};

const readAnnotations = async (
  dataGroup: Group,
): Promise<EntityState<V2AnnotationObject, string>> => {
  const group = await getGroup(dataGroup, ZARR_V2_GROUP.Annotations);
  const ids = (await getAttr(group, ZARR_V2_ANNOTATION.Id)) as string[];
  const planeIds = (await getAttr(
    group,
    ZARR_V2_ANNOTATION.PlaneId,
  )) as string[];
  const imageIds = (await getAttr(
    group,
    ZARR_V2_ANNOTATION.ImageId,
  )) as string[];
  const volumeIds = (await getAttr(
    group,
    ZARR_V2_ANNOTATION.VolumeId,
  )) as string[];
  const partitions = (await getAttr(
    group,
    ZARR_V2_ANNOTATION.Partition,
  )) as Partition[];
  const bboxes = (await getAttr(group, ZARR_V2_ANNOTATION.BBox)) as Array<
    [number, number, number, number]
  >;
  const offsets = (await getAttr(
    group,
    ZARR_V2_ANNOTATION.MaskOffsets,
  )) as number[];
  const shapes = await readShapes(group);

  // The masks dataset is omitted entirely when nothing is annotated, since
  // zarr can't represent a zero-length array.
  const hasMasks = await group.containsItem(ZARR_V2_DATASET.AnnotationMasks);
  const masks = hasMasks
    ? ((await readRaw(group, ZARR_V2_DATASET.AnnotationMasks))
        .data as Uint32Array)
    : new Uint32Array(0);

  return toEntityState(
    ids.map((id, i) => ({
      id,
      planeId: planeIds[i],
      imageId: imageIds[i],
      volumeId: volumeIds[i],
      partition: partitions[i],
      shape: shapes[i],
      boundingBox: bboxes[i],
      encodedMask: Array.from(masks.subarray(offsets[i], offsets[i + 1])),
    })),
  );
};

const readClassifier = async (
  classifierGroup: Group,
): Promise<ClassifierState> => {
  const kindIds = (await getAttr(
    classifierGroup,
    ZARR_V2_CLASSIFIER.Kinds,
  )) as string[];

  const kindClassifiers: Record<string, KindClassifier> = {};
  for (const kindId of kindIds) {
    kindClassifiers[kindId] = await readKindClassifier(
      await getGroup(classifierGroup, kindId),
    );
  }

  return { kindClassifiers };
};

const readKindClassifier = async (group: Group): Promise<KindClassifier> => {
  const modelNames = (await getAttr(
    group,
    ZARR_V2_CLASSIFIER.Models,
  )) as string[];

  const modelInfoDict: Record<string, ModelInfo> = {};
  for (const modelName of modelNames) {
    const modelGroup = await getGroup(group, modelName);
    modelInfoDict[modelName] = await readModelInfo(
      await getGroup(modelGroup, ZARR_V2_GROUP.ModelInfo),
    );
  }

  return {
    modelTargetId: (await getAttr(
      group,
      ZARR_V2_CLASSIFIER.ModelTargetId,
    )) as string,
    modelTargetName: (await getAttr(
      group,
      ZARR_V2_CLASSIFIER.ModelTargetName,
    )) as string,
    activeModel: optional(
      (await getAttr(
        group,
        ZARR_V2_CLASSIFIER.ActiveModel,
      )) as Nullable<string>,
    ),
    newModelArch: (await getAttr(
      group,
      ZARR_V2_CLASSIFIER.NewModelArch,
    )) as ModelArch,
    modelInfoDict,
    status: (await getAttr(
      group,
      ZARR_V2_CLASSIFIER.Status,
    )) as ModelLifecycleStatus,
  };
};

const readModelInfo = async (infoGroup: Group): Promise<ModelInfo> => {
  const trained = (await getAttr(
    infoGroup,
    ZARR_V2_MODEL_INFO.Trained,
  )) as Nullable<number>;

  return {
    classMap: readClassMap(
      (await getAttr(infoGroup, ZARR_V2_MODEL_INFO.ClassMap)) as Nullable<
        Array<[number, string]>
      >,
    ),
    preprocessSettings: await readPreprocessSettings(infoGroup),
    optimizerSettings: await readOptimizerSettings(infoGroup),
    confidenceThreshold: (await getAttr(
      infoGroup,
      ZARR_V2_MODEL_INFO.ConfidenceThreshold,
    )) as number,
    runs: await readRuns(infoGroup),
    valid: toBool(
      (await getAttr(infoGroup, ZARR_V2_MODEL_INFO.Valid)) as number,
    ),
    initSeed: optional(
      (await getAttr(
        infoGroup,
        ZARR_V2_MODEL_INFO.InitSeed,
      )) as Nullable<number>,
    ),
    trained: trained === null ? undefined : toBool(trained),
  };
};

const readPreprocessSettings = async (
  parent: Group,
): Promise<PreprocessSettings> => {
  const group = await getGroup(parent, ZARR_V2_GROUP.PreprocessSettings);
  const [planes, height, width, channels] = (await getAttr(
    group,
    ZARR_V2_PREPROCESS.InputShape,
  )) as number[];

  const normalizeGroup = await getGroup(group, ZARR_V2_GROUP.NormalizeOptions);
  const cropGroup = await getGroup(group, ZARR_V2_GROUP.CropOptions);

  return {
    shuffle: toBool(
      (await getAttr(group, ZARR_V2_PREPROCESS.Shuffle)) as number,
    ),
    inputShape: { planes, height, width, channels },
    normalizeOptions: {
      normalize: toBool(
        (await getAttr(normalizeGroup, ZARR_V2_PREPROCESS.Normalize)) as number,
      ),
      center: toBool(
        (await getAttr(normalizeGroup, ZARR_V2_PREPROCESS.Center)) as number,
      ),
    },
    cropOptions: {
      numCrops: (await getAttr(
        cropGroup,
        ZARR_V2_PREPROCESS.NumCrops,
      )) as number,
      cropSchema: (await getAttr(
        cropGroup,
        ZARR_V2_PREPROCESS.CropSchema,
      )) as PreprocessSettings["cropOptions"]["cropSchema"],
    },
    trainingPercentage: (await getAttr(
      group,
      ZARR_V2_PREPROCESS.TrainingPercent,
    )) as number,
  };
};

const readOptimizerSettings = async (
  parent: Group,
): Promise<OptimizerSettings> => {
  const group = await getGroup(parent, ZARR_V2_GROUP.OptimizerSettings);
  return {
    learningRate: (await getAttr(
      group,
      ZARR_V2_OPTIMIZER.LearningRate,
    )) as number,
    lossFunction: (await getAttr(
      group,
      ZARR_V2_OPTIMIZER.LossFunction,
    )) as OptimizerSettings["lossFunction"],
    metrics: (await getAttr(
      group,
      ZARR_V2_OPTIMIZER.Metrics,
    )) as OptimizerSettings["metrics"],
    optimizationAlgorithm: (await getAttr(
      group,
      ZARR_V2_OPTIMIZER.OptimizationAlgorithm,
    )) as OptimizerSettings["optimizationAlgorithm"],
    epochs: (await getAttr(group, ZARR_V2_OPTIMIZER.Epochs)) as number,
    batchSize: (await getAttr(group, ZARR_V2_OPTIMIZER.BatchSize)) as number,
  };
};

const readRuns = async (infoGroup: Group): Promise<Run[]> => {
  const runsGroup = await getGroup(infoGroup, ZARR_V2_GROUP.Runs);
  const runIds = (await getAttr(runsGroup, ZARR_V2_RUNS.RunIds)) as string[];

  const runs: Run[] = [];
  for (const runId of runIds) {
    const runGroup = await getGroup(runsGroup, runId);
    const hyperGroup = await getGroup(runGroup, ZARR_V2_GROUP.Hyperparameters);

    runs.push({
      id: (await getAttr(runGroup, ZARR_V2_RUN.Id)) as string,
      parentRunId: optional(
        (await getAttr(runGroup, ZARR_V2_RUN.ParentRunId)) as Nullable<string>,
      ),
      startedAt: (await getAttr(runGroup, ZARR_V2_RUN.StartedAt)) as string,
      finishedAt: optional(
        (await getAttr(runGroup, ZARR_V2_RUN.FinishedAt)) as Nullable<string>,
      ),
      status: (await getAttr(runGroup, ZARR_V2_RUN.Status)) as RunStatus,
      trigger: (await getAttr(runGroup, ZARR_V2_RUN.Trigger)) as RunTrigger,
      seed: optional(
        (await getAttr(runGroup, ZARR_V2_RUN.Seed)) as Nullable<number>,
      ),
      appVersion: (await getAttr(runGroup, ZARR_V2_RUN.AppVersion)) as string,
      tfjsVersion: (await getAttr(runGroup, ZARR_V2_RUN.TfjsVersion)) as string,
      backend: (await getAttr(runGroup, ZARR_V2_RUN.Backend)) as string,
      hyperparameters: {
        architecture: (await getAttr(
          hyperGroup,
          ZARR_V2_RUN.Architecture,
        )) as Run["hyperparameters"]["architecture"],
        optimizer: await readOptimizerSettings(hyperGroup),
        preprocess: await readPreprocessSettings(hyperGroup),
      },
      classMap:
        readClassMap(
          (await getAttr(runGroup, ZARR_V2_RUN.ClassMap)) as Nullable<
            Array<[number, string]>
          >,
        ) ?? {},
      trainingFingerprint: (await getAttr(
        runGroup,
        ZARR_V2_RUN.TrainingFingerprint,
      )) as string,
      validationFingerprint: (await getAttr(
        runGroup,
        ZARR_V2_RUN.ValidationFingerprint,
      )) as string,
      valIds: (await getAttr(runGroup, ZARR_V2_RUN.ValIds)) as string[],
      categorySetHash: (await getAttr(
        runGroup,
        ZARR_V2_RUN.CategorySetHash,
      )) as string,
      history: await readRunHistory(runGroup),
      evalResults: await readEvalResults(runGroup),
      weightsRef: optional(
        (await getAttr(runGroup, ZARR_V2_RUN.WeightsRef)) as Nullable<string>,
      ),
    });
  }

  return runs;
};

const readRunHistory = async (runGroup: Group): Promise<RunHistoryEpoch[]> => {
  if (!(await runGroup.containsItem(ZARR_V2_DATASET.RunHistory))) return [];

  const values = (await readRaw(runGroup, ZARR_V2_DATASET.RunHistory))
    .data as Float64Array;
  const columns = ZARR_V2_RUN_HISTORY_COLUMNS;

  const epochs: RunHistoryEpoch[] = [];
  for (let i = 0; i < values.length / columns.length; i++) {
    const row = {} as RunHistoryEpoch;
    columns.forEach((column, j) => {
      row[column] = values[i * columns.length + j];
    });
    epochs.push(row);
  }
  return epochs;
};

const readEvalResults = async (
  runGroup: Group,
): Promise<Run["evalResults"]> => {
  if (!(await runGroup.containsItem(ZARR_V2_GROUP.EvalResults)))
    return undefined;

  const group = await getGroup(runGroup, ZARR_V2_GROUP.EvalResults);

  let confusionMatrix: number[][] = [];
  if (await group.containsItem(ZARR_V2_DATASET.ConfusionMatrix)) {
    const raw = await readRaw(group, ZARR_V2_DATASET.ConfusionMatrix);
    const flat = raw.data as Int32Array;
    const [rows, cols] = raw.shape as [number, number];
    confusionMatrix = Array.from({ length: rows }, (_, i) =>
      Array.from(flat.subarray(i * cols, (i + 1) * cols)),
    );
  }

  return {
    confusionMatrix,
    accuracy: (await getAttr(group, ZARR_V2_EVAL.Accuracy)) as number,
    crossEntropy: (await getAttr(group, ZARR_V2_EVAL.CrossEntropy)) as number,
    precision: (await getAttr(group, ZARR_V2_EVAL.Precision)) as number,
    recall: (await getAttr(group, ZARR_V2_EVAL.Recall)) as number,
    f1Score: (await getAttr(group, ZARR_V2_EVAL.F1Score)) as number,
  };
};

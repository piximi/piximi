import type { ClassifierState, KindClassifier } from "store/classifier/types";
import type {
  AnnotationObject,
  AnnotationVolume,
  Category,
  Channel,
  ChannelMeta,
  ImageObject,
  ImageSeries,
  Kind,
  Plane,
  PredictionCorrection,
  Shape,
} from "store/data/types";

import type {
  ModelClassMap,
  ModelInfo,
  OptimizerSettings,
  PreprocessSettings,
  Run,
} from "utils/dl/classification/types";

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
  ZARR_V2_ROOT,
  ZARR_V2_RUN,
  ZARR_V2_RUN_HISTORY_COLUMNS,
  ZARR_V2_RUNS,
  ZARR_V2_SHAPE,
} from "../../zarr/types";
import { writeArray, writeAttrs } from "../zarr/writers";

import type { Group } from "zarr";
import type { ChannelDataAccessor, SerializableProject } from "../types";
import type { EntityState } from "@reduxjs/toolkit";

/**
 * Writes the v2 project format.
 *
 * Every entity collection becomes one group whose attrs are parallel arrays
 * indexed consistently across the group, mirroring how the v0.1–1.1 readers
 * encode categories and kinds. `readV2` is the exact inverse — the two should
 * be edited together, and both draw their literals from `ZARR_V2_*`.
 *
 * Deliberately not written:
 *  - the `project` slice (grid filters, sort, active view). The loader resets
 *    it on every load regardless of format.
 *  - `AnnotationObject.features` / `.intensityMeasurements`, which
 *    `loadProject` recomputes unconditionally after any version read.
 *  - `AnnotationObject.decodedMask`, derivable from `encodedMask`.
 *  - `KindClassifier.activeSoftmaxById`, a per-session prediction artifact.
 */

const STAGES = {
  metadata: { start: 0.0, end: 0.1 },
  channels: { start: 0.1, end: 0.9 },
  annotations: { start: 0.9, end: 0.95 },
  classifier: { start: 0.95, end: 1.0 },
} as const;

/** How many channels to pull out of storage at once. Bounds peak memory. */
const CHANNEL_BATCH_SIZE = 32;

const ordered = <T>(state: EntityState<T, string>): T[] =>
  state.ids.map((id) => state.entities[id]!);

/** `Shape` decomposed into four parallel columns. */
const shapeColumns = (shapes: Shape[]) => ({
  [ZARR_V2_SHAPE.Planes]: shapes.map((s) => s.planes),
  [ZARR_V2_SHAPE.Height]: shapes.map((s) => s.height),
  [ZARR_V2_SHAPE.Width]: shapes.map((s) => s.width),
  [ZARR_V2_SHAPE.Channels]: shapes.map((s) => s.channels),
});

/** `PredictionCorrection` decomposed into four parallel columns. */
const predictionCorrectionColumns = (
  corrections: Array<PredictionCorrection | undefined>,
) => ({
  [ZARR_V2_PREDICTION_CORRECTION.FromRunId]: corrections.map(
    (c) => c?.correctedFromRunId ?? null,
  ),
  [ZARR_V2_PREDICTION_CORRECTION.CategoryId]: corrections.map(
    (c) => c?.predictedCategoryId ?? null,
  ),
  [ZARR_V2_PREDICTION_CORRECTION.Confidence]: corrections.map(
    (c) => c?.predictionConfidence ?? null,
  ),
  [ZARR_V2_PREDICTION_CORRECTION.At]: corrections.map(
    (c) => c?.correctedAt ?? null,
  ),
});

/** `Record<number, string>` isn't JSON-safe round-trip, so store entry pairs. */
const classMapEntries = (classMap: ModelClassMap | undefined) =>
  classMap
    ? Object.entries(classMap).map(([index, name]) => [Number(index), name])
    : null;

export const writeV2 = async (
  root: Group,
  project: SerializableProject,
  getChannelData: ChannelDataAccessor,
  onProgress: (p: number) => void,
): Promise<void> => {
  // `detectVersion` routes on this, so a build that forgets the env var would
  // otherwise write a file with no version attr and no way to reopen it.
  // The npm scripts pass VITE_APP_VERSION=$npm_package_version.
  const appVersion = import.meta.env.VITE_APP_VERSION;
  if (!appVersion) {
    throw new Error(
      "Missing VITE_APP_VERSION; cannot stamp a version on the project file.",
    );
  }

  await writeAttrs(root, {
    [ZARR_V2_ROOT.Version]: appVersion,
    [ZARR_V2_ROOT.AppVersion]: appVersion,
  });

  const { data, classifier } = project;
  const dataGroup = await root.createGroup(ZARR_V2_GROUP.Data);

  await writeAttrs(dataGroup, {
    [ZARR_V2_DATA.ExperimentId]: data.experiment.id,
    [ZARR_V2_DATA.ExperimentName]: data.experiment.name,
    [ZARR_V2_DATA.ExperimentChannels]: data.experiment.channels ?? null,
  });

  await writeImageSeries(dataGroup, ordered(data.imageSeries));
  await writeImages(dataGroup, ordered(data.images));
  await writePlanes(dataGroup, ordered(data.planes));
  await writeKinds(dataGroup, ordered(data.kinds));
  await writeCategories(dataGroup, ordered(data.categories));
  await writeChannelMetas(dataGroup, ordered(data.channelMetas));
  onProgress(STAGES.metadata.end);

  await writeChannels(dataGroup, ordered(data.channels), getChannelData, (p) =>
    onProgress(
      STAGES.channels.start + (STAGES.channels.end - STAGES.channels.start) * p,
    ),
  );

  await writeAnnotationVolumes(dataGroup, ordered(data.annotationVolumes));
  await writeAnnotations(dataGroup, ordered(data.annotations));
  onProgress(STAGES.annotations.end);

  await writeClassifier(root, classifier);
  onProgress(STAGES.classifier.end);
};

const writeImageSeries = async (dataGroup: Group, series: ImageSeries[]) => {
  const group = await dataGroup.createGroup(ZARR_V2_GROUP.ImageSeries);
  await writeAttrs(group, {
    [ZARR_V2_IMAGE_SERIES.Id]: series.map((s) => s.id),
    [ZARR_V2_IMAGE_SERIES.ExperimentId]: series.map((s) => s.experimentId),
    [ZARR_V2_IMAGE_SERIES.Name]: series.map((s) => s.name),
    [ZARR_V2_IMAGE_SERIES.BitDepth]: series.map((s) => s.bitDepth),
    [ZARR_V2_IMAGE_SERIES.TimeSeries]: series.map((s) => Number(s.timeSeries)),
    [ZARR_V2_IMAGE_SERIES.ActiveImageId]: series.map((s) => s.activeImageId),
    ...shapeColumns(series.map((s) => s.shape)),
  });
};

const writeImages = async (dataGroup: Group, images: ImageObject[]) => {
  const group = await dataGroup.createGroup(ZARR_V2_GROUP.Images);
  await writeAttrs(group, {
    [ZARR_V2_IMAGE.Id]: images.map((i) => i.id),
    [ZARR_V2_IMAGE.Name]: images.map((i) => i.name),
    [ZARR_V2_IMAGE.SeriesId]: images.map((i) => i.seriesId),
    [ZARR_V2_IMAGE.CategoryId]: images.map((i) => i.categoryId),
    [ZARR_V2_IMAGE.ActivePlaneId]: images.map((i) => i.activePlaneId),
    [ZARR_V2_IMAGE.Timepoint]: images.map((i) => i.timepoint),
    [ZARR_V2_IMAGE.BitDepth]: images.map((i) => i.bitDepth),
    [ZARR_V2_IMAGE.Partition]: images.map((i) => i.partition),
    [ZARR_V2_IMAGE.PredictionConfidence]: images.map(
      (i) => i.predictionConfidence ?? null,
    ),
    [ZARR_V2_IMAGE.PredictedAtRunId]: images.map(
      (i) => i.predictedAtRunId ?? null,
    ),
    ...shapeColumns(images.map((i) => i.shape)),
    ...predictionCorrectionColumns(images.map((i) => i.predictionCorrected)),
  });
};

const writePlanes = async (dataGroup: Group, planes: Plane[]) => {
  const group = await dataGroup.createGroup(ZARR_V2_GROUP.Planes);
  await writeAttrs(group, {
    [ZARR_V2_PLANE.Id]: planes.map((p) => p.id),
    [ZARR_V2_PLANE.ImageId]: planes.map((p) => p.imageId),
    [ZARR_V2_PLANE.ZIndex]: planes.map((p) => p.zIndex),
  });
};

const writeKinds = async (dataGroup: Group, kinds: Kind[]) => {
  const group = await dataGroup.createGroup(ZARR_V2_GROUP.Kinds);
  await writeAttrs(group, {
    [ZARR_V2_KIND.Id]: kinds.map((k) => k.id),
    [ZARR_V2_KIND.Name]: kinds.map((k) => k.name),
    [ZARR_V2_KIND.UnknownCategoryId]: kinds.map((k) => k.unknownCategoryId),
  });
};

const writeCategories = async (dataGroup: Group, categories: Category[]) => {
  const group = await dataGroup.createGroup(ZARR_V2_GROUP.Categories);
  await writeAttrs(group, {
    [ZARR_V2_CATEGORY.Id]: categories.map((c) => c.id),
    [ZARR_V2_CATEGORY.Name]: categories.map((c) => c.name),
    [ZARR_V2_CATEGORY.Color]: categories.map((c) => c.color),
    [ZARR_V2_CATEGORY.IsUnknown]: categories.map((c) => Number(c.isUnknown)),
    [ZARR_V2_CATEGORY.Type]: categories.map((c) => c.type),
    // Only annotation categories belong to a kind.
    [ZARR_V2_CATEGORY.KindId]: categories.map((c) =>
      c.type === "annotation" ? c.kindId : null,
    ),
  });
};

const writeChannelMetas = async (dataGroup: Group, metas: ChannelMeta[]) => {
  const group = await dataGroup.createGroup(ZARR_V2_GROUP.ChannelMetas);
  await writeAttrs(group, {
    [ZARR_V2_CHANNEL_META.Id]: metas.map((m) => m.id),
    [ZARR_V2_CHANNEL_META.Name]: metas.map((m) => m.name),
    [ZARR_V2_CHANNEL_META.BitDepth]: metas.map((m) => m.bitDepth),
    [ZARR_V2_CHANNEL_META.ColorMap]: metas.map((m) => m.colorMap),
    [ZARR_V2_CHANNEL_META.Visible]: metas.map((m) => Number(m.visible)),
    [ZARR_V2_CHANNEL_META.MinValue]: metas.map((m) => m.minValue),
    [ZARR_V2_CHANNEL_META.MaxValue]: metas.map((m) => m.maxValue),
    [ZARR_V2_CHANNEL_META.RampMin]: metas.map((m) => m.rampMin),
    [ZARR_V2_CHANNEL_META.RampMax]: metas.map((m) => m.rampMax),
    [ZARR_V2_CHANNEL_META.RampMinLimit]: metas.map((m) => m.rampMinLimit),
    [ZARR_V2_CHANNEL_META.RampMaxLimit]: metas.map((m) => m.rampMaxLimit),
  });
};

const writeChannels = async (
  dataGroup: Group,
  channels: Channel[],
  getChannelData: ChannelDataAccessor,
  onProgress: (p: number) => void,
) => {
  const group = await dataGroup.createGroup(ZARR_V2_GROUP.Channels);
  await writeAttrs(group, {
    [ZARR_V2_CHANNEL.Id]: channels.map((c) => c.id),
    [ZARR_V2_CHANNEL.PlaneId]: channels.map((c) => c.planeId),
    [ZARR_V2_CHANNEL.ChannelMetaId]: channels.map((c) => c.channelMetaId),
    [ZARR_V2_CHANNEL.Name]: channels.map((c) => c.name),
    [ZARR_V2_CHANNEL.DType]: channels.map((c) => c.dtype),
    [ZARR_V2_CHANNEL.BitDepth]: channels.map((c) => c.bitDepth),
    [ZARR_V2_CHANNEL.Width]: channels.map((c) => c.width),
    [ZARR_V2_CHANNEL.Height]: channels.map((c) => c.height),
    [ZARR_V2_CHANNEL.MinValue]: channels.map((c) => c.minValue),
    [ZARR_V2_CHANNEL.MaxValue]: channels.map((c) => c.maxValue),
    [ZARR_V2_CHANNEL.Total]: channels.map((c) => c.total ?? null),
    [ZARR_V2_CHANNEL.Mean]: channels.map((c) => c.mean ?? null),
    [ZARR_V2_CHANNEL.Median]: channels.map((c) => c.median ?? null),
    [ZARR_V2_CHANNEL.Std]: channels.map((c) => c.std ?? null),
    [ZARR_V2_CHANNEL.Mad]: channels.map((c) => c.mad ?? null),
    [ZARR_V2_CHANNEL.LowerQuartile]: channels.map(
      (c) => c.lowerQuartile ?? null,
    ),
    [ZARR_V2_CHANNEL.UpperQuartile]: channels.map(
      (c) => c.upperQuartile ?? null,
    ),
    // `ChannelFeature` is an open string key, so this can't be columnar.
    [ZARR_V2_CHANNEL.Features]: channels.map((c) => c.features ?? null),
  });

  for (let start = 0; start < channels.length; start += CHANNEL_BATCH_SIZE) {
    const batch = channels.slice(start, start + CHANNEL_BATCH_SIZE);
    const stored = await getChannelData(batch.map((c) => c.id));

    for (const channel of batch) {
      const buffers = stored.get(channel.id);
      if (!buffers) {
        throw new Error(
          `Missing stored pixel data for channel "${channel.id}"; project cannot be saved without it.`,
        );
      }

      const channelGroup = await group.createGroup(channel.id);
      // `bitDepth`, not `Channel.dtype`, selects the view — matches how
      // `useRawImageData` reconstitutes these buffers for rendering.
      const pixels =
        channel.bitDepth === 8
          ? new Uint8Array(buffers.data)
          : new Uint16Array(buffers.data);

      await writeArray(channelGroup, ZARR_V2_DATASET.ChannelData, pixels, [
        channel.height,
        channel.width,
      ]);
      await writeArray(
        channelGroup,
        ZARR_V2_DATASET.ChannelHistogram,
        new Uint32Array(buffers.histogram),
      );
    }

    onProgress(Math.min(1, (start + batch.length) / channels.length));
  }

  if (channels.length === 0) onProgress(1);
};

const writeAnnotationVolumes = async (
  dataGroup: Group,
  volumes: AnnotationVolume[],
) => {
  const group = await dataGroup.createGroup(ZARR_V2_GROUP.AnnotationVolumes);
  await writeAttrs(group, {
    [ZARR_V2_ANNOTATION_VOLUME.Id]: volumes.map((v) => v.id),
    [ZARR_V2_ANNOTATION_VOLUME.ImageId]: volumes.map((v) => v.imageId),
    [ZARR_V2_ANNOTATION_VOLUME.KindId]: volumes.map((v) => v.kindId),
    [ZARR_V2_ANNOTATION_VOLUME.CategoryId]: volumes.map((v) => v.categoryId),
    [ZARR_V2_ANNOTATION_VOLUME.Timepoint]: volumes.map(
      (v) => v.timepoint ?? null,
    ),
    [ZARR_V2_ANNOTATION_VOLUME.PredictionConfidence]: volumes.map(
      (v) => v.predictionConfidence ?? null,
    ),
    [ZARR_V2_ANNOTATION_VOLUME.PredictedAtRunId]: volumes.map(
      (v) => v.predictedAtRunId ?? null,
    ),
    ...predictionCorrectionColumns(volumes.map((v) => v.predictionCorrected)),
  });
};

const writeAnnotations = async (
  dataGroup: Group,
  annotations: AnnotationObject[],
) => {
  const group = await dataGroup.createGroup(ZARR_V2_GROUP.Annotations);

  // `encodedMask` is ragged, so concatenate every RLE run into one dataset and
  // record CSR-style [start, end) offsets. One group per annotation would mean
  // tens of thousands of zip entries on a densely annotated project.
  const totalRuns = annotations.reduce((n, a) => n + a.encodedMask.length, 0);
  const masks = new Uint32Array(totalRuns);
  const offsets = new Array<number>(annotations.length + 1);
  let cursor = 0;
  annotations.forEach((annotation, i) => {
    offsets[i] = cursor;
    masks.set(annotation.encodedMask, cursor);
    cursor += annotation.encodedMask.length;
  });
  offsets[annotations.length] = cursor;

  await writeAttrs(group, {
    [ZARR_V2_ANNOTATION.Id]: annotations.map((a) => a.id),
    [ZARR_V2_ANNOTATION.PlaneId]: annotations.map((a) => a.planeId),
    [ZARR_V2_ANNOTATION.ImageId]: annotations.map((a) => a.imageId),
    [ZARR_V2_ANNOTATION.VolumeId]: annotations.map((a) => a.volumeId),
    [ZARR_V2_ANNOTATION.Partition]: annotations.map((a) => a.partition),
    [ZARR_V2_ANNOTATION.BBox]: annotations.map((a) => a.boundingBox),
    [ZARR_V2_ANNOTATION.MaskOffsets]: offsets,
    ...shapeColumns(annotations.map((a) => a.shape)),
  });

  // zarr can't represent a zero-length array; the reader treats an absent
  // dataset as "no masks", which is consistent with empty offsets.
  if (totalRuns > 0) {
    await writeArray(group, ZARR_V2_DATASET.AnnotationMasks, masks);
  }
};

const writeClassifier = async (root: Group, classifier: ClassifierState) => {
  const group = await root.createGroup(ZARR_V2_GROUP.Classifier);
  const kindIds = Object.keys(classifier.kindClassifiers);
  await writeAttrs(group, { [ZARR_V2_CLASSIFIER.Kinds]: kindIds });

  for (const kindId of kindIds) {
    await writeKindClassifier(
      group,
      kindId,
      classifier.kindClassifiers[kindId],
    );
  }
};

const writeKindClassifier = async (
  classifierGroup: Group,
  kindId: string,
  kindClassifier: KindClassifier,
) => {
  const group = await classifierGroup.createGroup(kindId);
  const modelNames = Object.keys(kindClassifier.modelInfoDict);

  await writeAttrs(group, {
    [ZARR_V2_CLASSIFIER.Models]: modelNames,
    [ZARR_V2_CLASSIFIER.ModelTargetId]: kindClassifier.modelTargetId,
    [ZARR_V2_CLASSIFIER.ModelTargetName]: kindClassifier.modelTargetName,
    [ZARR_V2_CLASSIFIER.ActiveModel]: kindClassifier.activeModel ?? null,
    [ZARR_V2_CLASSIFIER.NewModelArch]: kindClassifier.newModelArch,
    // Lifecycle status is per-session. Persisting "training" or "predicting"
    // would restore a model that looks busy but has no work behind it.
    [ZARR_V2_CLASSIFIER.Status]: "idle",
  });

  for (const modelName of modelNames) {
    const modelGroup = await group.createGroup(modelName);
    await writeAttrs(modelGroup, { [ZARR_V2_MODEL_INFO.Name]: modelName });

    const infoGroup = await modelGroup.createGroup(ZARR_V2_GROUP.ModelInfo);
    await writeModelInfo(infoGroup, kindClassifier.modelInfoDict[modelName]);
  }
};

const writeModelInfo = async (infoGroup: Group, modelInfo: ModelInfo) => {
  await writeAttrs(infoGroup, {
    [ZARR_V2_MODEL_INFO.ClassMap]: classMapEntries(modelInfo.classMap),
    [ZARR_V2_MODEL_INFO.ConfidenceThreshold]: modelInfo.confidenceThreshold,
    [ZARR_V2_MODEL_INFO.Valid]: Number(modelInfo.valid),
    [ZARR_V2_MODEL_INFO.InitSeed]: modelInfo.initSeed ?? null,
    [ZARR_V2_MODEL_INFO.Trained]:
      modelInfo.trained === undefined ? null : Number(modelInfo.trained),
  });

  await writePreprocessSettings(infoGroup, modelInfo.preprocessSettings);
  await writeOptimizerSettings(infoGroup, modelInfo.optimizerSettings);
  await writeRuns(infoGroup, modelInfo.runs);
};

const writePreprocessSettings = async (
  parent: Group,
  settings: PreprocessSettings,
) => {
  const group = await parent.createGroup(ZARR_V2_GROUP.PreprocessSettings);
  const { planes, height, width, channels } = settings.inputShape;

  await writeAttrs(group, {
    [ZARR_V2_PREPROCESS.Shuffle]: Number(settings.shuffle),
    [ZARR_V2_PREPROCESS.TrainingPercent]: settings.trainingPercentage,
    // A plain JSON array, not a Uint8 dataset — the v1.1 writer used Uint8
    // here and silently truncated any input larger than 255x255.
    [ZARR_V2_PREPROCESS.InputShape]: [planes, height, width, channels],
  });

  const normalizeGroup = await group.createGroup(
    ZARR_V2_GROUP.NormalizeOptions,
  );
  await writeAttrs(normalizeGroup, {
    [ZARR_V2_PREPROCESS.Normalize]: Number(settings.normalizeOptions.normalize),
    [ZARR_V2_PREPROCESS.Center]: Number(settings.normalizeOptions.center),
  });

  const cropGroup = await group.createGroup(ZARR_V2_GROUP.CropOptions);
  await writeAttrs(cropGroup, {
    [ZARR_V2_PREPROCESS.NumCrops]: settings.cropOptions.numCrops,
    [ZARR_V2_PREPROCESS.CropSchema]: settings.cropOptions.cropSchema,
  });
};

const writeOptimizerSettings = async (
  parent: Group,
  settings: OptimizerSettings,
) => {
  const group = await parent.createGroup(ZARR_V2_GROUP.OptimizerSettings);
  await writeAttrs(group, {
    [ZARR_V2_OPTIMIZER.LearningRate]: settings.learningRate,
    [ZARR_V2_OPTIMIZER.LossFunction]: settings.lossFunction,
    [ZARR_V2_OPTIMIZER.Metrics]: settings.metrics,
    [ZARR_V2_OPTIMIZER.OptimizationAlgorithm]: settings.optimizationAlgorithm,
    [ZARR_V2_OPTIMIZER.Epochs]: settings.epochs,
    [ZARR_V2_OPTIMIZER.BatchSize]: settings.batchSize,
  });
};

const writeRuns = async (infoGroup: Group, runs: Run[]) => {
  const runsGroup = await infoGroup.createGroup(ZARR_V2_GROUP.Runs);
  await writeAttrs(runsGroup, { [ZARR_V2_RUNS.RunIds]: runs.map((r) => r.id) });

  for (const run of runs) {
    const runGroup = await runsGroup.createGroup(run.id);
    await writeAttrs(runGroup, {
      [ZARR_V2_RUN.Id]: run.id,
      [ZARR_V2_RUN.ParentRunId]: run.parentRunId ?? null,
      [ZARR_V2_RUN.StartedAt]: run.startedAt,
      [ZARR_V2_RUN.FinishedAt]: run.finishedAt ?? null,
      [ZARR_V2_RUN.Status]: run.status,
      [ZARR_V2_RUN.Trigger]: run.trigger,
      [ZARR_V2_RUN.Seed]: run.seed ?? null,
      [ZARR_V2_RUN.AppVersion]: run.appVersion,
      [ZARR_V2_RUN.TfjsVersion]: run.tfjsVersion,
      [ZARR_V2_RUN.Backend]: run.backend,
      [ZARR_V2_RUN.ClassMap]: classMapEntries(run.classMap),
      [ZARR_V2_RUN.TrainingFingerprint]: run.trainingFingerprint,
      [ZARR_V2_RUN.ValidationFingerprint]: run.validationFingerprint,
      [ZARR_V2_RUN.ValIds]: run.valIds,
      [ZARR_V2_RUN.CategorySetHash]: run.categorySetHash,
      [ZARR_V2_RUN.WeightsRef]: run.weightsRef ?? null,
    });

    const hyperGroup = await runGroup.createGroup(
      ZARR_V2_GROUP.Hyperparameters,
    );
    await writeAttrs(hyperGroup, {
      [ZARR_V2_RUN.Architecture]: run.hyperparameters.architecture,
    });
    await writeOptimizerSettings(hyperGroup, run.hyperparameters.optimizer);
    await writePreprocessSettings(hyperGroup, run.hyperparameters.preprocess);

    if (run.history.length > 0) {
      const columns = ZARR_V2_RUN_HISTORY_COLUMNS;
      // Float64 so training metrics survive the round trip untouched — the
      // v1.1 reader had to `toFixed(6)` a learning rate to repair drift.
      const history = new Float64Array(run.history.length * columns.length);
      run.history.forEach((epoch, i) => {
        columns.forEach((column, j) => {
          history[i * columns.length + j] = epoch[column];
        });
      });
      await writeArray(runGroup, ZARR_V2_DATASET.RunHistory, history, [
        run.history.length,
        columns.length,
      ]);
    }

    if (run.evalResults) {
      await writeEvalResults(runGroup, run.evalResults);
    }
  }
};

const writeEvalResults = async (
  runGroup: Group,
  evalResults: NonNullable<Run["evalResults"]>,
) => {
  const group = await runGroup.createGroup(ZARR_V2_GROUP.EvalResults);
  await writeAttrs(group, {
    [ZARR_V2_EVAL.Accuracy]: evalResults.accuracy,
    [ZARR_V2_EVAL.CrossEntropy]: evalResults.crossEntropy,
    [ZARR_V2_EVAL.Precision]: evalResults.precision,
    [ZARR_V2_EVAL.Recall]: evalResults.recall,
    [ZARR_V2_EVAL.F1Score]: evalResults.f1Score,
  });

  const matrix = evalResults.confusionMatrix;
  const rows = matrix.length;
  const cols = rows > 0 ? matrix[0].length : 0;
  if (rows > 0 && cols > 0) {
    const flat = new Int32Array(rows * cols);
    matrix.forEach((row, i) => flat.set(row, i * cols));
    await writeArray(group, ZARR_V2_DATASET.ConfusionMatrix, flat, [
      rows,
      cols,
    ]);
  }
};

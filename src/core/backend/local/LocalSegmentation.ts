import { generateKind, generateUUID } from "core/entities";
import {
  CancelSource,
  TaskCancelledError,
  isTaskCancelledError,
} from "core/dl/cancel";
import { toInferenceInput } from "core/dl/utils";
import { modelInfo } from "core/dl/segmentation/models/modelInfo";

import {
  selectAllKinds,
  selectAnnotationEntities,
  selectAnnotationVolumeEntities,
  selectExtendedImageByIds,
} from "store/data/selectors";

import { createCachedDecoder, isDuplicate } from "utils/iouUtils";
import { logger } from "utils/logUtils";

import { BackendError } from "../errors";

import type {
  AnnotationCategory,
  AnnotationObject,
  AnnotationVolume,
  BBox,
  ExtendedImageObject,
  Kind,
} from "core/entities";
import type { ErrorReason } from "core/dl/types";
import type {
  BuiltinModelName,
  ISegmenterApi,
  ModelDisplayInfo,
  PredictedAnnotationObject,
  SegmentationModelDetails,
} from "core/dl/segmentation/types";

import type { MeasurementsApi } from "utils/measurements/workers/MeasurementsApi";

import type { EventBus } from "../events";
import type { JobRegistry } from "../jobs";
import type {
  BackendSegmentation,
  CallOptions,
  SegmentationModelDescriptor,
  SegmentationRunRequest,
  SegmentationRunSummary,
} from "../types";
import type { StoreHandle } from "./store";

export type MeasurementsProvider = Pick<
  MeasurementsApi,
  "computeFeatures" | "computeIntensityMeasurements"
>;

type Deps = {
  store: StoreHandle;
  /* Resolved on first use so constructing the backend spawns no workers. */
  segmenter: () => ISegmenterApi;
  measurements: () => MeasurementsProvider;
  jobs: JobRegistry;
  bus: EventBus;
};

const toBackendError = (reason: ErrorReason) =>
  new BackendError(reason.code, reason.message, { cause: reason.cause });

/* The worker's DTO plus the static display info the bundled models carry. */
const describe = (
  details: SegmentationModelDetails,
): SegmentationModelDescriptor => {
  const info = modelInfo[details.name as BuiltinModelName] as
    | ModelDisplayInfo
    | undefined;
  return {
    ...details,
    description: info?.description ?? "",
    use: info?.use ?? "",
    sources: info?.sources ?? [],
    // Only present when set: the details panel renders every key it finds.
    ...(info?.cite && { cite: info.cite }),
    ...(info?.cloudWarning && { cloudWarning: info.cloudWarning }),
  };
};

/* Shifts a box whose origin fell outside the image back onto it. */
const clampBox = (bbox: BBox): BBox => {
  const dx = bbox[0] < 0 ? -bbox[0] : 0;
  const dy = bbox[1] < 0 ? -bbox[1] : 0;
  return [bbox[0] + dx, bbox[1] + dy, bbox[2] + dx, bbox[3] + dy];
};

/*
 * Segmentation on the in-browser segmenter worker, including everything that
 * used to happen in the predict hook after inference: resolving the kinds the
 * model named, dropping predictions that duplicate existing objects, measuring
 * the new objects, and announcing them.
 */
export class LocalSegmentation implements BackendSegmentation {
  readonly #deps: Deps;

  constructor(deps: Deps) {
    this.#deps = deps;
  }

  async listModels(): Promise<SegmentationModelDescriptor[]> {
    const result = await this.#deps
      .segmenter()
      .getAvailableSegmentationModels();
    if (!result.success) throw toBackendError(result.reason);
    return Object.values(result.data).map(describe);
  }

  async loadModel(modelId: string, options?: CallOptions): Promise<void> {
    const segmenter = this.#deps.segmenter();
    const info = await segmenter.getModelInfo(modelId);
    if (!info.success) throw toBackendError(info.reason);
    if (info.data.modelLoaded) return;

    const { jobs } = this.#deps;
    const job = jobs.start(
      "model-load",
      `Loading ${info.data.displayName}`,
      options?.signal,
      { cancellable: info.data.cancellableLoad },
    );
    const signal = jobs.signal(job.id);
    if (signal.aborted) {
      jobs.finish(job.id, "cancelled");
      throw new TaskCancelledError();
    }
    // An AbortSignal cannot cross into the worker; its controller lives
    // there and this trips it.
    const onAbort = () => void segmenter.cancelLoadModel(modelId);
    signal.addEventListener("abort", onAbort, { once: true });
    try {
      const result = await segmenter.loadModel(modelId, (percent, message) => {
        options?.onProgress?.({ percent, message });
        jobs.update(job.id, { progress: percent, message });
      });
      if (!result.success) {
        if (result.reason.code === "LOAD_CANCELLED")
          throw new TaskCancelledError(result.reason.message);
        throw toBackendError(result.reason);
      }
      jobs.finish(job.id, "succeeded", { message: "Model loaded" });
    } catch (error) {
      jobs.finish(
        job.id,
        isTaskCancelledError(error) ? "cancelled" : "failed",
        {
          error: (error as Error).message,
        },
      );
      throw error;
    } finally {
      signal.removeEventListener("abort", onAbort);
    }
  }

  async run(
    request: SegmentationRunRequest,
    options?: CallOptions,
  ): Promise<SegmentationRunSummary> {
    const { jobs } = this.#deps;
    const job = jobs.start(
      "segmentation",
      "Beginning segmentation",
      options?.signal,
    );
    try {
      const summary = await this.#run(
        job.id,
        jobs.signal(job.id),
        request,
        options,
      );
      jobs.finish(job.id, summary.cancelled ? "cancelled" : "succeeded", {
        message:
          summary.skipped > 0
            ? `Segmentation finished: ${summary.added} added, ${summary.skipped} skipped as duplicates`
            : `Segmentation finished: ${summary.added} added`,
      });
      return summary;
    } catch (error) {
      jobs.finish(
        job.id,
        isTaskCancelledError(error) ? "cancelled" : "failed",
        {
          error: (error as Error).message,
        },
      );
      throw error;
    }
  }

  async #run(
    jobId: string,
    signal: AbortSignal,
    request: SegmentationRunRequest,
    options?: CallOptions,
  ): Promise<SegmentationRunSummary> {
    const { store, jobs, bus } = this.#deps;
    const segmenter = this.#deps.segmenter();
    const progress = (percent: number, message: string) => {
      options?.onProgress?.({ percent, message });
      jobs.update(jobId, { progress: percent, message });
    };
    const summary = (
      partial: Pick<
        SegmentationRunSummary,
        "added" | "skipped" | "cancelled" | "warnings"
      >,
    ): SegmentationRunSummary => ({ jobId, ...partial });

    if (signal.aborted)
      return summary({ added: 0, skipped: 0, cancelled: true });

    const info = await segmenter.getModelInfo(request.modelId);
    if (!info.success) throw toBackendError(info.reason);
    if (!info.data.modelLoaded) {
      await this.loadModel(request.modelId, {
        signal,
        onProgress: options?.onProgress,
      });
    }

    const images = selectExtendedImageByIds(store.getState(), request.imageIds);
    if (images.length === 0) {
      throw new BackendError("NOT_FOUND", "There are no images to segment");
    }
    // An empty selection means every channel, in image order.
    const channelMetaIds =
      request.channelMetaIds.length > 0 ? request.channelMetaIds : undefined;
    const inputs = images.map((image) =>
      toInferenceInput(image, channelMetaIds),
    );

    const cancel = new CancelSource();
    const onAbort = () => cancel.signal();
    signal.addEventListener("abort", onAbort, { once: true });
    progress(-1, "Starting inference...");
    let predicted: PredictedAnnotationObject[][];
    let cancelled: boolean;
    try {
      const result = await segmenter.predict(
        request.modelId,
        inputs,
        cancel.token,
        progress,
        request.options,
        request.kindName,
      );
      if (!result.success) throw toBackendError(result.reason);
      predicted = result.data.annotations;
      cancelled = !!result.data.cancelled;
    } finally {
      signal.removeEventListener("abort", onAbort);
    }

    const { kinds, volumes, annotations, skipped } = this.#toEntities(
      images,
      predicted,
    );
    if (kinds.length > 0) bus.emit({ type: "kinds/didAdd", kinds });

    progress(-1, `Processing ${annotations.length} annotations`);
    const warnings = await this.#measure(images, annotations);
    if (annotations.length > 0) {
      bus.emit({ type: "annotations/didAdd", volumes, annotations });
    }
    return summary({ added: annotations.length, skipped, cancelled, warnings });
  }

  /*
   * Builds the volumes and annotations to add. Kinds the model named that the
   * project lacks are generated here; the result's `kinds` are the new ones.
   * The store is read after inference, since the user may have edited
   * annotations while it ran.
   */
  #toEntities(
    images: ExtendedImageObject[],
    predicted: PredictedAnnotationObject[][],
  ): {
    kinds: Array<{ kind: Kind; category: AnnotationCategory }>;
    volumes: AnnotationVolume[];
    annotations: AnnotationObject[];
    skipped: number;
  } {
    const state = this.#deps.store.getState();
    const existingKinds = selectAllKinds(state);
    const annotationEntities = selectAnnotationEntities(state);
    const volumeEntities = selectAnnotationVolumeEntities(state);

    const kindByName = new Map(existingKinds.map((kind) => [kind.name, kind]));
    const newKinds: Array<{ kind: Kind; category: AnnotationCategory }> = [];
    for (const name of new Set(predicted.flat().map((ann) => ann.kindName))) {
      if (kindByName.has(name)) continue;
      const { kind, unknownCategory } = generateKind(name);
      kindByName.set(name, kind);
      newKinds.push({ kind, category: unknownCategory });
    }

    const volumes: AnnotationVolume[] = [];
    const annotations: AnnotationObject[] = [];
    let skipped = 0;

    // The project's objects, by image, so that a run over many images reads
    // the annotation table once rather than once per image.
    const existingByImage = new Map<string, AnnotationObject[]>();
    for (const ann of Object.values(annotationEntities)) {
      if (!ann) continue;
      const group = existingByImage.get(ann.imageId);
      if (group) group.push(ann);
      else existingByImage.set(ann.imageId, [ann]);
    }

    for (const [i, imageAnnotations] of predicted.entries()) {
      const image = images[i];
      const existingByKind: Record<string, AnnotationObject[]> = {};
      for (const ann of existingByImage.get(image.id) ?? []) {
        if (ann.planeId !== image.activePlaneId) continue;
        const kindId = volumeEntities[ann.volumeId]?.kindId;
        if (kindId) (existingByKind[kindId] ??= []).push(ann);
      }
      const decode = createCachedDecoder();

      for (const { kindName, ...prediction } of imageAnnotations) {
        const boundingBox = clampBox(prediction.boundingBox);
        const width = boundingBox[2] - boundingBox[0];
        const height = boundingBox[3] - boundingBox[1];
        if (boundingBox[1] + height > image.shape.height) continue;

        const kind = kindByName.get(kindName)!;
        const candidate = { ...prediction, boundingBox };
        if (isDuplicate(candidate, existingByKind[kind.id] ?? [], decode)) {
          skipped++;
          continue;
        }
        const volume: AnnotationVolume = {
          id: generateUUID(),
          kindId: kind.id,
          imageId: image.id,
          categoryId: kind.unknownCategoryId,
        };
        volumes.push(volume);
        annotations.push({
          ...candidate,
          shape: { planes: 1, channels: image.shape.channels, width, height },
          imageId: image.id,
          planeId: image.activePlaneId,
          volumeId: volume.id,
        });
      }
    }

    return { kinds: newKinds, volumes, annotations, skipped };
  }

  /* Attaches shape features and per-channel intensities; failure is a warning. */
  async #measure(
    images: ExtendedImageObject[],
    annotations: AnnotationObject[],
  ): Promise<string[]> {
    if (annotations.length === 0) return [];
    const byImage = new Map<string, AnnotationObject[]>();
    for (const ann of annotations) {
      (
        byImage.get(ann.imageId) ??
        byImage.set(ann.imageId, []).get(ann.imageId)!
      ).push(ann);
    }
    const batches = images
      .filter((image) => byImage.has(image.id))
      .map((image) => ({
        channelRefs: image.channelsRef.map((c) => ({ id: c.id })),
        objs: byImage.get(image.id)!,
      }));
    try {
      const measurements = this.#deps.measurements();
      const [features, intensities] = await Promise.all([
        measurements.computeFeatures(annotations),
        measurements.computeIntensityMeasurements(batches),
      ]);
      for (const ann of annotations) {
        if (features[ann.id]) ann.features = features[ann.id];
        if (intensities[ann.id])
          ann.intensityMeasurements = intensities[ann.id];
      }
      return [];
    } catch (error) {
      logger(["[LocalSegmentation] measurement computation failed", error], {
        level: "warn",
      });
      return [
        "Predicted annotations were added, but their measurements could not be computed.",
      ];
    }
  }
}

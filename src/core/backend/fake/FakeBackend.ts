import {
  STORES,
  UNKNOWN_IMAGE_CATEGORY,
  UNKNOWN_KIND,
  UNKNOWN_KIND_CATEGORY,
  generateKind,
  generateUUID,
  nextPartition,
  predictionCorrection,
  representsUnknown,
} from "core/entities";
import { Partition } from "core/dl/enums";
import {
  CancelSource,
  TaskCancelledError,
  isTaskCancelledError,
} from "core/dl/cancel";
import { loadProject } from "core/file-io/project-loader/loadProject";
import { writeV2 } from "core/file-io/project-saver/version-writers/writeV2";
import { PiximiStore } from "core/file-io/zarr/stores";
import { inlineImageDecoder } from "core/file-io/file-loader/decoders";
import {
  inferMimeType,
  isTiffFile,
} from "core/file-io/file-loader/fileInputUtils";
import { buildAnnotationExport } from "core/file-io/export/runAnnotationExport";
import { analyzeTiff } from "core/file-io/file-loader/readers/TiffReader";
import { MIME } from "core/file-io/file-loader/types";
import { defaultClassifier } from "core/dl/classification/utils";
import { CHANNEL_MODE } from "core/dl/segmentation/optionUtils";
import { OUTPUT_MODE } from "core/dl/segmentation/models/consts";

import { classifierSlice } from "store/classifier";
import { IMAGE_CLASSIFIER_ID } from "store/classifier/constants";
import { segmenterSlice } from "store/segmenter";

import { compositeChannelsToDataUrl } from "utils/image/compositeChannels";
import { decodeRleArray } from "utils/image/rle";
import { computeObjectFeatures } from "utils/measurements/computeObjectFeatures";
import { computeStatistics } from "utils/measurements/statistics";

import {
  fingerprintItems,
  hashCategorySet,
  splitForTraining,
} from "../classification";
import { BackendError } from "../errors";
import { parseMeasurementColumn } from "../measurements/columns";
import { EventBus } from "../events";
import { JobRegistry } from "../jobs";
import {
  countBy,
  filterAnnotations,
  filterImages,
  marginOf,
  paginate,
  sortAnnotations,
  sortImages,
} from "../query";

import type {
  AnnotationCategory,
  AnnotationObject,
  AnnotationVolume,
  BBox,
  Category,
  Channel,
  ChannelMeta,
  Experiment,
  ImageObject,
  ImageSeries,
  IntensityMeasurement,
  Kind,
  ObjectFeature,
  Plane,
} from "core/entities";
import type {
  Classifier,
  EvaluationResult,
  Run,
} from "core/dl/classification/types";
import type { LoadAndPrepareOutput } from "core/file-io/file-loader/types";
import type { ExportedAnnotation } from "core/file-io/export/types";
import type {
  ChannelDataAccessor,
  SerializableProject,
} from "core/file-io/project-saver/types";

import type { StoredPixels } from "utils/image/compositeChannels";

import type { Capability } from "../capabilities";
import type { BackendEventListener } from "../events";
import type { Job } from "../jobs";
import type { AnnotationContext, AnnotationRow, ImageContext } from "../query";
import type {
  AnnotationCountGroup,
  AnnotationQuery,
  AnnotationRecord,
  AnnotationSort,
  AnnotationChangeSet,
  AnnotationHeader,
  AnnotationUpdate,
  Backend,
  BackendClassification,
  BackendMeasurements,
  BackendSession,
  CallOptions,
  Changed,
  CommitConflict,
  CommitResult,
  ClassifierCreateRequest,
  ClassifierFitRequest,
  ClassifierFitSummary,
  ClassifierPredictRequest,
  ClassifierPredictSummary,
  ClassifierUpdateRequest,
  ModelDescriptor,
  Counts,
  Deleted,
  EntityRef,
  ImageChange,
  ImageCountGroup,
  ImageQuery,
  ImageRecord,
  ImageSort,
  MeasurementTable,
  MeasurementTableRequest,
  MeasurementsComputeRequest,
  MeasurementsComputeSummary,
  ImageUpdate,
  Page,
  PageRequest,
  ProjectSummary,
  RawChannelData,
  RenderRequest,
  RenderResult,
  RenderedImage,
  SegmentationModelDescriptor,
  SegmentationRunRequest,
  SegmentationRunSummary,
  VolumeUpdate,
  BackendIngest,
  IngestFailure,
  AddPathsRequest,
  DirectoryEntry,
  DirectoryListing,
  IngestSummary,
  PathInspection,
  UploadFile,
  BackendExport,
  BackendProject,
  ProjectInfo,
} from "../types";

type FakeSnapshot = {
  experiment: Experiment;
  series: ImageSeries[];
  images: ImageObject[];
  planes: Plane[];
  channels: Channel[];
  channelMetas: ChannelMeta[];
  pixels: Map<string, StoredPixels>;
  kinds: Kind[];
  categories: Category[];
  volumes: AnnotationVolume[];
  annotations: AnnotationObject[];
  classifiers: Classifier[];
};

type FakeProjectEntry = {
  name: string;
  createdAt: number;
  openedAt?: number;
  /* Absent for the open project, whose state is the backend's own. */
  snapshot: FakeSnapshot | null;
};

type FakeImageSeed = {
  id: string;
  width: number;
  height: number;
  channels: number;
};

export const FAKE_MODEL_ID = "fake-whole-image";
const FAKE_ARCHITECTURE_ID = "fake-majority";

/* An item as the fake's classifier sees it, whatever the target. */
type Labeled = { id: string; categoryId: string; partition: Partition };

/* The statistics a real backend computes, over the fake's 8-bit pixels;
 * with a mask and box, over the object's pixels alone. */
const intensityStatistics = (
  pixels: StoredPixels,
  region?: { mask: Uint8Array | Uint16Array; bbox: BBox },
): Partial<Record<IntensityMeasurement, number>> => {
  const all = new Uint8Array(pixels.data);
  let values: number[];
  if (region) {
    const [x0, y0, x1, y1] = region.bbox;
    values = [];
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        if (region.mask[(y - y0) * (x1 - x0) + (x - x0)]) {
          values.push(all[y * pixels.width + x]);
        }
      }
    }
  } else {
    values = Array.from(all);
  }
  if (values.length < 4) return {};
  const { mean, median, std, min, max, lowerQuartile, upperQuartile } =
    computeStatistics(values);
  const mad = computeStatistics(
    values.map((value) => Math.abs(value - median)),
  ).median;
  return {
    maxValue: max,
    minValue: min,
    total: values.reduce((sum, value) => sum + value, 0),
    mean,
    median,
    std,
    mad,
    lowerQuartile,
    upperQuartile,
  };
};

/* The shape features of a mask covering the whole image. */
const wholeImageFeatures = (
  width: number,
  height: number,
): Partial<Record<ObjectFeature, number>> => {
  const area = width * height;
  const perimeter = 2 * (width + height);
  const eqpc = 2 * Math.sqrt(area / Math.PI);
  const ped = perimeter / Math.PI;
  const sphericity = eqpc / ped;
  return {
    area,
    bboxArea: area,
    extent: 1,
    perimeter,
    eqpc,
    ped,
    sphericity,
    radius: ped / 2,
    compactness: 1 / sphericity,
    comX: (width - 1) / 2,
    comY: (height - 1) / 2,
  };
};

/*
 * A complete in-memory backend with no workers, no IndexedDB and no models,
 * for exercising everything above the Backend interface: the conformance
 * suite, store sync, and hooks. Its one "model" labels each image with a
 * single whole-image object, which is enough to drive the event and job
 * paths end to end.
 */
export class FakeBackend implements Backend {
  readonly kind = "local" as const;
  readonly capabilities: readonly Capability[];
  readonly session: BackendSession = {
    id: generateUUID(),
    protocolVersion: "0.0.0-fake",
  };

  readonly #bus = new EventBus();
  readonly #jobs = new JobRegistry(this.#bus);

  #experiment: Experiment = { id: "fake-experiment", name: "Fake" };
  #series: ImageSeries[] = [];
  #images: ImageObject[] = [];
  #planes: Plane[] = [];
  #channels: Channel[] = [];
  #channelMetas: ChannelMeta[] = [];
  #pixels = new Map<string, StoredPixels>();
  #kinds: Kind[] = [UNKNOWN_KIND];
  #categories: Category[] = [UNKNOWN_IMAGE_CATEGORY, UNKNOWN_KIND_CATEGORY];
  #volumes: AnnotationVolume[] = [];
  #annotations: AnnotationObject[] = [];
  /* One counter stamps every geometry, category and kind write. */
  #rev = 0;
  #modelLoaded = false;
  #classifiers: Classifier[] = [];
  /* What each fitted classifier learned: the majority class and the shares. */
  #learned = new Map<string, { categoryId: string; softmax: number[] }>();
  /* The distributions behind pending predictions, for the softmax sort. */
  #softmax = new Map<string, number[]>();

  /* A pretend filesystem for `ingest.paths`: files by absolute path. */
  readonly #files = new Map<string, ArrayBuffer>();
  readonly #roots: string[] = [];
  /* Server paths already added, as the engine's `sources` table. */
  readonly #sources = new Map<string, string[]>();

  constructor(seed: {
    images: FakeImageSeed[];
    /* Files to browse and add from, under one root; declares `ingest.paths`. */
    files?: { root: string; files: Record<string, ArrayBuffer> };
  }) {
    const channelCount = Math.max(0, ...seed.images.map((im) => im.channels));
    if (channelCount > 0) this.#experiment.channels = channelCount;
    if (seed.files) {
      this.#roots.push(seed.files.root);
      for (const [relative, data] of Object.entries(seed.files.files)) {
        this.#files.set(`${seed.files.root}/${relative}`, data);
      }
    }
    this.capabilities = [
      "raw-local",
      "segmentation",
      "classification",
      "classification.train",
      "measurements",
      "ingest.upload",
      "export.annotations",
      "project.io",
      "project.workspace",
      ...(seed.files ? (["ingest.paths"] as const) : []),
    ];
    this.#projectId = generateUUID();
    this.#workspace.set(this.#projectId, {
      name: this.#experiment.name,
      createdAt: Date.now(),
      snapshot: null,
    });
    this.ingest = {
      upload: (files, options) => this.#runIngest(files, options),
      ...(seed.files && {
        browse: async (path?: string) => this.#browse(path),
        inspect: async (paths: string[]) => this.#inspect(paths),
        addPaths: (request, options) => this.#addPaths(request, options),
      }),
    };
    for (let c = 0; c < channelCount; c++) {
      this.#channelMetas.push({
        id: `meta-${c}`,
        name: `Channel-${c}`,
        bitDepth: 8,
        colorMap: [c === 0 ? 1 : 0, c === 1 ? 1 : 0, c >= 2 ? 1 : 0],
        visible: true,
        minValue: 0,
        maxValue: 255,
        rampMin: 0,
        rampMax: 255,
        rampMinLimit: 0,
        rampMaxLimit: 255,
      });
    }
    for (const im of seed.images) this.#seedImage(im);
  }

  #seedImage({ id, width, height, channels }: FakeImageSeed) {
    const seriesId = `${id}-series`;
    const planeId = `${id}-plane`;
    const shape = { planes: 1, height, width, channels };
    this.#series.push({
      id: seriesId,
      experimentId: this.#experiment.id,
      name: id,
      bitDepth: 8,
      shape,
      timeSeries: false,
      activeImageId: id,
    });
    this.#images.push({
      id,
      name: id,
      seriesId,
      shape,
      categoryId: UNKNOWN_IMAGE_CATEGORY.id,
      activePlaneId: planeId,
      timepoint: 0,
      bitDepth: 8,
      partition: Partition.Unassigned,
    });
    this.#planes.push({ id: planeId, imageId: id, zIndex: 0 });
    for (let c = 0; c < channels; c++) {
      const channelId = `${id}-ch${c}`;
      // A horizontal ramp, offset per channel, so composites are not uniform.
      const data = new Uint8Array(width * height);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.floor(((i % width) / width) * 255) + c * 64) % 256;
      }
      const pixels: StoredPixels = {
        data: data.buffer,
        width,
        height,
        bitDepth: 8,
      };
      this.#pixels.set(channelId, pixels);
      this.#channels.push({
        id: channelId,
        planeId,
        channelMetaId: `meta-${c}`,
        name: `Channel-${c}`,
        dtype: "uint8",
        bitDepth: 8,
        width,
        height,
        ...intensityStatistics(pixels),
        minValue: 0,
        maxValue: 255,
        storageReference: {
          storageId: channelId,
          storeName: STORES.CHANNEL_DATA,
          width,
          height,
          dtype: "uint8",
          byteSize: data.byteLength,
        },
      });
    }
  }

  async connect(): Promise<void> {}

  async dispose(): Promise<void> {}

  subscribe(listener: BackendEventListener): () => void {
    return this.#bus.subscribe(listener);
  }

  // ── Query ──────────────────────────────────────────────────────────────────

  #imageContext(): ImageContext {
    const categories = new Map(this.#categories.map((c) => [c.id, c]));
    const annotated = new Set(this.#annotations.map((a) => a.imageId));
    return {
      categoryName: (id) => categories.get(id)?.name ?? "",
      isAnnotated: (id) => annotated.has(id),
      softmaxMargin: (id) => {
        const probabilities = this.#softmax.get(id);
        return probabilities && marginOf(probabilities);
      },
    };
  }

  #annotationContext(): AnnotationContext {
    const categories = new Map(this.#categories.map((c) => [c.id, c]));
    const images = new Map(this.#images.map((im) => [im.id, im]));
    const planes = new Map(this.#planes.map((p) => [p.id, p]));
    return {
      categoryName: (id) => categories.get(id)?.name ?? "",
      imageName: (id) => images.get(id)?.name ?? "",
      planeZIndex: (id) => planes.get(id)?.zIndex ?? -Infinity,
      softmaxMargin: (id) => {
        const probabilities = this.#softmax.get(id);
        return probabilities && marginOf(probabilities);
      },
    };
  }

  #imageListing(query: ImageQuery, sort?: ImageSort): ImageObject[] {
    const ctx = this.#imageContext();
    return sortImages(filterImages(this.#images, query, ctx), sort, ctx);
  }

  #annotationListing(
    query: AnnotationQuery,
    sort?: AnnotationSort,
  ): AnnotationRow[] {
    const volumes = new Map(this.#volumes.map((v) => [v.id, v]));
    const rows = this.#annotations.map(
      ({ encodedMask: _mask, decodedMask: _decoded, ...annotation }) => ({
        annotation,
        volume: volumes.get(annotation.volumeId)!,
      }),
    );
    return sortAnnotations(
      filterAnnotations(rows, query),
      sort,
      this.#annotationContext(),
    );
  }

  #record(image: ImageObject): ImageRecord {
    const planes = this.#planes.filter((p) => p.imageId === image.id);
    const planeIds = new Set(planes.map((p) => p.id));
    return {
      image,
      series: this.#series.find((s) => s.id === image.seriesId)!,
      planes,
      channels: this.#channels.filter((c) => planeIds.has(c.planeId)),
    };
  }

  readonly query = {
    project: async (): Promise<ProjectSummary> => ({
      experiment: this.#experiment,
      kinds: [...this.#kinds],
      categories: [...this.#categories],
      channelMetas: [...this.#channelMetas],
      counts: {
        images: this.#images.length,
        annotations: this.#annotations.length,
      },
    }),

    images: async (
      query: ImageQuery,
      page: PageRequest,
      sort?: ImageSort,
    ): Promise<Page<ImageRecord>> => {
      const { items, total } = paginate(this.#imageListing(query, sort), page);
      return { total, items: items.map((im) => this.#record(im)) };
    },

    imageIds: async (query: ImageQuery, sort?: ImageSort): Promise<string[]> =>
      this.#imageListing(query, sort).map((im) => im.id),

    imageCounts: async (
      query: ImageQuery,
      groupBy?: ImageCountGroup,
    ): Promise<Counts> => {
      const rows = this.#imageListing(query);
      return {
        total: rows.length,
        groups:
          groupBy &&
          countBy(rows, (im) =>
            groupBy === "category" ? im.categoryId : im.partition,
          ),
      };
    },

    annotations: async (
      query: AnnotationQuery,
      page: PageRequest,
      sort?: AnnotationSort,
    ): Promise<Page<AnnotationRecord>> =>
      paginate(this.#annotationListing(query, sort), page),

    annotationIds: async (
      query: AnnotationQuery,
      sort?: AnnotationSort,
    ): Promise<string[]> =>
      this.#annotationListing(query, sort).map((row) => row.annotation.id),

    annotationCounts: async (
      query: AnnotationQuery,
      groupBy?: AnnotationCountGroup,
    ): Promise<Counts> => {
      const rows = this.#annotationListing(query);
      return {
        total: rows.length,
        groups:
          groupBy &&
          countBy(rows, ({ annotation, volume }) =>
            groupBy === "kind"
              ? volume.kindId
              : groupBy === "category"
                ? volume.categoryId
                : annotation.partition,
          ),
      };
    },

    masks: async (
      annotationIds: string[],
    ): Promise<Record<string, number[]>> => {
      const wanted = new Set(annotationIds);
      return Object.fromEntries(
        this.#annotations
          .filter((ann) => wanted.has(ann.id))
          .map((ann) => [ann.id, ann.encodedMask]),
      );
    },
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  #renderOne(request: RenderRequest): RenderedImage {
    const layers = request.channels
      .filter((c) => c.visible)
      .map(({ channelId, colorMap, rampMin, rampMax }) => ({
        pixelKey: channelId,
        colorMap,
        rampMin,
        rampMax,
      }));
    if (layers.length === 0) {
      throw new BackendError("NOT_FOUND", "No visible channels to render");
    }
    const first = this.#pixels.get(layers[0].pixelKey);
    if (!first) {
      throw new BackendError(
        "NOT_FOUND",
        `Unknown channel ${layers[0].pixelKey}`,
      );
    }
    const [x0, y0, x1, y1] = request.region ?? [
      0,
      0,
      first.width,
      first.height,
    ];
    return {
      width: x1 - x0,
      height: y1 - y0,
      dataUrl: compositeChannelsToDataUrl(layers, this.#pixels, request.region),
    };
  }

  async *#thumbnails(
    requests: RenderRequest[],
    options?: CallOptions,
  ): AsyncIterable<RenderResult> {
    for (const [index, request] of requests.entries()) {
      if (options?.signal?.aborted) return;
      try {
        yield { index, ok: true, image: this.#renderOne(request) };
      } catch (error) {
        yield { index, ok: false, error: error as Error };
      }
    }
  }

  readonly render = {
    image: async (request: RenderRequest): Promise<RenderedImage> =>
      this.#renderOne(request),

    thumbnails: (
      requests: RenderRequest[],
      options?: CallOptions,
    ): AsyncIterable<RenderResult> => this.#thumbnails(requests, options),

    raw: async (channelIds: string[]): Promise<RawChannelData[]> =>
      channelIds.map((channelId) => {
        const stored = this.#pixels.get(channelId);
        if (!stored) {
          throw new BackendError("NOT_FOUND", `Unknown channel ${channelId}`);
        }
        return {
          channelId,
          bitDepth: stored.bitDepth,
          width: stored.width,
          height: stored.height,
          data: new Uint8Array(stored.data),
        };
      }),
  };

  // ── Mutations ──────────────────────────────────────────────────────────────

  readonly images = {
    delete: async (query: ImageQuery): Promise<Deleted> => {
      const ids = new Set(this.#imageListing(query).map((im) => im.id));
      if (ids.size === 0) return { deleted: 0 };
      const planeIds = new Set(
        this.#planes.filter((p) => ids.has(p.imageId)).map((p) => p.id),
      );
      for (const channel of this.#channels) {
        if (planeIds.has(channel.planeId)) this.#pixels.delete(channel.id);
      }
      this.#channels = this.#channels.filter((c) => !planeIds.has(c.planeId));
      this.#planes = this.#planes.filter((p) => !ids.has(p.imageId));
      this.#annotations = this.#annotations.filter((a) => !ids.has(a.imageId));
      this.#volumes = this.#volumes.filter((v) => !ids.has(v.imageId));
      this.#images = this.#images.filter((im) => !ids.has(im.id));
      const used = new Set(this.#images.map((im) => im.seriesId));
      this.#series = this.#series.filter((s) => used.has(s.id));
      this.#bus.emit({ type: "images/didRemove", imageIds: [...ids] });
      return { deleted: ids.size };
    },

    categorize: async (
      query: ImageQuery,
      categoryId: string,
    ): Promise<Changed> => {
      const category = this.#category(categoryId);
      if (category.type !== "image") {
        throw new BackendError("NOT_FOUND", "Not an image category");
      }
      const updates: ImageUpdate[] = [];
      for (const image of this.#imageListing(query)) {
        if (image.categoryId === categoryId) continue;
        const corrected = predictionCorrection(
          image.categoryId,
          categoryId,
          {
            predictedAtRunId: image.predictedAtRunId,
            predictionConfidence: image.predictionConfidence,
          },
          image.predictionCorrected,
        );
        image.partition = nextPartition(categoryId, image.partition, false);
        image.categoryId = categoryId;
        delete image.predictionConfidence;
        delete image.predictedAtRunId;
        if (corrected) image.predictionCorrected = corrected;
        else delete image.predictionCorrected;
        updates.push({
          id: image.id,
          categoryId,
          partition: image.partition,
          ...(corrected && { predictionCorrected: corrected }),
        });
      }
      if (updates.length > 0) {
        this.#bus.emit({ type: "images/didUpdate", updates });
      }
      return { changed: updates.length };
    },

    update: async (updates: ImageChange[]): Promise<ImageObject[]> => {
      const changed: ImageObject[] = [];
      for (const update of updates) {
        const image = this.#images.find((im) => im.id === update.id);
        if (!image) {
          throw new BackendError("NOT_FOUND", `Unknown image ${update.id}`);
        }
        let touched = false;
        if (update.name !== undefined && update.name !== image.name) {
          if (!update.name.trim()) {
            throw new BackendError("NOT_SUPPORTED", "An image needs a name");
          }
          image.name = update.name;
          touched = true;
        }
        if (
          update.partition !== undefined &&
          update.partition !== image.partition
        ) {
          image.partition = update.partition;
          touched = true;
        }
        if (
          update.activePlaneId !== undefined &&
          update.activePlaneId !== image.activePlaneId
        ) {
          const plane = this.#planes.find((p) => p.id === update.activePlaneId);
          if (!plane || plane.imageId !== image.id) {
            throw new BackendError(
              "NOT_FOUND",
              `${update.activePlaneId} is not a plane of ${image.name}`,
            );
          }
          image.activePlaneId = update.activePlaneId;
          touched = true;
        }
        if (touched) changed.push(image);
      }
      if (changed.length > 0) {
        this.#bus.emit({ type: "images/didChange", images: [...changed] });
      }
      return updates.map(
        (update) => this.#images.find((im) => im.id === update.id)!,
      );
    },
  };

  readonly annotations = {
    delete: async (query: AnnotationQuery): Promise<Deleted> => {
      const ids = new Set(
        this.#annotationListing(query).map((row) => row.annotation.id),
      );
      if (ids.size === 0) return { deleted: 0 };
      this.#annotations = this.#annotations.filter((a) => !ids.has(a.id));
      const used = new Set(this.#annotations.map((a) => a.volumeId));
      const volumeIds = this.#volumes
        .filter((v) => !used.has(v.id))
        .map((v) => v.id);
      this.#volumes = this.#volumes.filter((v) => used.has(v.id));
      this.#bus.emit({
        type: "annotations/didRemove",
        annotationIds: [...ids],
        volumeIds,
      });
      return { deleted: ids.size };
    },

    categorize: async (
      query: AnnotationQuery,
      categoryId: string,
    ): Promise<Changed> => {
      const category = this.#category(categoryId);
      if (category.type !== "annotation") {
        throw new BackendError("NOT_FOUND", "Not an object category");
      }
      const rows = this.#annotationListing(query);
      const moved = new Set<string>();
      const volumes: VolumeUpdate[] = [];
      for (const row of rows) {
        const volume = this.#volumes.find((v) => v.id === row.volume.id)!;
        if (volume.categoryId === categoryId || moved.has(volume.id)) continue;
        moved.add(volume.id);
        volumes.push(this.#moveVolume(volume, category));
      }
      if (moved.size === 0) return { changed: 0 };
      this.#bus.emit({
        type: "annotations/didUpdate",
        volumes,
        annotations: this.#repartition(moved, categoryId),
      });
      return {
        changed: rows.filter((row) => moved.has(row.volume.id)).length,
      };
    },

    commit: async (
      changeSet: AnnotationChangeSet,
      options?: CallOptions,
    ): Promise<CommitResult> => this.#commit(changeSet, options),

    update: async (updates: AnnotationUpdate[]): Promise<Changed> => {
      const changed: AnnotationUpdate[] = [];
      for (const update of updates) {
        const annotation = this.#annotations.find((a) => a.id === update.id);
        if (!annotation) {
          throw new BackendError(
            "NOT_FOUND",
            `Unknown annotation ${update.id}`,
          );
        }
        if (annotation.partition === update.partition) continue;
        annotation.partition = update.partition;
        changed.push({ id: annotation.id, partition: annotation.partition });
      }
      if (changed.length > 0) {
        this.#bus.emit({
          type: "annotations/didUpdate",
          volumes: [],
          annotations: changed,
        });
      }
      return { changed: changed.length };
    },
  };

  readonly kinds = {
    create: async (
      kinds: Array<{ kind: Kind; category: AnnotationCategory }>,
    ): Promise<Kind[]> => {
      const names = new Set(this.#kinds.map((kind) => kind.name));
      for (const { kind, category } of kinds) {
        if (this.#kinds.some((k) => k.id === kind.id)) {
          throw new BackendError(
            "NOT_SUPPORTED",
            `A kind ${kind.id} already exists`,
          );
        }
        if (names.has(kind.name)) {
          throw new BackendError(
            "NOT_SUPPORTED",
            `A kind named ${JSON.stringify(kind.name)} already exists`,
          );
        }
        if (
          category.kindId !== kind.id ||
          category.id !== kind.unknownCategoryId ||
          !category.isUnknown
        ) {
          throw new BackendError(
            "NOT_SUPPORTED",
            `Kind ${JSON.stringify(kind.name)} must come with its unknown category`,
          );
        }
        names.add(kind.name);
      }
      if (kinds.length > 0) {
        this.#kinds.push(...kinds.map(({ kind }) => kind));
        this.#categories.push(...kinds.map(({ category }) => category));
        this.#bus.emit({ type: "kinds/didAdd", kinds });
      }
      return kinds.map(({ kind }) => kind);
    },

    update: async (id: string, name: string): Promise<Kind> => {
      const kind = this.#kinds.find((k) => k.id === id);
      if (!kind) throw new BackendError("NOT_FOUND", `Unknown kind ${id}`);
      if (kind.id === UNKNOWN_KIND.id) {
        throw new BackendError(
          "NOT_SUPPORTED",
          "The reserved unknown kind keeps its name",
        );
      }
      if (!name.trim()) {
        throw new BackendError("NOT_SUPPORTED", "A kind needs a name");
      }
      if (this.#kinds.some((k) => k.name === name && k.id !== id)) {
        throw new BackendError(
          "NOT_SUPPORTED",
          `A kind named ${JSON.stringify(name)} already exists`,
        );
      }
      if (name !== kind.name) {
        kind.name = name;
        this.#bus.emit({ type: "kinds/didChange", kinds: [...this.#kinds] });
      }
      return kind;
    },

    delete: async (ids: string[]): Promise<Deleted> => {
      const gone = this.#kinds.filter(
        (kind) => ids.includes(kind.id) && kind.id !== UNKNOWN_KIND.id,
      );
      if (gone.length === 0) return { deleted: 0 };
      const kindIds = new Set(gone.map((kind) => kind.id));
      const volumes: VolumeUpdate[] = [];
      for (const volume of this.#volumes) {
        if (!kindIds.has(volume.kindId)) continue;
        volume.kindId = UNKNOWN_KIND.id;
        volume.categoryId = UNKNOWN_KIND_CATEGORY.id;
        volume.rev = ++this.#rev;
        const { id, kindId, categoryId, predictionCorrected, rev } = volume;
        volumes.push({
          id,
          kindId,
          categoryId,
          ...(predictionCorrected && { predictionCorrected }),
          rev,
        });
      }
      this.#categories = this.#categories.filter(
        (category) =>
          category.type !== "annotation" || !kindIds.has(category.kindId),
      );
      this.#kinds = this.#kinds.filter((kind) => !kindIds.has(kind.id));
      const classifiers = this.#classifiers.filter((classifier) =>
        kindIds.has(classifier.targetId),
      );
      this.#classifiers = this.#classifiers.filter(
        (classifier) => !kindIds.has(classifier.targetId),
      );
      if (volumes.length > 0) {
        this.#bus.emit({
          type: "annotations/didUpdate",
          volumes,
          annotations: [],
        });
      }
      this.#categoriesChanged();
      if (classifiers.length > 0) this.#classifiersChanged();
      this.#bus.emit({ type: "kinds/didRemove", kindIds: [...kindIds] });
      return { deleted: gone.length };
    },
  };

  // ── Projects ────────────────────────────────────────────────────────────
  //
  // A pretend workspace: the open project lives in the arrays above, the
  // others as snapshots of them. Export and import run the browser's own
  // writer and reader on this thread, so the file is the real format.

  readonly #workspace = new Map<string, FakeProjectEntry>();
  #projectId = "";

  #snapshot(): FakeSnapshot {
    return {
      experiment: this.#experiment,
      series: [...this.#series],
      images: [...this.#images],
      planes: [...this.#planes],
      channels: [...this.#channels],
      channelMetas: [...this.#channelMetas],
      pixels: new Map(this.#pixels),
      kinds: [...this.#kinds],
      categories: [...this.#categories],
      volumes: [...this.#volumes],
      annotations: [...this.#annotations],
      classifiers: [...this.#classifiers],
    };
  }

  #restore(snapshot: FakeSnapshot | null, name: string) {
    this.#experiment = snapshot?.experiment ?? {
      id: generateUUID(),
      name,
    };
    this.#series = snapshot?.series ?? [];
    this.#images = snapshot?.images ?? [];
    this.#planes = snapshot?.planes ?? [];
    this.#channels = snapshot?.channels ?? [];
    this.#channelMetas = snapshot?.channelMetas ?? [];
    this.#pixels = snapshot?.pixels ?? new Map();
    this.#kinds = snapshot?.kinds ?? [UNKNOWN_KIND];
    this.#categories = snapshot?.categories ?? [
      UNKNOWN_IMAGE_CATEGORY,
      UNKNOWN_KIND_CATEGORY,
    ];
    this.#volumes = snapshot?.volumes ?? [];
    this.#annotations = snapshot?.annotations ?? [];
    this.#classifiers = snapshot?.classifiers ?? [];
  }

  #projectInfo(id: string): ProjectInfo {
    const entry = this.#workspace.get(id)!;
    const current = id === this.#projectId;
    return {
      id,
      name: current ? this.#experiment.name : entry.name,
      createdAt: entry.createdAt,
      openedAt: entry.openedAt,
      current,
      images: current
        ? this.#images.length
        : (entry.snapshot?.images.length ?? 0),
    };
  }

  #switchTo(id: string, snapshot: FakeSnapshot | null, name: string) {
    // Park the open project, then take the other one's place.
    const open = this.#workspace.get(this.#projectId);
    if (open) {
      open.snapshot = this.#snapshot();
      open.name = this.#experiment.name;
    }
    this.#projectId = id;
    const entry = this.#workspace.get(id)!;
    entry.openedAt = Date.now();
    this.#restore(snapshot, name);
    this.#bus.emit({
      type: "project/didReset",
      experiment: this.#experiment,
      project: this.#projectInfo(id),
    });
  }

  #entityState<T extends { id: string }>(items: T[]) {
    return {
      ids: items.map((item) => item.id),
      entities: Object.fromEntries(items.map((item) => [item.id, item])),
    };
  }

  readonly project: BackendProject = {
    rename: async (name) => {
      this.#experiment = { ...this.#experiment, name };
      this.#bus.emit({
        type: "project/didChange",
        experiment: this.#experiment,
      });
      return this.#experiment;
    },
    create: async (name) => {
      const id = generateUUID();
      this.#workspace.set(id, { name, createdAt: Date.now(), snapshot: null });
      this.#switchTo(id, null, name);
      return this.#projectInfo(id);
    },
    export: async (name) => {
      const fileName = (name ?? this.#experiment.name).replace(/[./\\]/g, "_");
      const store = new PiximiStore(fileName);
      const project: SerializableProject = {
        data: {
          experiment: this.#experiment,
          imageSeries: this.#entityState(this.#series),
          images: this.#entityState(this.#images),
          planes: this.#entityState(this.#planes),
          kinds: this.#entityState(this.#kinds),
          categories: this.#entityState(this.#categories),
          channels: this.#entityState(this.#channels),
          channelMetas: this.#entityState(this.#channelMetas),
          annotationVolumes: this.#entityState(this.#volumes),
          annotations: this.#entityState(this.#annotations),
        },
        classifier: classifierSlice.getInitialState(),
        segmenter: segmenterSlice.getInitialState(),
      };
      const accessor: ChannelDataAccessor = async (ids) =>
        new Map(
          ids.map((id) => {
            const stored = this.#pixels.get(id)!;
            return [
              id,
              { data: stored.data, histogram: new Uint32Array(256).buffer },
            ];
          }),
        );
      await writeV2(store, project, accessor, () => {});
      const data = await store.zip.generateAsync({ type: "uint8array" });
      return { fileName: `${fileName}.piximi`, mime: "application/zip", data };
    },
    import: async (data, name) => {
      const bytes =
        data instanceof Blob ? new Uint8Array(await data.arrayBuffer()) : data;
      const file = new File([bytes.slice()], "import.piximi", {
        type: "application/zip",
      });
      const { project } = await loadProject(
        { files: [file] },
        new CancelSource().token,
        () => {},
      );
      const d = project.data;
      const pixels = new Map<string, StoredPixels>();
      const channels: Channel[] = [];
      for (const v2 of Object.values(d.channels.entities)) {
        if (!v2) continue;
        const { data: buffer, histogram: _histogram, ...rest } = v2;
        pixels.set(v2.id, {
          data: buffer,
          width: v2.width,
          height: v2.height,
          bitDepth: v2.bitDepth,
        });
        channels.push({
          ...rest,
          storageReference: {
            storageId: v2.id,
            storeName: STORES.CHANNEL_DATA,
            width: v2.width,
            height: v2.height,
            dtype: v2.dtype,
            byteSize: buffer.byteLength,
          },
        } as Channel);
      }
      const rows = <T>(state: {
        ids: string[];
        entities: Record<string, T | undefined>;
      }) => state.ids.map((id) => state.entities[id]!);
      const projectName = name ?? d.experiment.name;
      const snapshot: FakeSnapshot = {
        experiment: { ...d.experiment, name: projectName },
        series: rows(d.imageSeries) as ImageSeries[],
        images: rows(d.images) as ImageObject[],
        planes: rows(d.planes),
        channels,
        channelMetas: rows(d.channelMetas) as ChannelMeta[],
        pixels,
        kinds: rows(d.kinds),
        categories: rows(d.categories),
        volumes: rows(d.annotationVolumes),
        annotations: rows(d.annotations) as AnnotationObject[],
        classifiers: [],
      };
      const id = generateUUID();
      this.#workspace.set(id, {
        name: projectName,
        createdAt: Date.now(),
        snapshot,
      });
      this.#switchTo(id, snapshot, projectName);
      return this.#projectInfo(id);
    },
    list: async () =>
      [...this.#workspace.keys()].map((id) => this.#projectInfo(id)),
    open: async (id) => {
      const entry = this.#workspace.get(id);
      if (!entry) throw new BackendError("NOT_FOUND", `No project ${id}`);
      if (id !== this.#projectId)
        this.#switchTo(id, entry.snapshot, entry.name);
      return this.#projectInfo(id);
    },
    delete: async (id) => {
      if (id === this.#projectId) {
        throw new BackendError(
          "NOT_SUPPORTED",
          "Open another project before deleting this one",
        );
      }
      if (!this.#workspace.delete(id)) {
        throw new BackendError("NOT_FOUND", `No project ${id}`);
      }
    },
  };

  /* Features and intensities of an object from its mask and the pixels. */
  #measure(annotation: AnnotationObject): void {
    const mask = Uint8Array.from(decodeRleArray(annotation.encodedMask));
    annotation.features = computeObjectFeatures([
      { ...annotation, decodedMask: mask },
    ])[annotation.id];
    annotation.intensityMeasurements = Object.fromEntries(
      this.#channels
        .filter((channel) => channel.planeId === annotation.planeId)
        .flatMap((channel) => {
          const pixels = this.#pixels.get(channel.id);
          return pixels
            ? [
                [
                  channel.id,
                  intensityStatistics(pixels, {
                    mask,
                    bbox: annotation.boundingBox,
                  }),
                ],
              ]
            : [];
        }),
    );
  }

  async #commit(
    changeSet: AnnotationChangeSet,
    options?: CallOptions,
  ): Promise<CommitResult> {
    const imageIds = new Set(changeSet.imageIds);
    for (const id of changeSet.imageIds) {
      if (!this.#images.some((im) => im.id === id)) {
        throw new BackendError("NOT_FOUND", `Unknown image ${id}`);
      }
    }
    const { volumes: volumesIn, annotations: annotationsIn } = changeSet;
    const area = ([x0, y0, x1, y1]: BBox) => (x1 - x0) * (y1 - y0);
    const checkGeometry = (id: string, bbox: BBox, mask: number[]) => {
      if (
        area(bbox) <= 0 ||
        mask.reduce((sum, run) => sum + run, 0) !== area(bbox)
      ) {
        throw new BackendError(
          "NOT_SUPPORTED",
          `Annotation ${id}: the mask does not cover its bounding box`,
        );
      }
    };
    for (const volume of volumesIn.created) {
      if (!imageIds.has(volume.imageId)) {
        throw new BackendError(
          "NOT_SUPPORTED",
          `Volume ${volume.id} is not on an image of the session`,
        );
      }
      const category = this.#categories.find((c) => c.id === volume.categoryId);
      if (
        !category ||
        category.type !== "annotation" ||
        category.kindId !== volume.kindId
      ) {
        throw new BackendError(
          "NOT_FOUND",
          `Volume ${volume.id} names no category of its kind`,
        );
      }
    }
    const newVolumeIds = new Set(volumesIn.created.map((v) => v.id));
    for (const annotation of annotationsIn.created) {
      const plane = this.#planes.find((p) => p.id === annotation.planeId);
      if (
        !imageIds.has(annotation.imageId) ||
        !plane ||
        plane.imageId !== annotation.imageId
      ) {
        throw new BackendError(
          "NOT_FOUND",
          `Annotation ${annotation.id} is not on a plane of the session`,
        );
      }
      if (
        !newVolumeIds.has(annotation.volumeId) &&
        !this.#volumes.some((v) => v.id === annotation.volumeId)
      ) {
        throw new BackendError(
          "NOT_FOUND",
          `Annotation ${annotation.id} names an unknown volume`,
        );
      }
      checkGeometry(
        annotation.id,
        annotation.boundingBox,
        annotation.encodedMask,
      );
    }
    for (const change of annotationsIn.updated) {
      checkGeometry(change.id, change.boundingBox, change.encodedMask);
    }

    const conflicts: CommitConflict[] = [];
    const current = <T extends EntityRef>(
      type: CommitConflict["type"],
      refs: T[],
      rows: Array<{ id: string; rev?: number }>,
    ): T[] =>
      refs.filter((ref) => {
        const row = rows.find((r) => r.id === ref.id);
        if (!row) {
          conflicts.push({ type, id: ref.id, reason: "missing" });
          return false;
        }
        if (
          ref.baseRev !== undefined &&
          row.rev !== undefined &&
          row.rev !== ref.baseRev
        ) {
          conflicts.push({ type, id: ref.id, reason: "modified" });
          return !!changeSet.force;
        }
        return true;
      });
    const volumeChanges = current("volume", volumesIn.updated, this.#volumes);
    const volumeDeletions = current("volume", volumesIn.deleted, this.#volumes);
    const geometryChanges = current(
      "annotation",
      annotationsIn.updated,
      this.#annotations,
    );
    const annotationDeletions = current(
      "annotation",
      annotationsIn.deleted,
      this.#annotations,
    );
    if (conflicts.length > 0 && !changeSet.force) {
      return { created: 0, updated: 0, deleted: 0, conflicts };
    }

    const rev = ++this.#rev;
    const createdVolumes = volumesIn.created.map((v) => ({ ...v, rev }));
    const created = annotationsIn.created.map(
      ({ decodedMask: _decoded, ...annotation }) => ({ ...annotation, rev }),
    );
    this.#volumes.push(...createdVolumes);
    this.#annotations.push(...created);
    const rewritten: AnnotationObject[] = [];
    for (const change of geometryChanges) {
      const annotation = this.#annotations.find((a) => a.id === change.id)!;
      const [x0, y0, x1, y1] = change.boundingBox;
      annotation.boundingBox = change.boundingBox;
      annotation.encodedMask = change.encodedMask;
      annotation.shape = {
        ...annotation.shape,
        width: x1 - x0,
        height: y1 - y0,
      };
      annotation.rev = rev;
      rewritten.push(annotation);
    }
    const movedVolumes: VolumeUpdate[] = [];
    const moved = new Set<string>();
    for (const change of volumeChanges) {
      const volume = this.#volumes.find((v) => v.id === change.id)!;
      if (volume.categoryId === change.categoryId) continue;
      const category = this.#category(change.categoryId);
      if (category.type !== "annotation") {
        throw new BackendError("NOT_FOUND", "Not an object category");
      }
      moved.add(volume.id);
      movedVolumes.push(this.#moveVolume(volume, category));
    }
    const partitions = [...moved].flatMap((volumeId) => {
      const { categoryId } = this.#volumes.find((v) => v.id === volumeId)!;
      return this.#repartition(new Set([volumeId]), categoryId);
    });
    const deletedIds = new Set(annotationDeletions.map((ref) => ref.id));
    const candidates = new Set(
      this.#annotations
        .filter((a) => deletedIds.has(a.id))
        .map((a) => a.volumeId),
    );
    this.#annotations = this.#annotations.filter((a) => !deletedIds.has(a.id));
    const used = new Set(this.#annotations.map((a) => a.volumeId));
    const dropped = new Set(
      [...candidates, ...volumeDeletions.map((ref) => ref.id)].filter(
        (id) => !used.has(id),
      ),
    );
    this.#volumes = this.#volumes.filter((v) => !dropped.has(v.id));

    const toMeasure = [...created, ...rewritten];
    for (const [index, annotation] of toMeasure.entries()) {
      this.#measure(annotation);
      options?.onProgress?.({
        percent: Math.round(((index + 1) / toMeasure.length) * 100),
        message: `Measured ${index + 1}/${toMeasure.length} objects`,
      });
    }
    if (created.length > 0) {
      this.#bus.emit({
        type: "annotations/didAdd",
        volumes: createdVolumes.map((v) => ({ ...v })),
        annotations: created.map((a) => ({ ...a })),
      });
    }
    if (rewritten.length > 0 || moved.size > 0) {
      this.#bus.emit({
        type: "annotations/didUpdate",
        volumes: movedVolumes,
        annotations: partitions,
        headers: rewritten.map(
          ({ encodedMask: _mask, ...header }): AnnotationHeader => ({
            ...header,
          }),
        ),
      });
    }
    if (deletedIds.size > 0 || dropped.size > 0) {
      this.#bus.emit({
        type: "annotations/didRemove",
        annotationIds: [...deletedIds],
        volumeIds: [...dropped],
      });
    }
    return {
      created: created.length,
      updated: rewritten.length + moved.size,
      deleted: deletedIds.size,
      conflicts: changeSet.force
        ? conflicts.filter((c) => c.reason === "missing")
        : [],
    };
  }

  #category(id: string): Category {
    const category = this.#categories.find((c) => c.id === id);
    if (!category)
      throw new BackendError("NOT_FOUND", `Unknown category ${id}`);
    return category;
  }

  #categoriesChanged(): void {
    this.#bus.emit({
      type: "categories/didChange",
      categories: [...this.#categories],
    });
  }

  /* Moves a volume by hand: category, kind, prediction record. */
  #moveVolume(
    volume: AnnotationVolume,
    category: AnnotationCategory,
  ): VolumeUpdate {
    volume.predictionCorrected = predictionCorrection(
      volume.categoryId,
      category.id,
      {
        predictedAtRunId: volume.predictedAtRunId,
        predictionConfidence: volume.predictionConfidence,
      },
      volume.predictionCorrected,
    );
    volume.categoryId = category.id;
    volume.kindId = category.kindId;
    volume.rev = ++this.#rev;
    delete volume.predictionConfidence;
    delete volume.predictedAtRunId;
    const { id, kindId, categoryId, predictionCorrected, rev } = volume;
    return {
      id,
      kindId,
      categoryId,
      ...(predictionCorrected && { predictionCorrected }),
      rev,
    };
  }

  /* Every annotation of the volumes follows the partition rule. */
  #repartition(volumeIds: Set<string>, categoryId: string): AnnotationUpdate[] {
    const updates: AnnotationUpdate[] = [];
    for (const annotation of this.#annotations) {
      if (!volumeIds.has(annotation.volumeId)) continue;
      annotation.partition = nextPartition(
        categoryId,
        annotation.partition,
        false,
      );
      updates.push({ id: annotation.id, partition: annotation.partition });
    }
    return updates;
  }

  readonly categories = {
    create: async (categories: Category[]): Promise<Category[]> => {
      for (const category of categories) {
        if (this.#categories.some((c) => c.id === category.id)) {
          throw new BackendError(
            "NOT_SUPPORTED",
            `A category ${category.id} already exists`,
          );
        }
      }
      if (categories.length > 0) {
        this.#categories.push(...categories);
        this.#categoriesChanged();
        this.#invalidateClassifiers(categories);
      }
      return categories;
    },

    update: async (
      id: string,
      changes: { name?: string; color?: string },
    ): Promise<Category> => {
      const category = this.#category(id);
      if (changes.name !== undefined) category.name = changes.name;
      if (changes.color !== undefined) category.color = changes.color;
      this.#categoriesChanged();
      return { ...category };
    },

    delete: async (ids: string[]): Promise<Deleted> => {
      const gone = new Set(
        ids.filter(
          (id) =>
            !representsUnknown(id) && this.#categories.some((c) => c.id === id),
        ),
      );
      if (gone.size === 0) return { deleted: 0 };
      const updates: ImageUpdate[] = [];
      for (const image of this.#images) {
        if (!gone.has(image.categoryId)) continue;
        image.categoryId = UNKNOWN_IMAGE_CATEGORY.id;
        updates.push({
          id: image.id,
          categoryId: image.categoryId,
          partition: image.partition,
        });
      }
      const volumes: VolumeUpdate[] = [];
      for (const volume of this.#volumes) {
        if (!gone.has(volume.categoryId)) continue;
        const kind = this.#kinds.find((k) => k.id === volume.kindId)!;
        volume.categoryId = kind.unknownCategoryId;
        volume.rev = ++this.#rev;
        volumes.push({
          id: volume.id,
          kindId: volume.kindId,
          categoryId: volume.categoryId,
        });
      }
      const goneCategories = this.#categories.filter((c) => gone.has(c.id));
      this.#categories = this.#categories.filter((c) => !gone.has(c.id));
      if (updates.length > 0) {
        this.#bus.emit({ type: "images/didUpdate", updates });
      }
      if (volumes.length > 0) {
        this.#bus.emit({
          type: "annotations/didUpdate",
          volumes,
          annotations: [],
        });
      }
      this.#categoriesChanged();
      this.#invalidateClassifiers(goneCategories);
      return { deleted: gone.size };
    },
  };

  // ── Measurements ───────────────────────────────────────────────────────────

  // ── Ingest ──────────────────────────────────────────────────────────────

  readonly ingest: BackendIngest;

  /* The batch loop behind `upload` and `addPaths`: one `ingest` job, each
   * file decoded on this thread; `onAdded` records a server source. */
  async #runIngest(
    files: UploadFile[],
    options?: CallOptions,
    onAdded?: (file: UploadFile, imageIds: string[]) => void,
  ): Promise<IngestSummary> {
    {
      if (files.length === 0) {
        return { imageIds: [], failed: [], cancelled: false };
      }
      if (options?.signal?.aborted) {
        return { imageIds: [], failed: [], cancelled: true };
      }
      const job = this.#jobs.start(
        "ingest",
        `Adding ${files.length} image file${files.length === 1 ? "" : "s"}`,
        options?.signal,
      );
      const signal = this.#jobs.signal(job.id);
      const imageIds: string[] = [];
      const failed: IngestFailure[] = [];
      let cancelled = false;
      for (let i = 0; i < files.length; i++) {
        if (signal.aborted) {
          cancelled = true;
          break;
        }
        const file = files[i];
        this.#jobs.update(job.id, {
          progress: (i / files.length) * 100,
          message: `Adding ${file.name} (${i + 1}/${files.length})`,
        });
        try {
          const fileData =
            file.data instanceof ArrayBuffer
              ? file.data
              : await file.data.arrayBuffer();
          // The same decoding the browser's worker does, on this thread.
          const output = await inlineImageDecoder(
            {
              fileData,
              fileName: file.name,
              mimeType: inferMimeType(file.name, file.mimeType),
              dimConfig: file.dimensionConfig,
            },
            signal,
            () => {},
            this.#experiment.channels,
          );
          const added = this.#addDecoded(output);
          imageIds.push(...added);
          onAdded?.(file, added);
        } catch (error) {
          if (signal.aborted || isTaskCancelledError(error)) {
            cancelled = true;
            break;
          }
          failed.push({
            name: file.name,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
      const added = imageIds.length;
      if (cancelled) {
        this.#jobs.finish(job.id, "cancelled", {
          message: `Stopped after ${added} image${added === 1 ? "" : "s"}`,
        });
      } else if (failed.length > 0 && added === 0) {
        this.#jobs.finish(job.id, "failed", {
          message: "No images added",
          error: failed[0].error,
        });
      } else {
        this.#jobs.finish(job.id, "succeeded", {
          message: `Added ${added} image${added === 1 ? "" : "s"}`,
        });
      }
      return { jobId: job.id, imageIds, failed, cancelled };
    }
  }

  #resolvePath(path: string): string {
    const normalized = path.replace(/\/+$/, "");
    if (
      !this.#roots.some(
        (root) => normalized === root || normalized.startsWith(`${root}/`),
      )
    ) {
      throw new BackendError(
        "UNAUTHORIZED",
        `${path} is outside the folders this backend may read`,
      );
    }
    return normalized;
  }

  #isDirectory(path: string): boolean {
    return (
      this.#roots.includes(path) ||
      [...this.#files.keys()].some((file) => file.startsWith(`${path}/`))
    );
  }

  #browse(path?: string): DirectoryListing {
    if (path === undefined || path === "") {
      if (this.#roots.length === 1) return this.#listing(this.#roots[0]);
      return {
        path: "",
        roots: [...this.#roots],
        entries: this.#roots.map((root) => ({
          name: root.split("/").pop() || root,
          path: root,
          type: "directory",
        })),
      };
    }
    return this.#listing(this.#resolvePath(path));
  }

  #listing(directory: string): DirectoryListing {
    if (!this.#isDirectory(directory)) {
      throw new BackendError("NOT_FOUND", `${directory} is not a folder`);
    }
    const children = new Map<string, DirectoryEntry>();
    for (const [file, data] of this.#files) {
      if (!file.startsWith(`${directory}/`)) continue;
      const rest = file.slice(directory.length + 1);
      const [name, ...deeper] = rest.split("/");
      if (name.startsWith(".")) continue;
      if (deeper.length > 0) {
        children.set(name, {
          name,
          path: `${directory}/${name}`,
          type: "directory",
        });
      } else {
        children.set(name, {
          name,
          path: file,
          type: "file",
          size: data.byteLength,
          supported: inferMimeType(name) !== MIME.UNKNOWN,
        });
      }
    }
    const entries = [...children.values()].sort(
      (a, b) =>
        Number(a.type !== "directory") - Number(b.type !== "directory") ||
        a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
    );
    const atRoot = this.#roots.includes(directory);
    return {
      path: directory,
      ...(atRoot
        ? this.#roots.length > 1 && { parent: "" }
        : { parent: directory.slice(0, directory.lastIndexOf("/")) }),
      roots: [...this.#roots],
      entries,
    };
  }

  async #inspect(paths: string[]): Promise<PathInspection[]> {
    const results: PathInspection[] = [];
    for (const path of paths) {
      const name = path.split("/").pop() ?? path;
      const resolved = this.#resolvePath(path);
      const data = this.#files.get(resolved);
      if (!data) {
        results.push({
          path,
          name,
          frameCount: 0,
          isMultiFrame: false,
          error: `${path} is not a file`,
        });
        continue;
      }
      if (!isTiffFile(name)) {
        results.push({
          path: resolved,
          name,
          frameCount: 1,
          isMultiFrame: false,
        });
        continue;
      }
      try {
        const analysis = await analyzeTiff(data);
        const dims = analysis.OMEDims;
        const known =
          dims?.sizec !== undefined ||
          dims?.sizez !== undefined ||
          dims?.sizet !== undefined;
        results.push({
          path: resolved,
          name,
          frameCount: analysis.frameCount,
          isMultiFrame: analysis.isMultiFrame,
          ...(known && {
            dimensions: {
              dimensionOrder: dims?.dimensionorder,
              channels: dims?.sizec,
              slices: dims?.sizez,
              frames: dims?.sizet,
            },
          }),
        });
      } catch (error) {
        results.push({
          path,
          name,
          frameCount: 0,
          isMultiFrame: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
    return results;
  }

  async #addPaths(
    request: AddPathsRequest,
    options?: CallOptions,
  ): Promise<IngestSummary> {
    const files: string[] = [];
    const add = (file: string) => {
      if (!files.includes(file)) files.push(file);
    };
    const walk = (directory: string) => {
      const listing = this.#listing(directory);
      for (const entry of listing.entries) {
        if (entry.type === "directory") {
          if (request.recursive) walk(entry.path);
        } else if (entry.supported) add(entry.path);
      }
    };
    for (const path of request.paths) {
      const resolved = this.#resolvePath(path);
      if (this.#isDirectory(resolved)) walk(resolved);
      else if (this.#files.has(resolved)) add(resolved);
      else throw new BackendError("NOT_FOUND", `${path} does not exist`);
    }
    const skipped = files.filter((file) => this.#sources.has(file));
    const pathOf = new Map<UploadFile, string>();
    const uploads: UploadFile[] = files
      .filter((file) => !this.#sources.has(file))
      .map((file) => {
        const upload: UploadFile = {
          name: file.split("/").pop() ?? file,
          data: this.#files.get(file)!,
          dimensionConfig: request.dimensionConfigs?.[file],
        };
        pathOf.set(upload, file);
        return upload;
      });
    const summary = await this.#runIngest(uploads, options, (file, ids) =>
      this.#sources.set(pathOf.get(file)!, ids),
    );
    return { ...summary, skipped };
  }

  /* Takes a decoded file in: one series, its images, planes, channels and
   * pixels, with the metas matched by channel index and widened. */
  #addDecoded(output: LoadAndPrepareOutput): string[] {
    const channelCount = output.images[0].shape.channels;
    if (this.#experiment.channels === undefined) {
      this.#experiment = { ...this.#experiment, channels: channelCount };
    }
    const created: ChannelMeta[] = [];
    const widened: ChannelMeta[] = [];
    const metaFor = (index: number, incoming: ChannelMeta): ChannelMeta => {
      const id = `meta-${index}`;
      const existing = this.#channelMetas.find((meta) => meta.id === id);
      if (!existing) {
        const meta = { ...incoming, id, name: `Channel-${index}` };
        this.#channelMetas.push(meta);
        created.push(meta);
        return meta;
      }
      if (
        incoming.minValue < existing.minValue ||
        incoming.maxValue > existing.maxValue
      ) {
        Object.assign(existing, {
          minValue: Math.min(existing.minValue, incoming.minValue),
          maxValue: Math.max(existing.maxValue, incoming.maxValue),
          rampMinLimit: Math.min(existing.rampMinLimit, incoming.rampMinLimit),
          rampMaxLimit: Math.max(existing.rampMaxLimit, incoming.rampMaxLimit),
        });
        widened.push({ ...existing });
      }
      return existing;
    };
    const metaById = new Map(
      output.channelMetas.map((meta, index) => [meta.id, metaFor(index, meta)]),
    );
    const series: ImageSeries = {
      ...output.imageSeries[0],
      experimentId: this.#experiment.id,
    };
    this.#series.push(series);
    this.#images.push(...output.images);
    this.#planes.push(...output.planes);
    const channels: Channel[] = output.channels.map(
      ({ data, histogram: _histogram, ...channel }) => {
        this.#pixels.set(channel.id, {
          data,
          width: channel.width,
          height: channel.height,
          bitDepth: channel.bitDepth,
        });
        return {
          ...channel,
          channelMetaId: metaById.get(channel.channelMetaId)!.id,
          storageReference: {
            storageId: channel.id,
            storeName: STORES.CHANNEL_DATA,
            width: channel.width,
            height: channel.height,
            dtype: channel.dtype,
            byteSize: data.byteLength,
          },
        };
      },
    );
    this.#channels.push(...channels);
    const records: ImageRecord[] = output.images.map((image) => {
      const planes = output.planes.filter(
        (plane) => plane.imageId === image.id,
      );
      const planeIds = new Set(planes.map((plane) => plane.id));
      return {
        image,
        series,
        planes,
        channels: channels.filter((channel) => planeIds.has(channel.planeId)),
      };
    });
    this.#bus.emit({
      type: "images/didAdd",
      records,
      channelMetas: created,
      updatedChannelMetas: widened,
    });
    return output.images.map((image) => image.id);
  }

  // ── Export ──────────────────────────────────────────────────────────────

  readonly export: BackendExport = {
    annotations: async (request) => {
      const query = request.query ?? {};
      const byId = new Map(this.#annotations.map((a) => [a.id, a]));
      const records: ExportedAnnotation[] = [];
      for (const row of this.#annotationListing(query)) {
        const annotation = byId.get(row.annotation.id);
        const image = this.#images.find(
          (im) => im.id === row.annotation.imageId,
        );
        if (!annotation || !image) continue;
        const volume = row.volume;
        records.push({
          id: annotation.id,
          imageId: image.id,
          imageName: image.name,
          imageShape: image.shape,
          planeId: annotation.planeId,
          planeIndex:
            this.#planes.find((p) => p.id === annotation.planeId)?.zIndex ?? 0,
          volumeId: volume.id,
          kindId: volume.kindId,
          kindName:
            this.#kinds.find((k) => k.id === volume.kindId)?.name ??
            volume.kindId,
          categoryId: volume.categoryId,
          categoryName:
            this.#categories.find((c) => c.id === volume.categoryId)?.name ??
            volume.categoryId,
          partition: annotation.partition,
          timepoint: volume.timepoint ?? 0,
          boundingBox: annotation.boundingBox,
          encodedMask: annotation.encodedMask,
          ...(annotation.features && { features: annotation.features }),
          ...(annotation.intensityMeasurements && {
            intensityMeasurements: annotation.intensityMeasurements,
          }),
        });
      }
      return buildAnnotationExport(
        request.type,
        records,
        request.name ?? this.#experiment.name,
      );
    },
  };

  readonly measurements: BackendMeasurements = {
    table: async (
      request: MeasurementTableRequest,
    ): Promise<MeasurementTable> => {
      const columns = request.columns.map((key) => ({
        key,
        column: parseMeasurementColumn(key),
      }));
      const channelOf = (planeId: string, channelMetaId: string) =>
        this.#channels.find(
          (channel) =>
            channel.planeId === planeId &&
            channel.channelMetaId === channelMetaId,
        );
      const values: MeasurementTable["values"] = {};
      const window = <T>(rows: T[]) =>
        request.page
          ? paginate(rows, request.page)
          : { items: rows, total: rows.length };

      if (request.scope.type === "images") {
        if (columns.some(({ column }) => column.kind === "feature")) {
          throw new BackendError(
            "NOT_SUPPORTED",
            "Images have no shape features; ask for intensity columns",
          );
        }
        const { items, total } = window(
          this.#imageListing(request.imageQuery ?? {}),
        );
        for (const { key, column } of columns) {
          if (column.kind !== "intensity") continue;
          values[key] = items.map(
            (image) =>
              channelOf(image.activePlaneId, column.channelMetaId)?.[
                column.measurement
              ] ?? null,
          );
        }
        return {
          ids: items.map((image) => image.id),
          imageNames: items.map((image) => image.name),
          categoryIds: items.map((image) => image.categoryId),
          partitions: items.map((image) => image.partition),
          timepoints: items.map((image) => image.timepoint),
          values,
          total,
        };
      }

      const { kindId } = request.scope;
      if (!kindId) {
        throw new BackendError(
          "NOT_SUPPORTED",
          "An objects scope names its kind",
        );
      }
      const query = request.annotationQuery ?? {};
      const kindIds = query.kindIds
        ? query.kindIds.filter((id) => id === kindId)
        : [kindId];
      const { items, total } = window(
        this.#annotationListing({ ...query, kindIds }),
      );
      const imageOf = (id: string) => this.#images.find((im) => im.id === id);
      for (const { key, column } of columns) {
        values[key] = items.map(({ annotation }) => {
          const entity = this.#annotations.find((a) => a.id === annotation.id);
          if (column.kind === "feature") {
            return entity?.features?.[column.feature] ?? null;
          }
          const channel = channelOf(annotation.planeId, column.channelMetaId);
          return (
            (channel &&
              entity?.intensityMeasurements?.[channel.id]?.[
                column.measurement
              ]) ??
            null
          );
        });
      }
      return {
        ids: items.map(({ annotation }) => annotation.id),
        imageIds: items.map(({ annotation }) => annotation.imageId),
        imageNames: items.map(
          ({ annotation }) => imageOf(annotation.imageId)?.name ?? "",
        ),
        categoryIds: items.map(({ volume }) => volume.categoryId),
        partitions: items.map(({ annotation }) => annotation.partition),
        timepoints: items.map(
          ({ annotation }) => imageOf(annotation.imageId)?.timepoint ?? 0,
        ),
        boundingBoxes: items.map(({ annotation }) => annotation.boundingBox),
        values,
        total,
      };
    },

    compute: async (
      request: MeasurementsComputeRequest,
      options?: CallOptions,
    ): Promise<MeasurementsComputeSummary> => {
      if (options?.signal?.aborted) return { measured: 0, cancelled: true };
      if (request.scope.type === "images") {
        const lacking = (channel: Channel) =>
          request.force === true || channel.median === undefined;
        const targets = this.#imageListing(request.imageQuery ?? {}).filter(
          (image) =>
            this.#channels.some(
              (channel) =>
                this.#planes.some(
                  (plane) =>
                    plane.imageId === image.id && plane.id === channel.planeId,
                ) && lacking(channel),
            ),
        );
        const job = this.#jobs.start(
          "measurements",
          `Measuring ${targets.length} images`,
          options?.signal,
        );
        for (const image of targets) {
          for (const plane of this.#planes.filter(
            (p) => p.imageId === image.id,
          )) {
            for (const channel of this.#channels.filter(
              (c) => c.planeId === plane.id && lacking(c),
            )) {
              const pixels = this.#pixels.get(channel.id);
              if (pixels) Object.assign(channel, intensityStatistics(pixels));
            }
          }
        }
        if (targets.length > 0) {
          this.#bus.emit({
            type: "images/didUpdate",
            updates: targets.map((image) => ({
              id: image.id,
              categoryId: image.categoryId,
              partition: image.partition,
            })),
          });
        }
        this.#jobs.finish(job.id, "succeeded", {
          message: `Measured ${targets.length} images`,
        });
        return { jobId: job.id, measured: targets.length, cancelled: false };
      }
      const { kindId } = request.scope;
      if (!kindId) {
        throw new BackendError(
          "NOT_SUPPORTED",
          "An objects scope names its kind",
        );
      }
      const query = request.annotationQuery ?? {};
      const targets = this.#annotationListing({
        ...query,
        kindIds: query.kindIds
          ? query.kindIds.filter((id) => id === kindId)
          : [kindId],
      })
        .map(
          ({ annotation }) =>
            this.#annotations.find((a) => a.id === annotation.id)!,
        )
        .filter(
          (annotation) =>
            request.force === true ||
            !annotation.features ||
            !annotation.intensityMeasurements,
        );
      const job = this.#jobs.start(
        "measurements",
        `Measuring ${targets.length} objects`,
        options?.signal,
      );
      // The fake's masks cover their bounding boxes, so the features follow
      // from the box and the intensities from the plane's channels.
      for (const annotation of targets) {
        const [x0, y0, x1, y1] = annotation.boundingBox;
        annotation.features = wholeImageFeatures(x1 - x0, y1 - y0);
        annotation.intensityMeasurements = Object.fromEntries(
          this.#channels
            .filter((channel) => channel.planeId === annotation.planeId)
            .flatMap((channel) => {
              const pixels = this.#pixels.get(channel.id);
              return pixels ? [[channel.id, intensityStatistics(pixels)]] : [];
            }),
        );
      }
      if (targets.length > 0) {
        this.#bus.emit({
          type: "annotations/didUpdate",
          volumes: [],
          annotations: targets.map((a) => ({
            id: a.id,
            partition: a.partition,
          })),
        });
      }
      this.#jobs.finish(job.id, "succeeded", {
        message: `Measured ${targets.length} objects`,
      });
      return { jobId: job.id, measured: targets.length, cancelled: false };
    },
  };

  // ── Jobs ───────────────────────────────────────────────────────────────────

  readonly jobs = {
    list: async (): Promise<Job[]> => this.#jobs.list(),
    cancel: async (id: string): Promise<void> => this.#jobs.cancel(id),
  };

  // ── Segmentation ───────────────────────────────────────────────────────────

  #descriptor(): SegmentationModelDescriptor {
    return {
      name: FAKE_MODEL_ID,
      displayName: "Whole-image labeller",
      modelLoaded: this.#modelLoaded,
      status: this.#modelLoaded ? "loaded" : "ready",
      framework: "fake",
      tasks: ["segmentation"],
      outputPolicy: { mode: OUTPUT_MODE.SINGLE, defaultKindName: "Object" },
      channelPolicy: { mode: CHANNEL_MODE.PASSTHROUGH, maxChannels: 1 },
      cancellableLoad: true,
      description: "Labels each image with one object covering the whole plane",
      use: "Testing",
      sources: [],
    };
  }

  #ensureKind(name: string): Kind {
    const existing = this.#kinds.find((k) => k.name === name);
    if (existing) return existing;
    const { kind, unknownCategory } = generateKind(name);
    this.#kinds.push(kind);
    this.#categories.push(unknownCategory);
    this.#bus.emit({
      type: "kinds/didAdd",
      kinds: [{ kind, category: unknownCategory }],
    });
    return kind;
  }

  readonly segmentation = {
    listModels: async (): Promise<SegmentationModelDescriptor[]> => [
      this.#descriptor(),
    ],

    loadModel: async (
      modelId: string,
      options?: CallOptions,
    ): Promise<void> => {
      if (modelId !== FAKE_MODEL_ID) {
        throw new BackendError("MODEL_NOT_FOUND", `No model "${modelId}"`);
      }
      if (options?.signal?.aborted) throw new TaskCancelledError();
      options?.onProgress?.({ percent: 100, message: "Loaded" });
      this.#modelLoaded = true;
    },

    run: async (
      request: SegmentationRunRequest,
      options?: CallOptions,
    ): Promise<SegmentationRunSummary> => {
      if (request.modelId !== FAKE_MODEL_ID) {
        throw new BackendError(
          "MODEL_NOT_FOUND",
          `No model "${request.modelId}"`,
        );
      }
      this.#modelLoaded = true;
      const job = this.#jobs.start(
        "segmentation",
        "Segmenting",
        options?.signal,
      );
      const signal = this.#jobs.signal(job.id);
      const kind = this.#ensureKind(request.kindName ?? "Object");
      const existingByImage = new Set(
        this.#volumes.filter((v) => v.kindId === kind.id).map((v) => v.imageId),
      );

      const volumes: AnnotationVolume[] = [];
      const annotations: AnnotationObject[] = [];
      let skipped = 0;
      let cancelled = false;
      const total = request.imageIds.length;

      for (const [i, imageId] of request.imageIds.entries()) {
        // Let an abort that arrived during the previous item land first.
        await Promise.resolve();
        if (signal.aborted) {
          cancelled = true;
          break;
        }
        const percent = Math.round((i / total) * 100);
        options?.onProgress?.({
          percent,
          message: `Segmenting ${i + 1}/${total}`,
        });
        this.#jobs.update(job.id, { progress: percent });

        const image = this.#images.find((im) => im.id === imageId);
        if (!image) {
          throw new BackendError("NOT_FOUND", `Unknown image ${imageId}`);
        }
        // One object per image and kind; a second run over it is a duplicate.
        if (existingByImage.has(imageId)) {
          skipped++;
          continue;
        }
        const { width, height, channels } = image.shape;
        const volume: AnnotationVolume = {
          id: generateUUID(),
          imageId,
          kindId: kind.id,
          categoryId: kind.unknownCategoryId,
        };
        volumes.push(volume);
        annotations.push({
          id: generateUUID(),
          planeId: image.activePlaneId,
          imageId,
          volumeId: volume.id,
          partition: Partition.Unassigned,
          shape: { planes: 1, channels, width, height },
          boundingBox: [0, 0, width, height],
          // Binary RLE starting with background: no background, all foreground.
          encodedMask: [0, width * height],
          features: wholeImageFeatures(width, height),
          intensityMeasurements: Object.fromEntries(
            this.#channels
              .filter((channel) => channel.planeId === image.activePlaneId)
              .flatMap((channel) => {
                const pixels = this.#pixels.get(channel.id);
                return pixels
                  ? [[channel.id, intensityStatistics(pixels)]]
                  : [];
              }),
          ),
        });
      }

      if (annotations.length > 0) {
        const rev = ++this.#rev;
        for (const volume of volumes) volume.rev = rev;
        for (const annotation of annotations) annotation.rev = rev;
        this.#volumes.push(...volumes);
        this.#annotations.push(...annotations);
        this.#bus.emit({ type: "annotations/didAdd", volumes, annotations });
      }
      this.#jobs.finish(job.id, cancelled ? "cancelled" : "succeeded");
      return { jobId: job.id, added: annotations.length, skipped, cancelled };
    },
  };

  // ── Classification ─────────────────────────────────────────────────────────
  //
  // The fake's classifier predicts the majority class of its training set,
  // which is enough to drive the records, events, partitions and jobs the
  // real ones go through.

  #classifier(id: string): Classifier {
    const classifier = this.#classifiers.find((c) => c.id === id);
    if (!classifier) {
      throw new BackendError("MODEL_NOT_FOUND", `No classifier ${id}`);
    }
    return classifier;
  }

  #classifiersChanged(): void {
    this.#bus.emit({
      type: "classifiers/didChange",
      classifiers: this.#classifiers.map((c) => structuredClone(c)),
    });
  }

  /* A classifier that has run is tied to the category set it ran with. */
  #invalidateClassifiers(categories: Category[]): void {
    const targets = new Set(
      categories.map((c) =>
        c.type === "image" ? IMAGE_CLASSIFIER_ID : c.kindId,
      ),
    );
    let changed = false;
    for (const classifier of this.#classifiers) {
      if (
        targets.has(classifier.targetId) &&
        classifier.runs.length > 0 &&
        classifier.valid
      ) {
        classifier.valid = false;
        changed = true;
      }
    }
    if (changed) this.#classifiersChanged();
  }

  #staleClassMap(classifier: Classifier): boolean {
    const known = new Set(
      this.#knownCategories(classifier.targetId).map((c) => c.id),
    );
    return Object.values(classifier.classMap ?? {}).some(
      (id) => !known.has(id),
    );
  }

  #knownCategories(targetId: string): Category[] {
    return this.#categories.filter(
      (c) =>
        !representsUnknown(c.id) &&
        (targetId === IMAGE_CLASSIFIER_ID
          ? c.type === "image"
          : c.type === "annotation" && c.kindId === targetId),
    );
  }

  #labeled(targetId: string): Labeled[] {
    if (targetId === IMAGE_CLASSIFIER_ID) {
      return this.#images.map(({ id, categoryId, partition }) => ({
        id,
        categoryId,
        partition,
      }));
    }
    const volumes = new Map(this.#volumes.map((v) => [v.id, v]));
    return this.#annotations
      .filter((a) => volumes.get(a.volumeId)?.kindId === targetId)
      .map((a) => ({
        id: a.id,
        categoryId: volumes.get(a.volumeId)!.categoryId,
        partition: a.partition,
      }));
  }

  #setPartitions(
    targetId: string,
    assignments: Array<{ id: string; partition: Partition }>,
  ): void {
    if (assignments.length === 0) return;
    const wanted = new Map(assignments.map((a) => [a.id, a.partition]));
    if (targetId === IMAGE_CLASSIFIER_ID) {
      const updates: ImageUpdate[] = [];
      for (const image of this.#images) {
        const partition = wanted.get(image.id);
        if (partition === undefined) continue;
        image.partition = partition;
        updates.push({
          id: image.id,
          categoryId: image.categoryId,
          partition,
          ...(image.predictionConfidence !== undefined && {
            predictionConfidence: image.predictionConfidence,
          }),
          ...(image.predictedAtRunId !== undefined && {
            predictedAtRunId: image.predictedAtRunId,
          }),
        });
      }
      this.#bus.emit({ type: "images/didUpdate", updates });
    } else {
      const updates: AnnotationUpdate[] = [];
      for (const annotation of this.#annotations) {
        const partition = wanted.get(annotation.id);
        if (partition === undefined) continue;
        annotation.partition = partition;
        updates.push({ id: annotation.id, partition });
      }
      this.#bus.emit({
        type: "annotations/didUpdate",
        volumes: [],
        annotations: updates,
      });
    }
  }

  /* Writes a category as a prediction or by hand, following the rules. */
  #label(
    targetId: string,
    changes: Array<{ id: string; categoryId: string; confidence?: number }>,
    runId?: string,
  ): void {
    if (changes.length === 0) return;
    const predicted = runId !== undefined;
    if (targetId === IMAGE_CLASSIFIER_ID) {
      const updates: ImageUpdate[] = [];
      for (const { id, categoryId, confidence } of changes) {
        const image = this.#images.find((im) => im.id === id);
        if (!image) continue;
        const corrected = predicted
          ? undefined
          : predictionCorrection(
              image.categoryId,
              categoryId,
              {
                predictedAtRunId: image.predictedAtRunId,
                predictionConfidence: image.predictionConfidence,
              },
              image.predictionCorrected,
            );
        image.categoryId = categoryId;
        image.partition = nextPartition(categoryId, image.partition, predicted);
        if (predicted) {
          image.predictionConfidence = confidence;
          image.predictedAtRunId = runId;
        } else {
          delete image.predictionConfidence;
          delete image.predictedAtRunId;
        }
        if (corrected) image.predictionCorrected = corrected;
        else delete image.predictionCorrected;
        updates.push({
          id,
          categoryId,
          partition: image.partition,
          ...(image.predictionConfidence !== undefined && {
            predictionConfidence: image.predictionConfidence,
          }),
          ...(image.predictedAtRunId !== undefined && {
            predictedAtRunId: image.predictedAtRunId,
          }),
          ...(corrected && { predictionCorrected: corrected }),
        });
      }
      this.#bus.emit({ type: "images/didUpdate", updates });
      return;
    }
    const volumes: VolumeUpdate[] = [];
    const moved = new Set<string>();
    for (const { id, categoryId, confidence } of changes) {
      const annotation = this.#annotations.find((a) => a.id === id);
      const volume = annotation
        ? this.#volumes.find((v) => v.id === annotation.volumeId)
        : undefined;
      if (!volume || moved.has(volume.id)) continue;
      moved.add(volume.id);
      const category = this.#category(categoryId);
      if (category.type !== "annotation") continue;
      if (predicted) {
        volume.categoryId = categoryId;
        volume.predictionConfidence = confidence;
        volume.predictedAtRunId = runId;
        delete volume.predictionCorrected;
        volumes.push({
          id: volume.id,
          kindId: volume.kindId,
          categoryId,
          predictionConfidence: confidence,
          predictedAtRunId: runId,
        });
      } else {
        volumes.push(this.#moveVolume(volume, category));
      }
    }
    const annotations: AnnotationUpdate[] = [];
    for (const annotation of this.#annotations) {
      if (!moved.has(annotation.volumeId)) continue;
      const volume = this.#volumes.find((v) => v.id === annotation.volumeId)!;
      annotation.partition = nextPartition(
        volume.categoryId,
        annotation.partition,
        predicted,
      );
      annotations.push({ id: annotation.id, partition: annotation.partition });
    }
    this.#bus.emit({ type: "annotations/didUpdate", volumes, annotations });
  }

  readonly classification: BackendClassification = {
    listArchitectures: async (): Promise<ModelDescriptor[]> => [
      {
        name: FAKE_ARCHITECTURE_ID,
        displayName: "Majority class",
        description: "Predicts the most common training category",
        use: "Testing",
        sources: [],
        modelLoaded: false,
        status: "ready",
        framework: "fake",
        tasks: ["classification", "classification.train"],
        channelPolicy: { mode: CHANNEL_MODE.PASSTHROUGH, maxChannels: 16 },
        cancellableLoad: false,
      },
    ],

    list: async (): Promise<Classifier[]> =>
      this.#classifiers.map((c) => structuredClone(c)),

    create: async (request: ClassifierCreateRequest): Promise<Classifier> => {
      if (request.architectureId !== FAKE_ARCHITECTURE_ID) {
        throw new BackendError(
          "MODEL_NOT_FOUND",
          `No architecture ${request.architectureId}`,
        );
      }
      if (this.#classifiers.some((c) => c.name === request.name)) {
        throw new BackendError(
          "MODEL_CREATE_FAILED",
          `A classifier named "${request.name}" already exists`,
        );
      }
      const classifier = defaultClassifier(
        {
          id: generateUUID(),
          name: request.name,
          targetId: request.targetId,
          architectureId: request.architectureId,
          framework: "fake",
        },
        {
          preprocessSettings: structuredClone(
            request.hyperparameters.preprocess,
          ),
          optimizerSettings: structuredClone(request.hyperparameters.optimizer),
        },
      );
      classifier.initSeed = request.seed;
      this.#classifiers.push(classifier);
      this.#classifiersChanged();
      return structuredClone(classifier);
    },

    update: async (request: ClassifierUpdateRequest): Promise<Classifier> => {
      const classifier = this.#classifier(request.classifierId);
      if (request.hyperparameters) {
        classifier.hyperparameters = structuredClone(request.hyperparameters);
      }
      if (request.classMap) classifier.classMap = { ...request.classMap };
      if (request.confidenceThreshold !== undefined) {
        classifier.confidenceThreshold = request.confidenceThreshold;
      }
      this.#classifiersChanged();
      return structuredClone(classifier);
    },

    delete: async (classifierId: string): Promise<void> => {
      this.#classifier(classifierId);
      this.#classifiers = this.#classifiers.filter(
        (c) => c.id !== classifierId,
      );
      this.#learned.delete(classifierId);
      this.#classifiersChanged();
    },

    fit: async (
      request: ClassifierFitRequest,
      options?: CallOptions,
    ): Promise<ClassifierFitSummary> => {
      const classifier = this.#classifier(request.classifierId);
      if (options?.signal?.aborted) return { status: "stopped" };
      if (!classifier.valid) {
        throw new BackendError(
          "TRAINING_FAILED",
          "The categories changed since the last run; create a new classifier",
        );
      }
      const job = this.#jobs.start(
        "classifier-fit",
        `Training ${classifier.name}`,
        options?.signal,
      );
      const signal = this.#jobs.signal(job.id);
      const { preprocess, optimizer } = classifier.hyperparameters;
      const seed = request.seed ?? classifier.initSeed ?? 0;
      const fresh = classifier.runs.length === 0;
      const categories = this.#knownCategories(classifier.targetId);
      const classMap = fresh
        ? Object.fromEntries(categories.map((c, i) => [String(i), c.id]))
        : classifier.classMap;
      if (!classMap) {
        this.#jobs.finish(job.id, "failed", { error: "No class map" });
        throw new BackendError("TRAINING_FAILED", "No class map");
      }
      const split = splitForTraining(this.#labeled(classifier.targetId), {
        trainingPercentage: preprocess.trainingPercentage,
        shuffle: preprocess.shuffle,
        seed,
        continued: !fresh,
      });
      if (split.training.length === 0 || split.validation.length === 0) {
        this.#jobs.finish(job.id, "failed", { error: "Too few labeled items" });
        throw new BackendError(
          "PREPROCESS_FAILED",
          "Cannot train: need at least one training and one validation item",
        );
      }
      this.#setPartitions(classifier.targetId, split.assignments);

      const classIds = Object.values(classMap);
      const counts = classIds.map(
        (id) => split.training.filter((it) => it.categoryId === id).length,
      );
      const majority = counts.indexOf(Math.max(...counts));
      this.#learned.set(classifier.id, {
        categoryId: classIds[majority],
        softmax: counts.map((n) => n / split.training.length),
      });
      const run: Run = {
        id: generateUUID(),
        parentRunId: classifier.runs.at(-1)?.id,
        startedAt: new Date().toISOString(),
        status: "in-progress",
        trigger: fresh ? "fresh" : "continue",
        seed,
        appVersion: "fake",
        frameworkVersion: "0",
        device: "none",
        hyperparameters: {
          architecture: classifier.architectureId,
          optimizer: structuredClone(optimizer),
          preprocess: structuredClone(preprocess),
        },
        classMap,
        trainingFingerprint: await fingerprintItems(split.training),
        validationFingerprint: await fingerprintItems(split.validation),
        valIds: split.validation.map((it) => it.id),
        categorySetHash: await hashCategorySet(categories.map((c) => c.id)),
        history: [],
      };
      classifier.classMap = classMap;
      classifier.classes = categories.map((c) => c.name);
      classifier.busy = "training";
      classifier.runs.push(run);
      this.#classifiersChanged();

      let status: Run["status"] = "completed";
      for (let epoch = 0; epoch < optimizer.epochs; epoch++) {
        await Promise.resolve();
        if (signal.aborted) {
          status = "stopped";
          break;
        }
        const entry = {
          epoch,
          loss: 1 / (epoch + 1),
          valLoss: 1.1 / (epoch + 1),
          accuracy: 1 - 0.5 / (epoch + 1),
          valAccuracy: 1 - 0.6 / (epoch + 1),
        };
        run.history.push(entry);
        this.#bus.emit({
          type: "classifiers/didEpoch",
          classifierId: classifier.id,
          runId: run.id,
          epoch: entry,
        });
        const percent = Math.round(((epoch + 1) / optimizer.epochs) * 100);
        options?.onProgress?.({ percent, message: `Epoch ${epoch + 1}` });
        this.#jobs.update(job.id, { progress: percent });
      }
      const hits = split.validation.filter(
        (it) => it.categoryId === classIds[majority],
      ).length;
      const evalResults: EvaluationResult = {
        confusionMatrix: classIds.map((_, row) =>
          classIds.map((__, col) =>
            col === majority
              ? split.validation.filter((it) => it.categoryId === classIds[row])
                  .length
              : 0,
          ),
        ),
        accuracy: hits / split.validation.length,
        crossEntropy: 0.5,
        precision: 0.5,
        recall: 0.5,
        f1Score: 0.5,
      };
      run.status = status;
      run.finishedAt = new Date().toISOString();
      run.evalResults = evalResults;
      classifier.trained = true;
      delete classifier.busy;
      this.#classifiersChanged();
      this.#jobs.finish(
        job.id,
        status === "stopped" ? "cancelled" : "succeeded",
      );
      return { jobId: job.id, runId: run.id, status, evalResults };
    },

    predict: async (
      request: ClassifierPredictRequest,
      options?: CallOptions,
    ): Promise<ClassifierPredictSummary> => {
      const classifier = this.#classifier(request.classifierId);
      if (options?.signal?.aborted) return { predicted: 0, cancelled: true };
      const learned = this.#learned.get(classifier.id);
      const run = classifier.runs.at(-1);
      if (!learned || !run) {
        throw new BackendError(
          "PREDICTION_FAILED",
          "The classifier has no run",
        );
      }
      if (this.#staleClassMap(classifier)) {
        throw new BackendError(
          "PREDICTION_FAILED",
          "The categories changed since the last run; create a new classifier",
        );
      }
      const job = this.#jobs.start(
        "classifier-predict",
        `Predicting with ${classifier.name}`,
        options?.signal,
        { cancellable: false },
      );
      const wanted = request.ids && new Set(request.ids);
      const items = this.#labeled(classifier.targetId).filter(
        (it) =>
          representsUnknown(it.categoryId) && (!wanted || wanted.has(it.id)),
      );
      classifier.busy = "predicting";
      this.#classifiersChanged();
      const confidence = Math.max(...learned.softmax);
      for (const item of items) this.#softmax.set(item.id, learned.softmax);
      this.#label(
        classifier.targetId,
        items.map((it) => ({
          id: it.id,
          categoryId: learned.categoryId,
          confidence,
        })),
        run.id,
      );
      delete classifier.busy;
      this.#classifiersChanged();
      this.#jobs.finish(job.id, "succeeded");
      return { jobId: job.id, predicted: items.length, cancelled: false };
    },

    evaluate: async (classifierId: string): Promise<EvaluationResult> => {
      const run = this.#classifier(classifierId).runs.at(-1);
      if (!run?.evalResults) {
        throw new BackendError(
          "EVALUATION_FAILED",
          "The classifier has no run",
        );
      }
      return run.evalResults;
    },

    acceptPredictions: async (targetId: string): Promise<Changed> => {
      const pending = this.#labeled(targetId).filter(
        (it) =>
          it.partition === Partition.Inference &&
          !representsUnknown(it.categoryId),
      );
      this.#setPartitions(
        targetId,
        pending.map((it) => ({ id: it.id, partition: Partition.Unassigned })),
      );
      for (const it of pending) this.#softmax.delete(it.id);
      return { changed: pending.length };
    },

    clearPredictions: async (targetId: string): Promise<Changed> => {
      const pending = this.#labeled(targetId).filter(
        (it) =>
          it.partition === Partition.Inference &&
          !representsUnknown(it.categoryId),
      );
      const unknown = this.#categories.find(
        (c) =>
          representsUnknown(c.id) &&
          (targetId === IMAGE_CLASSIFIER_ID
            ? c.type === "image"
            : c.type === "annotation" && c.kindId === targetId),
      )!;
      this.#label(
        targetId,
        pending.map((it) => ({ id: it.id, categoryId: unknown.id })),
      );
      for (const it of pending) this.#softmax.delete(it.id);
      return { changed: pending.length };
    },

    export: async () => {
      throw new BackendError("NOT_SUPPORTED", "The fake keeps no weights");
    },

    import: async () => {
      throw new BackendError("NOT_SUPPORTED", "The fake keeps no weights");
    },
  };
}

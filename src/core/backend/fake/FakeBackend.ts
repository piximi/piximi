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
import { TaskCancelledError } from "core/dl/cancel";
import { defaultClassifier } from "core/dl/classification/utils";
import { CHANNEL_MODE } from "core/dl/segmentation/optionUtils";
import { OUTPUT_MODE } from "core/dl/segmentation/models/consts";

import { IMAGE_CLASSIFIER_ID } from "store/classifier/constants";

import { compositeChannelsToDataUrl } from "utils/image/compositeChannels";

import {
  fingerprintItems,
  hashCategorySet,
  splitForTraining,
} from "../classification";
import { BackendError } from "../errors";
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
  Category,
  Channel,
  ChannelMeta,
  Experiment,
  ImageObject,
  ImageSeries,
  Kind,
  Plane,
} from "core/entities";
import type {
  Classifier,
  EvaluationResult,
  Run,
} from "core/dl/classification/types";

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
  AnnotationUpdate,
  Backend,
  BackendClassification,
  BackendSession,
  CallOptions,
  Changed,
  ClassifierCreateRequest,
  ClassifierFitRequest,
  ClassifierFitSummary,
  ClassifierPredictRequest,
  ClassifierPredictSummary,
  ClassifierUpdateRequest,
  ModelDescriptor,
  Counts,
  Deleted,
  ImageCountGroup,
  ImageQuery,
  ImageRecord,
  ImageSort,
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
} from "../types";

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

/*
 * A complete in-memory backend with no workers, no IndexedDB and no models,
 * for exercising everything above the Backend interface: the conformance
 * suite, store sync, and hooks. Its one "model" labels each image with a
 * single whole-image object, which is enough to drive the event and job
 * paths end to end.
 */
export class FakeBackend implements Backend {
  readonly kind = "local" as const;
  readonly capabilities: readonly Capability[] = [
    "raw-local",
    "segmentation",
    "classification",
    "classification.train",
  ];
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
  #modelLoaded = false;
  #classifiers: Classifier[] = [];
  /* What each fitted classifier learned: the majority class and the shares. */
  #learned = new Map<string, { categoryId: string; softmax: number[] }>();
  /* The distributions behind pending predictions, for the softmax sort. */
  #softmax = new Map<string, number[]>();

  constructor(seed: { images: FakeImageSeed[] }) {
    const channelCount = Math.max(0, ...seed.images.map((im) => im.channels));
    for (let c = 0; c < channelCount; c++) {
      this.#channelMetas.push({
        id: `meta-${c}`,
        name: `Channel ${c}`,
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
      this.#pixels.set(channelId, {
        data: data.buffer,
        width,
        height,
        bitDepth: 8,
      });
      this.#channels.push({
        id: channelId,
        planeId,
        channelMetaId: `meta-${c}`,
        name: `Channel ${c}`,
        dtype: "uint8",
        bitDepth: 8,
        width,
        height,
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
  };

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
    delete volume.predictionConfidence;
    delete volume.predictedAtRunId;
    const { id, kindId, categoryId, predictionCorrected } = volume;
    return {
      id,
      kindId,
      categoryId,
      ...(predictionCorrected && { predictionCorrected }),
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
        });
      }

      if (annotations.length > 0) {
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

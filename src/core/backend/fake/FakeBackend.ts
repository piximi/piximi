import {
  STORES,
  UNKNOWN_IMAGE_CATEGORY,
  UNKNOWN_KIND,
  UNKNOWN_KIND_CATEGORY,
  generateKind,
  generateUUID,
} from "core/entities";
import { Partition } from "core/dl/enums";
import { TaskCancelledError } from "core/dl/cancel";
import { CHANNEL_MODE } from "core/dl/segmentation/optionUtils";
import { OUTPUT_MODE } from "core/dl/segmentation/models/consts";

import { compositeChannelsToDataUrl } from "utils/image/compositeChannels";

import { BackendError } from "../errors";
import { EventBus } from "../events";
import { JobRegistry } from "../jobs";

import type {
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

import type { StoredPixels } from "utils/image/compositeChannels";

import type { Capability } from "../capabilities";
import type { BackendEventListener } from "../events";
import type { Job } from "../jobs";
import type {
  AnnotationQuery,
  AnnotationRecord,
  Backend,
  BackendSession,
  CallOptions,
  ImageQuery,
  ImageRecord,
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
} from "../types";

type FakeImageSeed = {
  id: string;
  width: number;
  height: number;
  channels: number;
};

export const FAKE_MODEL_ID = "fake-whole-image";

const paginate = <T>(items: T[], page: PageRequest): Page<T> => {
  const offset = page.cursor ? Number(page.cursor) : 0;
  const end = Math.min(offset + page.limit, items.length);
  return {
    items: items.slice(offset, end),
    total: items.length,
    nextCursor: end < items.length ? String(end) : undefined,
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
  readonly capabilities: readonly Capability[] = ["raw-local", "segmentation"];
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
    ): Promise<Page<ImageRecord>> => {
      const wanted = query.ids ? new Set(query.ids) : undefined;
      const records = this.#images
        .filter((image) => !wanted || wanted.has(image.id))
        .map((image) => {
          const planes = this.#planes.filter((p) => p.imageId === image.id);
          const planeIds = new Set(planes.map((p) => p.id));
          return {
            image,
            series: this.#series.find((s) => s.id === image.seriesId)!,
            planes,
            channels: this.#channels.filter((c) => planeIds.has(c.planeId)),
          };
        });
      return paginate(records, page);
    },

    annotations: async (
      query: AnnotationQuery,
      page: PageRequest,
    ): Promise<Page<AnnotationRecord>> => {
      const wanted = query.imageIds ? new Set(query.imageIds) : undefined;
      const volumesById = new Map(this.#volumes.map((v) => [v.id, v]));
      const records = this.#annotations
        .filter((ann) => !wanted || wanted.has(ann.imageId))
        .map(
          ({ encodedMask: _mask, decodedMask: _decoded, ...annotation }) => ({
            volume: volumesById.get(annotation.volumeId)!,
            annotation,
          }),
        );
      return paginate(records, page);
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
}

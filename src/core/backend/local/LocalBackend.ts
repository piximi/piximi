import { DataConnector } from "core/data-connector";
import { generateUUID, representsUnknown } from "core/entities";
import { getClassifierApi } from "core/dl/classification";
import { getSegmenterApi } from "core/dl/segmentation/SegmenterApi";

import { IMAGE_CLASSIFIER_ID } from "store/classifier/constants";
import { dataSlice } from "store/data";
import {
  selectAllCategories,
  selectAllChannelMetas,
  selectAllKinds,
  selectExperiment,
} from "store/data/selectors";

import { compositeChannelsToDataUrl } from "utils/image/compositeChannels";
import { MeasurementsApi } from "utils/measurements/workers/MeasurementsApi";

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
import { LocalClassification } from "./LocalClassification";
import { LocalSegmentation } from "./LocalSegmentation";
import { ThumbnailWorkerPool } from "./ThumbnailWorkerPool";
import { imageUpdate, volumeUpdate } from "./updates";

import type { Category, ImageObject, StorageReference } from "core/entities";
import type { IClassifierApi } from "core/dl/classification/types";
import type { ISegmenterApi } from "core/dl/segmentation/types";

import type { CompositeLayer } from "utils/image/compositeChannels";

import type { Capability } from "../capabilities";
import type { BackendEventListener } from "../events";
import type { Job } from "../jobs";
import type { AnnotationContext, AnnotationRow, ImageContext } from "../query";
import type {
  AnnotationCountGroup,
  AnnotationQuery,
  AnnotationRecord,
  AnnotationSort,
  Backend,
  BackendSegmentation,
  BackendClassification,
  BackendSession,
  CallOptions,
  Changed,
  Counts,
  Deleted,
  ImageCountGroup,
  ImageQuery,
  ImageRecord,
  ImageSort,
  Page,
  PageRequest,
  ProjectSummary,
  RawChannelData,
  RenderRequest,
  RenderResult,
  RenderedImage,
} from "../types";
import type { MeasurementsProvider } from "./LocalSegmentation";
import type { StoreHandle } from "./store";
import type { ThumbnailItem, ThumbnailRenderer } from "./thumbnails";

type LocalBackendDeps = {
  store: StoreHandle;
  dataConnector?: DataConnector;
  thumbnails?: ThumbnailRenderer;
  /* Factories, so that constructing the backend spawns no workers. */
  segmenter?: () => ISegmenterApi;
  classifier?: () => IClassifierApi;
  measurements?: () => MeasurementsProvider;
};

const groupBy = <T>(
  entities: { ids: string[]; entities: Record<string, T> },
  key: (item: T) => string,
): Map<string, T[]> => {
  const groups = new Map<string, T[]>();
  for (const id of entities.ids) {
    const item = entities.entities[id];
    const group = groups.get(key(item));
    if (group) group.push(item);
    else groups.set(key(item), [item]);
  }
  return groups;
};

type RootState = ReturnType<StoreHandle["getState"]>;
type DataState = RootState["data"];

/* A value derived from one slice of state, rebuilt only when that slice is
 * replaced. */
class Derived<S, V> {
  readonly #build: (source: S) => V;
  #source: S | undefined;
  #value: V | undefined;

  constructor(build: (source: S) => V) {
    this.#build = build;
  }

  get(source: S): V {
    if (this.#value === undefined || source !== this.#source) {
      this.#source = source;
      this.#value = this.#build(source);
    }
    return this.#value;
  }
}

/*
 * The in-browser backend: metadata lives in the Redux data slice, pixels in
 * IndexedDB, and compute in workers. For now the store is still written by
 * the UI directly; the backend reads it and emits events for the changes it
 * originates itself.
 */
export class LocalBackend implements Backend {
  readonly kind = "local" as const;
  // Everything the in-browser app can do; remote backends declare a subset.
  readonly capabilities: readonly Capability[] = [
    "raw-local",
    "segmentation",
    "classification",
    "classification.train",
    "measurements",
    "ingest.upload",
    "project.io",
    "annotations.commit",
  ];
  readonly session: BackendSession = {
    id: generateUUID(),
    protocolVersion: "local",
  };

  readonly #store: StoreHandle;
  readonly #storage: DataConnector;
  readonly #thumbnails: ThumbnailRenderer;
  readonly #bus = new EventBus();
  readonly #jobs = new JobRegistry(this.#bus);
  readonly segmentation: BackendSegmentation;
  readonly classification: BackendClassification;

  readonly #imageRows = new Derived((images: DataState["images"]) =>
    images.ids.map((id) => images.entities[id]),
  );
  readonly #annotationRows = new Derived((data: DataState): AnnotationRow[] =>
    data.annotations.ids.map((id) => {
      const {
        encodedMask: _mask,
        decodedMask: _decoded,
        ...annotation
      } = data.annotations.entities[id];
      return {
        annotation,
        volume: data.annotationVolumes.entities[annotation.volumeId],
      };
    }),
  );
  readonly #annotatedImages = new Derived(
    (annotations: DataState["annotations"]) =>
      new Set(annotations.ids.map((id) => annotations.entities[id].imageId)),
  );
  readonly #planesByImage = new Derived((planes: DataState["planes"]) =>
    groupBy(planes, (plane) => plane.imageId),
  );
  readonly #channelsByPlane = new Derived((channels: DataState["channels"]) =>
    groupBy(channels, (channel) => channel.planeId),
  );
  /* Filtered, sorted listings by query, kept while the state they were
   * computed from is current. */
  readonly #listings = new Map<
    string,
    { data: DataState; classifier: unknown; rows: unknown[] }
  >();

  constructor(deps: LocalBackendDeps) {
    this.#store = deps.store;
    this.#storage = deps.dataConnector ?? DataConnector.getInstance();
    this.#thumbnails = deps.thumbnails ?? new ThumbnailWorkerPool();
    this.segmentation = new LocalSegmentation({
      store: deps.store,
      segmenter: deps.segmenter ?? getSegmenterApi,
      measurements: deps.measurements ?? (() => MeasurementsApi.getInstance()),
      jobs: this.#jobs,
      bus: this.#bus,
    });
    this.classification = new LocalClassification({
      store: deps.store,
      classifier: deps.classifier ?? getClassifierApi,
      jobs: this.#jobs,
      bus: this.#bus,
    });
  }

  async connect(): Promise<void> {
    await this.#storage.init();
  }

  async dispose(): Promise<void> {
    this.#thumbnails.dispose();
  }

  subscribe(listener: BackendEventListener): () => void {
    return this.#bus.subscribe(listener);
  }

  // ── Query ──────────────────────────────────────────────────────────────────

  #listing<T>(key: string, state: RootState, build: () => T[]): T[] {
    const classifier = (state as Partial<RootState>).classifier;
    const cached = this.#listings.get(key);
    if (
      cached &&
      cached.data === state.data &&
      cached.classifier === classifier
    )
      return cached.rows as T[];
    const rows = build();
    if (this.#listings.size >= 16) {
      this.#listings.delete(this.#listings.keys().next().value!);
    }
    this.#listings.set(key, { data: state.data, classifier, rows });
    return rows;
  }

  #imageContext(state: RootState): ImageContext {
    const { categories, annotations } = state.data;
    const softmax = (state as Partial<RootState>).classifier?.kindClassifiers[
      IMAGE_CLASSIFIER_ID
    ]?.activeSoftmaxById;
    return {
      categoryName: (id) => categories.entities[id]?.name ?? "",
      isAnnotated: (id) => this.#annotatedImages.get(annotations).has(id),
      softmaxMargin: (id) => {
        const probabilities = softmax?.[id];
        return probabilities && marginOf(probabilities);
      },
    };
  }

  #annotationContext(state: RootState): AnnotationContext {
    const { categories, images, planes } = state.data;
    const classifiers = (state as Partial<RootState>).classifier
      ?.kindClassifiers;
    return {
      categoryName: (id) => categories.entities[id]?.name ?? "",
      imageName: (id) => images.entities[id]?.name ?? "",
      planeZIndex: (id) => planes.entities[id]?.zIndex ?? -Infinity,
      softmaxMargin: (id, kindId) => {
        const probabilities = classifiers?.[kindId]?.activeSoftmaxById?.[id];
        return probabilities && marginOf(probabilities);
      },
    };
  }

  #images(state: RootState, query: ImageQuery, sort?: ImageSort) {
    return this.#listing(
      `images:${JSON.stringify([query, sort])}`,
      state,
      () => {
        const ctx = this.#imageContext(state);
        const rows = this.#imageRows.get(state.data.images);
        return sortImages(filterImages(rows, query, ctx), sort, ctx);
      },
    );
  }

  #annotations(
    state: RootState,
    query: AnnotationQuery,
    sort?: AnnotationSort,
  ) {
    return this.#listing(
      `annotations:${JSON.stringify([query, sort])}`,
      state,
      () => {
        const ctx = this.#annotationContext(state);
        const rows = this.#annotationRows.get(state.data);
        return sortAnnotations(filterAnnotations(rows, query), sort, ctx);
      },
    );
  }

  #imageRecord(state: RootState, image: ImageObject): ImageRecord {
    const planes =
      this.#planesByImage.get(state.data.planes).get(image.id) ?? [];
    const channelsByPlane = this.#channelsByPlane.get(state.data.channels);
    return {
      image,
      series: state.data.imageSeries.entities[image.seriesId],
      planes,
      channels: planes.flatMap((p) => channelsByPlane.get(p.id) ?? []),
    };
  }

  readonly query = {
    project: async (): Promise<ProjectSummary> => {
      const state = this.#store.getState();
      return {
        experiment: selectExperiment(state),
        kinds: selectAllKinds(state),
        categories: selectAllCategories(state),
        channelMetas: selectAllChannelMetas(state),
        counts: {
          images: state.data.images.ids.length,
          annotations: state.data.annotations.ids.length,
        },
      };
    },

    images: async (
      query: ImageQuery,
      page: PageRequest,
      sort?: ImageSort,
    ): Promise<Page<ImageRecord>> => {
      const state = this.#store.getState();
      const { items, total } = paginate(this.#images(state, query, sort), page);
      return { total, items: items.map((im) => this.#imageRecord(state, im)) };
    },

    imageIds: async (query: ImageQuery, sort?: ImageSort): Promise<string[]> =>
      this.#images(this.#store.getState(), query, sort).map((im) => im.id),

    imageCounts: async (
      query: ImageQuery,
      groupBy?: ImageCountGroup,
    ): Promise<Counts> => {
      const rows = this.#images(this.#store.getState(), query);
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
      paginate(this.#annotations(this.#store.getState(), query, sort), page),

    annotationIds: async (
      query: AnnotationQuery,
      sort?: AnnotationSort,
    ): Promise<string[]> =>
      this.#annotations(this.#store.getState(), query, sort).map(
        (row) => row.annotation.id,
      ),

    annotationCounts: async (
      query: AnnotationQuery,
      groupBy?: AnnotationCountGroup,
    ): Promise<Counts> => {
      const rows = this.#annotations(this.#store.getState(), query);
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
      const { annotations } = this.#store.getState().data;
      return Object.fromEntries(
        annotationIds
          .filter((id) => annotations.entities[id])
          .map((id) => [id, annotations.entities[id].encodedMask]),
      );
    },
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  #storageRef(channelId: string): StorageReference {
    const channel = this.#store.getState().data.channels.entities[channelId];
    if (!channel) {
      throw new BackendError("NOT_FOUND", `Unknown channel ${channelId}`);
    }
    return channel.storageReference;
  }

  /* Resolves a request's visible channels against IndexedDB. */
  #thumbnailItem(request: RenderRequest): ThumbnailItem {
    const layers: CompositeLayer[] = [];
    const refs: ThumbnailItem["refs"] = [];
    for (const channel of request.channels) {
      if (!channel.visible) continue;
      const ref = this.#storageRef(channel.channelId);
      layers.push({
        pixelKey: ref.storageId,
        colorMap: channel.colorMap,
        rampMin: channel.rampMin,
        rampMax: channel.rampMax,
      });
      refs.push({ id: ref.storageId, storeName: ref.storeName });
    }
    if (layers.length === 0) {
      throw new BackendError("NOT_FOUND", "No visible channels to render");
    }
    return { layers, refs, crop: request.region };
  }

  readonly render = {
    image: async (request: RenderRequest): Promise<RenderedImage> => {
      const item = this.#thumbnailItem(request);
      const result = await this.#storage.retrieveBatch(item.refs);
      if (!result.success) {
        throw new BackendError("NOT_FOUND", result.error.message, {
          cause: result.error,
        });
      }
      const { width, height } = result.data.get(item.refs[0].id)!;
      const [x0, y0, x1, y1] = item.crop ?? [0, 0, width, height];
      return {
        width: x1 - x0,
        height: y1 - y0,
        dataUrl: compositeChannelsToDataUrl(
          item.layers,
          result.data,
          item.crop,
        ),
      };
    },

    thumbnails: (
      requests: RenderRequest[],
      options?: CallOptions,
    ): AsyncIterable<RenderResult> => this.#renderThumbnails(requests, options),

    raw: async (channelIds: string[]): Promise<RawChannelData[]> => {
      const refs = channelIds.map((id) => this.#storageRef(id));
      const result = await this.#storage.retrieveBatch(
        refs.map((ref) => ({ id: ref.storageId, storeName: ref.storeName })),
      );
      if (!result.success) {
        throw new BackendError("NOT_FOUND", result.error.message, {
          cause: result.error,
        });
      }
      return channelIds.map((channelId, i) => {
        const { bitDepth, width, height, data } = result.data.get(
          refs[i].storageId,
        )!;
        return {
          channelId,
          bitDepth,
          width,
          height,
          data: bitDepth === 8 ? new Uint8Array(data) : new Uint16Array(data),
        };
      });
    },
  };

  async *#renderThumbnails(
    requests: RenderRequest[],
    options?: CallOptions,
  ): AsyncIterable<RenderResult> {
    // A request that cannot be resolved fails on its own; the rest still render.
    const items: Array<ThumbnailItem & { index: number }> = [];
    for (const [index, request] of requests.entries()) {
      try {
        items.push({ ...this.#thumbnailItem(request), index });
      } catch (error) {
        yield { index, ok: false, error: error as Error };
      }
    }
    for await (const result of this.#thumbnails.render(
      items,
      options?.signal,
    )) {
      yield { ...result, index: items[result.index].index };
    }
  }

  // ── Mutations ──────────────────────────────────────────────────────────────
  //
  // The store is the local truth, so deleting is dispatching; the event
  // follows for anyone listening, as it would from a remote engine.

  readonly images = {
    delete: async (query: ImageQuery): Promise<Deleted> => {
      const ids = await this.query.imageIds(query);
      if (ids.length > 0) {
        this.#store.dispatch(dataSlice.actions.batchDeleteImageObject(ids));
        this.#bus.emit({ type: "images/didRemove", imageIds: ids });
      }
      return { deleted: ids.length };
    },

    categorize: async (
      query: ImageQuery,
      categoryId: string,
    ): Promise<Changed> => {
      const ids = await this.query.imageIds(query);
      const before = this.#store.getState().data.images.entities;
      const changing = ids.filter(
        (id) => before[id] && before[id].categoryId !== categoryId,
      );
      if (changing.length === 0) return { changed: 0 };
      this.#store.dispatch(
        dataSlice.actions.batchUpdateImageCategory(
          changing.map((id) => ({ id, categoryId })),
        ),
      );
      // The reducer applies the partition and correction rules; the event
      // carries what they produced.
      const after = this.#store.getState().data.images.entities;
      const updates = changing
        .filter((id) => after[id]?.categoryId === categoryId)
        .map((id) => imageUpdate(after[id]));
      if (updates.length > 0) {
        this.#bus.emit({ type: "images/didUpdate", updates });
      }
      return { changed: updates.length };
    },
  };

  readonly annotations = {
    delete: async (query: AnnotationQuery): Promise<Deleted> => {
      const ids = await this.query.annotationIds(query);
      if (ids.length === 0) return { deleted: 0 };
      const { annotations } = this.#store.getState().data;
      const candidates = new Set(
        ids.flatMap((id) => annotations.entities[id]?.volumeId ?? []),
      );
      this.#store.dispatch(dataSlice.actions.batchDeleteAnnotation(ids));
      // The reducer drops a volume with its last annotation.
      const after = this.#store.getState().data.annotationVolumes.entities;
      this.#bus.emit({
        type: "annotations/didRemove",
        annotationIds: ids,
        volumeIds: [...candidates].filter((id) => !after[id]),
      });
      return { deleted: ids.length };
    },

    categorize: async (
      query: AnnotationQuery,
      categoryId: string,
    ): Promise<Changed> => {
      const ids = await this.query.annotationIds(query);
      const { annotations, annotationVolumes } = this.#store.getState().data;
      const volumeOf = (id: string) => annotations.entities[id]?.volumeId;
      const candidates = new Set(
        ids
          .map(volumeOf)
          .filter(
            (volumeId): volumeId is string =>
              !!volumeId &&
              annotationVolumes.entities[volumeId]?.categoryId !== categoryId,
          ),
      );
      if (candidates.size === 0) return { changed: 0 };
      this.#store.dispatch(
        dataSlice.actions.batchBubbleUpdateAnnotationCategory(
          ids.map((id) => ({ id, categoryId })),
        ),
      );
      const after = this.#store.getState().data;
      const moved = new Set(
        [...candidates].filter(
          (volumeId) =>
            after.annotationVolumes.entities[volumeId]?.categoryId ===
            categoryId,
        ),
      );
      if (moved.size === 0) return { changed: 0 };
      this.#bus.emit({
        type: "annotations/didUpdate",
        volumes: [...moved].map((volumeId) =>
          volumeUpdate(after.annotationVolumes.entities[volumeId]),
        ),
        // Every annotation of a moved volume followed the partition rule.
        annotations: after.annotations.ids
          .filter((id) => moved.has(after.annotations.entities[id].volumeId))
          .map((id) => ({
            id,
            partition: after.annotations.entities[id].partition,
          })),
      });
      return {
        changed: ids.filter((id) => moved.has(volumeOf(id) ?? "")).length,
      };
    },
  };

  #categoriesChanged(): void {
    this.#bus.emit({
      type: "categories/didChange",
      categories: selectAllCategories(this.#store.getState()),
    });
  }

  readonly categories = {
    create: async (categories: Category[]): Promise<Category[]> => {
      if (categories.length > 0) {
        this.#store.dispatch(dataSlice.actions.batchAddCategory(categories));
        this.#categoriesChanged();
      }
      return categories;
    },

    update: async (
      id: string,
      changes: { name?: string; color?: string },
    ): Promise<Category> => {
      const current = this.#store.getState().data.categories.entities[id];
      if (!current) {
        throw new BackendError("NOT_FOUND", `Unknown category ${id}`);
      }
      if (changes.name !== undefined || changes.color !== undefined) {
        this.#store.dispatch(
          dataSlice.actions.updateCategoryDisplayProps({
            id,
            changes: {
              ...(changes.name !== undefined && { name: changes.name }),
              ...(changes.color !== undefined && { color: changes.color }),
            } as { name: string } | { color: string },
          }),
        );
        this.#categoriesChanged();
      }
      return this.#store.getState().data.categories.entities[id];
    },

    delete: async (ids: string[]): Promise<Deleted> => {
      const { data } = this.#store.getState();
      const gone = ids
        .map((id) => data.categories.entities[id])
        .filter((category) => category && !representsUnknown(category.id));
      if (gone.length === 0) return { deleted: 0 };
      const goneIds = new Set(gone.map((category) => category.id));
      const imageIds = data.images.ids.filter((id) =>
        goneIds.has(data.images.entities[id].categoryId),
      );
      const volumeIds = data.annotationVolumes.ids.filter((id) =>
        goneIds.has(data.annotationVolumes.entities[id].categoryId),
      );
      this.#store.dispatch(
        dataSlice.actions.batchDeleteCategory(
          gone.map((category) => ({
            id: category.id,
            details:
              category.type === "image"
                ? { type: "image" }
                : { type: "annotation", kindId: category.kindId },
          })),
        ),
      );
      // The reducer returned their items to the unknown categories.
      const after = this.#store.getState().data;
      if (imageIds.length > 0) {
        this.#bus.emit({
          type: "images/didUpdate",
          updates: imageIds.map((id) => imageUpdate(after.images.entities[id])),
        });
      }
      if (volumeIds.length > 0) {
        this.#bus.emit({
          type: "annotations/didUpdate",
          volumes: volumeIds.map((id) =>
            volumeUpdate(after.annotationVolumes.entities[id]),
          ),
          annotations: [],
        });
      }
      this.#categoriesChanged();
      return { deleted: gone.length };
    },
  };

  // ── Jobs ───────────────────────────────────────────────────────────────────

  readonly jobs = {
    list: async (): Promise<Job[]> => this.#jobs.list(),
    cancel: async (id: string): Promise<void> => this.#jobs.cancel(id),
  };
}

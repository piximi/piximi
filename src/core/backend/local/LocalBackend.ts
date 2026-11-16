import { DataConnector } from "core/data-connector";
import { generateUUID } from "core/entities";

import {
  selectAllCategories,
  selectAllChannelMetas,
  selectAllKinds,
  selectExperiment,
} from "store/data/selectors";

import { compositeChannelsToDataUrl } from "utils/image/compositeChannels";

import { BackendError } from "../errors";
import { EventBus } from "../events";
import { JobRegistry } from "../jobs";
import { ThumbnailWorkerPool } from "./ThumbnailWorkerPool";

import type { StorageReference } from "core/entities";

import type { RootState } from "store/rootReducer";

import type { CompositeLayer } from "utils/image/compositeChannels";

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
} from "../types";
import type { ThumbnailItem, ThumbnailRenderer } from "./thumbnails";

/* The slice of the Redux store the local backend reads metadata from. */
export type StoreHandle = { getState(): RootState };

type LocalBackendDeps = {
  store: StoreHandle;
  dataConnector?: DataConnector;
  thumbnails?: ThumbnailRenderer;
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

const paginate = <T>(
  ids: string[],
  page: PageRequest,
  toItem: (id: string) => T,
): Page<T> => {
  const offset = page.cursor ? Number(page.cursor) : 0;
  const end = Math.min(offset + page.limit, ids.length);
  return {
    items: ids.slice(offset, end).map(toItem),
    total: ids.length,
    nextCursor: end < ids.length ? String(end) : undefined,
  };
};

/*
 * The in-browser backend: metadata lives in the Redux data slice, pixels in
 * IndexedDB, and compute in workers. For now the store is still written by
 * the UI directly; the backend reads it and emits events for the changes it
 * originates itself.
 */
export class LocalBackend implements Backend {
  readonly kind = "local" as const;
  readonly capabilities: readonly Capability[] = ["raw-local"];
  readonly session: BackendSession = {
    id: generateUUID(),
    protocolVersion: "local",
  };

  readonly #store: StoreHandle;
  readonly #storage: DataConnector;
  readonly #thumbnails: ThumbnailRenderer;
  readonly #bus = new EventBus();
  readonly #jobs = new JobRegistry(this.#bus);

  constructor(deps: LocalBackendDeps) {
    this.#store = deps.store;
    this.#storage = deps.dataConnector ?? DataConnector.getInstance();
    this.#thumbnails = deps.thumbnails ?? new ThumbnailWorkerPool();
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
    ): Promise<Page<ImageRecord>> => {
      const { images, planes, channels } = this.#store.getState().data;
      const ids = query.ids
        ? query.ids.filter((id) => images.entities[id])
        : images.ids;

      const planesByImage = groupBy(planes, (plane) => plane.imageId);
      const channelsByPlane = groupBy(channels, (channel) => channel.planeId);

      return paginate(ids, page, (id) => {
        const imagePlanes = planesByImage.get(id) ?? [];
        return {
          image: images.entities[id],
          planes: imagePlanes,
          channels: imagePlanes.flatMap((p) => channelsByPlane.get(p.id) ?? []),
        };
      });
    },

    annotations: async (
      query: AnnotationQuery,
      page: PageRequest,
    ): Promise<Page<AnnotationRecord>> => {
      const { annotations, annotationVolumes } = this.#store.getState().data;
      const wanted = query.imageIds ? new Set(query.imageIds) : undefined;
      const ids = wanted
        ? annotations.ids.filter((id) =>
            wanted.has(annotations.entities[id].imageId),
          )
        : annotations.ids;
      return paginate(ids, page, (id) => {
        const {
          encodedMask: _mask,
          decodedMask: _decoded,
          ...annotation
        } = annotations.entities[id];
        return {
          volume: annotationVolumes.entities[annotation.volumeId],
          annotation,
        };
      });
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

  // ── Jobs ───────────────────────────────────────────────────────────────────

  readonly jobs = {
    list: async (): Promise<Job[]> => this.#jobs.list(),
    cancel: async (id: string): Promise<void> => this.#jobs.cancel(id),
  };
}

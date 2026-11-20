import { STORES } from "core/entities";
import { isTaskCancelledError } from "core/dl/cancel";

import { hasCapability } from "../capabilities";
import { EventBus } from "../events";
import { PROTOCOL_VERSION } from "../protocol/methods";
import { isSegmentationModel } from "../models";
import { RpcPeer } from "./rpc/peer";
import { WebSocketTransport } from "./transports/websocket";

import type {
  AnnotationObject,
  Category,
  Channel,
  Partition,
} from "core/entities";

import type { Capability } from "../capabilities";
import type { BackendEventListener } from "../events";
import type { Job } from "../jobs";
import type * as P from "../protocol/generated";
import type { ProtocolMethods } from "../protocol/methods";
import type {
  AnnotationCountGroup,
  AnnotationHeader,
  AnnotationQuery,
  AnnotationRecord,
  AnnotationSort,
  Backend,
  BackendSegmentation,
  BackendSession,
  CallOptions,
  Counts,
  Deleted,
  ImageCountGroup,
  ImageQuery,
  ImageRecord,
  ImageSort,
  ModelDescriptor,
  Page,
  PageRequest,
  ProjectSummary,
  RenderRequest,
  RenderResult,
  RenderedImage,
  SegmentationModelDescriptor,
  SegmentationRunRequest,
  SegmentationRunSummary,
} from "../types";

type Methods = ProtocolMethods;
type Params<M extends keyof Methods> = Methods[M]["params"];
type Result<M extends keyof Methods> = Methods[M]["result"];
type Progress<M extends keyof Methods> = Methods[M]["progress"];

/*
 * Wire values are passed through as domain values: `compat.test.ts` proves
 * the two type families mutually assignable, and the few nominal
 * differences (string enums, index signatures) are identical at runtime.
 */
const asDomain = <T>(wire: unknown): T => wire as T;
const asWire = <T>(domain: unknown): T => domain as T;

/* Remote channels have no local pixels; the reference just names them. */
const withStorageReference = (channel: P.Channel): Channel => ({
  ...asDomain<Omit<Channel, "storageReference">>(channel),
  storageReference: {
    storageId: channel.id,
    storeName: STORES.CHANNEL_DATA,
    width: channel.width,
    height: channel.height,
    dtype: channel.dtype,
    byteSize: 0,
  },
});

const toImageRecord = (record: P.ImageRecord): ImageRecord => ({
  image: { ...record.image, partition: record.image.partition as Partition },
  series: record.series,
  planes: record.planes,
  channels: record.channels.map(withStorageReference),
});

const toDataUrl = (mime: string, bytes: Uint8Array): string => {
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return `data:${mime};base64,${btoa(binary)}`;
};

const toRenderedImage = (image: P.RenderedImage): RenderedImage => ({
  width: image.width,
  height: image.height,
  dataUrl: toDataUrl(image.mime, image.data),
});

const toRenderResult = (
  result: P.ThumbnailRendered | P.ThumbnailFailed,
): RenderResult =>
  result.status === "rendered"
    ? { index: result.index, ok: true, image: toRenderedImage(result.image) }
    : {
        index: result.index,
        ok: false,
        error: new Error(`${result.error.code}: ${result.error.message}`),
      };

/*
 * The frontend end of a remote session: a `Backend` whose every call is a
 * protocol request on an `RpcPeer`, and whose events are the notifications
 * the server pushes.
 */
export class RemoteBackend implements Backend {
  readonly kind = "remote" as const;
  capabilities: readonly Capability[] = [];
  session: BackendSession = { id: "", protocolVersion: PROTOCOL_VERSION };
  segmentation?: BackendSegmentation;

  readonly #peer: RpcPeer;
  readonly #bus = new EventBus();
  #url?: string;

  static async connect(
    url: string,
    options: { ticket?: string } = {},
  ): Promise<RemoteBackend> {
    const backend = new RemoteBackend(
      new RpcPeer(await WebSocketTransport.connect(url)),
    );
    backend.#url = url;
    await backend.connect(options.ticket);
    return backend;
  }

  constructor(peer: RpcPeer) {
    this.#peer = peer;
    peer.onNotification("kinds/didAdd", (params) =>
      this.#bus.emit(asDomain(params)),
    );
    peer.onNotification("annotations/didAdd", (params) => {
      const event = params as P.AnnotationsDidAdd;
      this.#bus.emit({
        type: "annotations/didAdd",
        volumes: event.volumes,
        annotations: asDomain<AnnotationObject[]>(event.annotations),
      });
    });
    peer.onNotification("jobs/didUpdate", (params) =>
      this.#bus.emit({
        type: "jobs/didUpdate",
        job: (params as P.JobsDidUpdate).job,
      }),
    );
    peer.onNotification("images/didAdd", (params) => {
      const event = params as P.ImagesDidAdd;
      this.#bus.emit({
        type: "images/didAdd",
        records: event.records.map(toImageRecord),
        channelMetas: event.channelMetas,
      });
    });
    peer.onNotification("images/didRemove", (params) =>
      this.#bus.emit({
        type: "images/didRemove",
        imageIds: (params as P.ImagesDidRemove).imageIds,
      }),
    );
    peer.onNotification("annotations/didRemove", (params) => {
      const event = params as P.AnnotationsDidRemove;
      this.#bus.emit({
        type: "annotations/didRemove",
        annotationIds: event.annotationIds,
        volumeIds: event.volumeIds,
      });
    });
    peer.onNotification("models/didChange", (params) =>
      this.#bus.emit({
        type: "models/didChange",
        models: asDomain<ModelDescriptor[]>(
          (params as P.ModelsDidChange).models,
        ),
      }),
    );
  }

  #call<M extends keyof Methods>(
    method: M,
    params: Params<M>,
    options?: {
      signal?: AbortSignal;
      onProgress?: (value: Progress<M>) => void;
    },
  ): Promise<Result<M>> {
    return this.#peer.request<Result<M>>(method, params, {
      signal: options?.signal,
      onProgress: options?.onProgress as ((value: unknown) => void) | undefined,
    });
  }

  /* `ticket` is what the launch token was exchanged for; see `bootstrap`. */
  async connect(ticket?: string): Promise<void> {
    if (this.session.id) return;
    const result = await this.#call("initialize", {
      protocolVersion: PROTOCOL_VERSION,
      clientInfo: {
        name: "piximi",
        version: import.meta.env.VITE_APP_VERSION ?? "dev",
      },
      clientCapabilities: [],
      ...(ticket && { auth: { ticket } }),
    });
    this.capabilities = result.serverCapabilities;
    this.session = {
      id: result.sessionId,
      protocolVersion: result.protocolVersion,
      server: { ...result.serverInfo, url: this.#url },
    };
    this.segmentation = hasCapability(this.capabilities, "segmentation")
      ? this.#segmentation()
      : undefined;
    this.#peer.notify("initialized");
  }

  async dispose(): Promise<void> {
    this.#peer.close();
  }

  subscribe(listener: BackendEventListener): () => void {
    return this.#bus.subscribe(listener);
  }

  // ── Query ──────────────────────────────────────────────────────────────────

  readonly query = {
    project: async (): Promise<ProjectSummary> => {
      const summary = await this.#call("query/project", undefined);
      return {
        experiment: summary.experiment,
        kinds: summary.kinds,
        categories: asDomain<Category[]>(summary.categories),
        channelMetas: summary.channelMetas,
        counts: summary.counts,
      };
    },

    images: async (
      query: ImageQuery,
      page: PageRequest,
      sort?: ImageSort,
    ): Promise<Page<ImageRecord>> => {
      const result = await this.#call("query/images", {
        query: asWire<P.ImageQuery>(query),
        sort,
        page,
      });
      return { total: result.total, items: result.items.map(toImageRecord) };
    },

    imageIds: async (query: ImageQuery, sort?: ImageSort): Promise<string[]> =>
      (
        await this.#call("query/imageIds", {
          query: asWire<P.ImageQuery>(query),
          sort,
        })
      ).ids,

    imageCounts: async (
      query: ImageQuery,
      groupBy?: ImageCountGroup,
    ): Promise<Counts> =>
      this.#call("query/imageCounts", {
        query: asWire<P.ImageQuery>(query),
        groupBy,
      }),

    annotations: async (
      query: AnnotationQuery,
      page: PageRequest,
      sort?: AnnotationSort,
    ): Promise<Page<AnnotationRecord>> => {
      const result = await this.#call("query/annotations", {
        query: asWire<P.AnnotationQuery>(query),
        sort,
        page,
      });
      return {
        total: result.total,
        items: result.items.map((record) => ({
          volume: record.volume,
          annotation: asDomain<AnnotationHeader>(record.annotation),
        })),
      };
    },

    annotationIds: async (
      query: AnnotationQuery,
      sort?: AnnotationSort,
    ): Promise<string[]> =>
      (
        await this.#call("query/annotationIds", {
          query: asWire<P.AnnotationQuery>(query),
          sort,
        })
      ).ids,

    annotationCounts: async (
      query: AnnotationQuery,
      groupBy?: AnnotationCountGroup,
    ): Promise<Counts> =>
      this.#call("query/annotationCounts", {
        query: asWire<P.AnnotationQuery>(query),
        groupBy,
      }),

    masks: async (annotationIds: string[]): Promise<Record<string, number[]>> =>
      (await this.#call("query/masks", { annotationIds })).masks,
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  readonly render = {
    image: async (request: RenderRequest): Promise<RenderedImage> =>
      toRenderedImage(await this.#call("render/image", { request })),

    thumbnails: (
      requests: RenderRequest[],
      options?: CallOptions,
    ): AsyncIterable<RenderResult> => this.#thumbnails(requests, options),
  };

  /* Results arrive as progress; this turns them into an iteration. */
  async *#thumbnails(
    requests: RenderRequest[],
    options?: CallOptions,
  ): AsyncIterable<RenderResult> {
    const queue: RenderResult[] = [];
    let wake: (() => void) | null = null;
    let done = false;
    let failure: unknown = null;
    const notify = () => {
      wake?.();
      wake = null;
    };

    const finished = this.#call(
      "render/thumbnails",
      { requests },
      {
        signal: options?.signal,
        onProgress: (partial) => {
          for (const result of partial.results)
            queue.push(toRenderResult(result));
          notify();
        },
      },
    ).then(
      () => {
        done = true;
        notify();
      },
      (error: unknown) => {
        failure = error;
        done = true;
        notify();
      },
    );

    while (true) {
      if (queue.length > 0) {
        yield queue.shift()!;
        continue;
      }
      if (done) break;
      await new Promise<void>((resolve) => {
        wake = resolve;
      });
    }
    await finished;
    if (failure && !isTaskCancelledError(failure)) throw failure;
  }

  // ── Mutations ──────────────────────────────────────────────────────────────

  readonly images = {
    delete: (query: ImageQuery): Promise<Deleted> =>
      this.#call("images/delete", { query: asWire<P.ImageQuery>(query) }),
  };

  readonly annotations = {
    delete: (query: AnnotationQuery): Promise<Deleted> =>
      this.#call("annotations/delete", {
        query: asWire<P.AnnotationQuery>(query),
      }),
  };

  // ── Jobs ───────────────────────────────────────────────────────────────────

  readonly jobs = {
    list: async (): Promise<Job[]> =>
      (await this.#call("jobs/list", undefined)).jobs,
    cancel: async (id: string): Promise<void> => {
      await this.#call("jobs/cancel", { id });
    },
  };

  // ── Segmentation ───────────────────────────────────────────────────────────

  #segmentation(): BackendSegmentation {
    return {
      listModels: async (): Promise<SegmentationModelDescriptor[]> =>
        asDomain<ModelDescriptor[]>(
          (await this.#call("segmentation/listModels", undefined)).models,
        ).filter(isSegmentationModel),

      loadModel: async (
        modelId: string,
        options?: CallOptions,
      ): Promise<void> => {
        await this.#call(
          "segmentation/loadModel",
          { modelId },
          { signal: options?.signal, onProgress: options?.onProgress },
        );
      },

      run: async (
        request: SegmentationRunRequest,
        options?: CallOptions,
      ): Promise<SegmentationRunSummary> => {
        // Never started, so there is no job to report; the peer would
        // otherwise reject without sending anything.
        if (options?.signal?.aborted) {
          return { added: 0, skipped: 0, cancelled: true };
        }
        return this.#call(
          "segmentation/run",
          {
            modelId: request.modelId,
            imageIds: request.imageIds,
            channelMetaIds: request.channelMetaIds,
            // The wire carries an unset option as null; see compat.test.ts.
            options: request.options
              ? Object.fromEntries(
                  Object.entries(request.options).map(([key, value]) => [
                    key,
                    value ?? null,
                  ]),
                )
              : undefined,
            kindName: request.kindName,
          },
          { signal: options?.signal, onProgress: options?.onProgress },
        );
      },
    };
  }
}

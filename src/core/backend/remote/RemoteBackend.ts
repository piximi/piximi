import { STORES } from "core/entities";
import { isTaskCancelledError } from "core/dl/cancel";

import { hasCapability } from "../capabilities";
import { EventBus } from "../events";
import { PROTOCOL_VERSION } from "../protocol/methods";
import { isSegmentationModel } from "../models";
import { RpcPeer } from "./rpc/peer";
import { WebSocketTransport } from "./transports/websocket";

import type {
  AnnotationCategory,
  AnnotationObject,
  Category,
  Channel,
  Experiment,
  ImageObject,
  Kind,
  Partition,
} from "core/entities";
import type {
  Classifier,
  EvaluationResult,
} from "core/dl/classification/types";

import type { Capability } from "../capabilities";
import type { BackendEventListener } from "../events";
import type { Job } from "../jobs";
import type * as P from "../protocol/generated";
import type { ProtocolMethods } from "../protocol/methods";
import type {
  AnnotationChangeSet,
  AnnotationCountGroup,
  AnnotationHeader,
  AnnotationQuery,
  AnnotationRecord,
  AnnotationSort,
  AnnotationUpdate,
  Backend,
  BackendClassification,
  BackendMeasurements,
  BackendSegmentation,
  BackendSession,
  CallOptions,
  Changed,
  CommitResult,
  ClassifierCreateRequest,
  ClassifierExport,
  ClassifierFitRequest,
  ClassifierFitSummary,
  ClassifierImportRequest,
  ClassifierPredictRequest,
  ClassifierPredictSummary,
  ClassifierUpdateRequest,
  Counts,
  Deleted,
  ImageChange,
  ImageCountGroup,
  ImageQuery,
  ImageRecord,
  ImageSort,
  MeasurementTable,
  ImageUpdate,
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
  BackendIngest,
  AddPathsRequest,
  DirectoryListing,
  IngestSummary,
  PathInspection,
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
/* Maps a call's options onto the peer's request options. */
const progress = (options?: CallOptions) => ({
  signal: options?.signal,
  onProgress: options?.onProgress,
});

export class RemoteBackend implements Backend {
  readonly kind = "remote" as const;
  capabilities: readonly Capability[] = [];
  session: BackendSession = { id: "", protocolVersion: PROTOCOL_VERSION };
  segmentation?: BackendSegmentation;
  classification?: BackendClassification;
  measurements?: BackendMeasurements;
  ingest?: BackendIngest;

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
        updatedChannelMetas: event.updatedChannelMetas ?? [],
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
    peer.onNotification("images/didUpdate", (params) =>
      this.#bus.emit({
        type: "images/didUpdate",
        updates: asDomain<ImageUpdate[]>((params as P.ImagesDidUpdate).updates),
      }),
    );
    peer.onNotification("annotations/didUpdate", (params) => {
      const event = params as P.AnnotationsDidUpdate;
      this.#bus.emit({
        type: "annotations/didUpdate",
        volumes: event.volumes,
        annotations: asDomain<AnnotationUpdate[]>(event.annotations),
        ...(event.headers && {
          headers: asDomain<AnnotationHeader[]>(event.headers),
        }),
      });
    });
    peer.onNotification("kinds/didChange", (params) =>
      this.#bus.emit({
        type: "kinds/didChange",
        kinds: (params as P.KindsDidChange).kinds,
      }),
    );
    peer.onNotification("kinds/didRemove", (params) =>
      this.#bus.emit({
        type: "kinds/didRemove",
        kindIds: (params as P.KindsDidRemove).kindIds,
      }),
    );
    peer.onNotification("images/didChange", (params) =>
      this.#bus.emit({
        type: "images/didChange",
        images: asDomain<ImageObject[]>((params as P.ImagesDidChange).images),
      }),
    );
    peer.onNotification("project/didChange", (params) =>
      this.#bus.emit({
        type: "project/didChange",
        experiment: (params as P.ProjectDidChange).experiment,
      }),
    );
    peer.onNotification("categories/didChange", (params) =>
      this.#bus.emit({
        type: "categories/didChange",
        categories: asDomain<Category[]>(
          (params as P.CategoriesDidChange).categories,
        ),
      }),
    );
    peer.onNotification("classifiers/didChange", (params) =>
      this.#bus.emit({
        type: "classifiers/didChange",
        classifiers: asDomain<Classifier[]>(
          (params as P.ClassifiersDidChange).classifiers,
        ),
      }),
    );
    peer.onNotification("classifiers/didEpoch", (params) => {
      const event = params as P.ClassifiersDidEpoch;
      this.#bus.emit({
        type: "classifiers/didEpoch",
        classifierId: event.classifierId,
        runId: event.runId,
        epoch: event.epoch,
      });
    });
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
    this.classification = hasCapability(this.capabilities, "classification")
      ? this.#classification()
      : undefined;
    this.measurements = hasCapability(this.capabilities, "measurements")
      ? this.#measurements()
      : undefined;
    this.ingest = hasCapability(this.capabilities, "ingest.upload")
      ? this.#ingest()
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
    categorize: (query: ImageQuery, categoryId: string): Promise<Changed> =>
      this.#call("images/categorize", {
        query: asWire<P.ImageQuery>(query),
        categoryId,
      }),
    update: async (updates: ImageChange[]): Promise<ImageObject[]> =>
      asDomain<ImageObject[]>(
        (
          await this.#call("images/update", {
            updates: asWire<P.ImageChange[]>(updates),
          })
        ).images,
      ),
  };

  readonly annotations = {
    delete: (query: AnnotationQuery): Promise<Deleted> =>
      this.#call("annotations/delete", {
        query: asWire<P.AnnotationQuery>(query),
      }),
    categorize: (
      query: AnnotationQuery,
      categoryId: string,
    ): Promise<Changed> =>
      this.#call("annotations/categorize", {
        query: asWire<P.AnnotationQuery>(query),
        categoryId,
      }),
    commit: (
      changeSet: AnnotationChangeSet,
      options?: CallOptions,
    ): Promise<CommitResult> =>
      this.#call(
        "annotations/commit",
        {
          imageIds: changeSet.imageIds,
          volumes: changeSet.volumes,
          annotations: asWire<P.AnnotationChanges>({
            ...changeSet.annotations,
            // The mask is the wire's; a decoded copy stays in the browser.
            created: changeSet.annotations.created.map(
              ({ decodedMask: _decoded, ...annotation }) => annotation,
            ),
          }),
          force: changeSet.force ?? false,
        },
        { signal: options?.signal, onProgress: options?.onProgress },
      ),
    update: (updates: AnnotationUpdate[]): Promise<Changed> =>
      this.#call("annotations/update", {
        updates: asWire<P.AnnotationUpdate[]>(updates),
      }),
  };

  readonly kinds = {
    create: async (
      kinds: Array<{ kind: Kind; category: AnnotationCategory }>,
    ): Promise<Kind[]> => (await this.#call("kinds/create", { kinds })).kinds,
    update: async (id: string, name: string): Promise<Kind> =>
      (await this.#call("kinds/update", { id, name })).kinds[0],
    delete: (ids: string[]): Promise<Deleted> =>
      this.#call("kinds/delete", { ids }),
  };

  readonly project = {
    rename: async (name: string): Promise<Experiment> =>
      (await this.#call("project/update", { name })).experiment,
  };

  readonly categories = {
    create: async (categories: Category[]): Promise<Category[]> =>
      asDomain<Category[]>(
        (
          await this.#call("categories/create", {
            categories:
              asWire<P.CategoriesCreateParams["categories"]>(categories),
          })
        ).categories,
      ),
    update: async (
      id: string,
      changes: { name?: string; color?: string },
    ): Promise<Category> =>
      asDomain<Category>(
        (await this.#call("categories/update", { id, ...changes }))
          .categories[0],
      ),
    delete: (ids: string[]): Promise<Deleted> =>
      this.#call("categories/delete", { ids }),
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

  /*
   * One `ingest` job per batch, streamed a file at a time so neither side
   * holds the whole batch: `open` starts the job, `put` sends a file and
   * answers with what it became, `close` ends it. A file that fails to
   * decode comes back in the result, not as an error, so the rest go on;
   * a cancelled job refuses the next `put`, and the caller's signal stops
   * sending between files.
   */
  #ingest(): BackendIngest {
    return {
      upload: async (files, options) => {
        if (files.length === 0) {
          return { imageIds: [], failed: [], cancelled: false };
        }
        const signal = options?.signal;
        if (signal?.aborted)
          return { imageIds: [], failed: [], cancelled: true };
        const { uploadId } = await this.#call("ingest/open", {
          expected: files.length,
        });
        let cancelled = false;
        try {
          for (let i = 0; i < files.length; i++) {
            if (signal?.aborted) {
              cancelled = true;
              break;
            }
            const file = files[i];
            options?.onProgress?.({
              percent: (i / files.length) * 100,
              message: `Uploading ${file.name} (${i + 1}/${files.length})`,
            });
            const data = new Uint8Array(
              file.data instanceof ArrayBuffer
                ? file.data
                : await file.data.arrayBuffer(),
            );
            try {
              await this.#call(
                "ingest/put",
                {
                  uploadId,
                  file: {
                    name: file.name,
                    mimeType: file.mimeType,
                    data,
                    dimensionConfig: file.dimensionConfig,
                  },
                },
                { signal },
              );
            } catch (error) {
              if (isTaskCancelledError(error) || signal?.aborted) {
                cancelled = true;
                break;
              }
              throw error;
            }
          }
        } finally {
          cancelled ||= signal?.aborted ?? false;
        }
        return this.#call("ingest/close", { uploadId, cancelled });
      },
      ...(hasCapability(this.capabilities, "ingest.paths") && {
        browse: async (path?: string): Promise<DirectoryListing> =>
          this.#call("ingest/browse", { path }),
        inspect: async (paths: string[]): Promise<PathInspection[]> =>
          (await this.#call("ingest/inspect", { paths })).files,
        addPaths: async (
          request: AddPathsRequest,
          options?: CallOptions,
        ): Promise<IngestSummary> =>
          this.#call("ingest/addPaths", request, progress(options)),
      }),
    };
  }

  #measurements(): BackendMeasurements {
    return {
      table: async (request, options) =>
        asDomain<MeasurementTable>(
          await this.#call(
            "measurements/table",
            {
              scope: request.scope,
              columns: request.columns,
              imageQuery: asWire<P.ImageQuery | undefined>(request.imageQuery),
              annotationQuery: asWire<P.AnnotationQuery | undefined>(
                request.annotationQuery,
              ),
              page: request.page,
            },
            { signal: options?.signal },
          ),
        ),
      compute: async (request, options) => {
        if (options?.signal?.aborted) return { measured: 0, cancelled: true };
        return this.#call(
          "measurements/compute",
          {
            scope: request.scope,
            annotationQuery: asWire<P.AnnotationQuery | undefined>(
              request.annotationQuery,
            ),
            imageQuery: asWire<P.ImageQuery | undefined>(request.imageQuery),
            force: request.force ?? false,
          },
          { signal: options?.signal, onProgress: options?.onProgress },
        );
      },
    };
  }

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

  // ── Classification ─────────────────────────────────────────────────────────

  #classification(): BackendClassification {
    return {
      listArchitectures: async (): Promise<ModelDescriptor[]> =>
        asDomain<ModelDescriptor[]>(
          (await this.#call("classification/listArchitectures", undefined))
            .models,
        ),

      list: async (): Promise<Classifier[]> =>
        asDomain<Classifier[]>(
          (await this.#call("classification/list", undefined)).classifiers,
        ),

      create: async (request: ClassifierCreateRequest): Promise<Classifier> =>
        asDomain<Classifier>(
          await this.#call(
            "classification/create",
            asWire<P.ClassifierCreateRequest>(request),
          ),
        ),

      update: async (request: ClassifierUpdateRequest): Promise<Classifier> =>
        asDomain<Classifier>(
          await this.#call(
            "classification/update",
            asWire<P.ClassifierUpdateRequest>(request),
          ),
        ),

      delete: async (classifierId: string): Promise<void> => {
        await this.#call("classification/delete", { classifierId });
      },

      fit: async (
        request: ClassifierFitRequest,
        options?: CallOptions,
      ): Promise<ClassifierFitSummary> => {
        if (options?.signal?.aborted) return { status: "stopped" };
        return asDomain<ClassifierFitSummary>(
          await this.#call("classification/fit", request, progress(options)),
        );
      },

      predict: async (
        request: ClassifierPredictRequest,
        options?: CallOptions,
      ): Promise<ClassifierPredictSummary> => {
        if (options?.signal?.aborted) return { predicted: 0, cancelled: true };
        return this.#call("classification/predict", request, progress(options));
      },

      evaluate: (classifierId: string): Promise<EvaluationResult> =>
        this.#call("classification/evaluate", { classifierId }),

      acceptPredictions: (targetId: string): Promise<Changed> =>
        this.#call("classification/acceptPredictions", { targetId }),

      clearPredictions: (targetId: string): Promise<Changed> =>
        this.#call("classification/clearPredictions", { targetId }),

      export: (classifierId: string): Promise<ClassifierExport> =>
        this.#call("classification/export", { classifierId }),

      import: async (request: ClassifierImportRequest): Promise<Classifier> =>
        asDomain<Classifier>(
          await this.#call("classification/import", request),
        ),
    };
  }
}

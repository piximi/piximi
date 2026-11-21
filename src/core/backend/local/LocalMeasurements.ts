import { dataSlice } from "store/data";
import { selectChannelsByPlane } from "store/data/selectors";

import { BackendError } from "../errors";
import { parseMeasurementColumn } from "../measurements/columns";
import { paginate } from "../query";
import { imageUpdate } from "./updates";

import type {
  AnnotationObject,
  BBox,
  Channel,
  ImageObject,
  Plane,
} from "core/entities";

import type { RootState } from "store/rootReducer";

import type { EventBus } from "../events";
import type { JobRegistry } from "../jobs";
import type { AnnotationRow } from "../query";
import type {
  AnnotationQuery,
  AnnotationUpdate,
  BackendMeasurements,
  CallOptions,
  ImageQuery,
  MeasurementsComputeRequest,
  MeasurementsComputeSummary,
  MeasurementTable,
  MeasurementTableRequest,
  PageRequest,
} from "../types";
import type { MeasurementsProvider } from "./LocalSegmentation";
import type { StoreHandle } from "./store";

type Deps = {
  store: StoreHandle;
  /* The backend's own filtered listings, so a table and a grid agree. */
  images: (state: RootState, query: ImageQuery) => ImageObject[];
  annotations: (state: RootState, query: AnnotationQuery) => AnnotationRow[];
  /* Resolved on first use so constructing the backend spawns no workers. */
  measurements: () => MeasurementsProvider;
  jobs: JobRegistry;
  bus: EventBus;
};

/* Objects, or images, measured per worker round trip. */
const CHUNK = 200;
const IMAGE_CHUNK = 50;

const window = <T>(rows: T[], page?: PageRequest) =>
  page ? paginate(rows, page) : { items: rows, total: rows.length };

/*
 * Measurement tables over the store: the values the segmentation run and
 * the annotator wrote onto annotations and channels, read by column key.
 */
export class LocalMeasurements implements BackendMeasurements {
  readonly #deps: Deps;

  constructor(deps: Deps) {
    this.#deps = deps;
  }

  async table(request: MeasurementTableRequest): Promise<MeasurementTable> {
    const columns = request.columns.map((key) => ({
      key,
      column: parseMeasurementColumn(key),
    }));
    const state = this.#deps.store.getState();
    const channelsByPlane = selectChannelsByPlane(state);
    const channelOf = (planeId: string, channelMetaId: string) =>
      channelsByPlane
        .get(planeId)
        ?.find((channel) => channel.channelMetaId === channelMetaId);
    const values: MeasurementTable["values"] = {};

    if (request.scope.type === "images") {
      if (columns.some(({ column }) => column.kind === "feature")) {
        throw new BackendError(
          "NOT_SUPPORTED",
          "Images have no shape features; ask for intensity columns",
        );
      }
      const { items, total } = window(
        this.#deps.images(state, request.imageQuery ?? {}),
        request.page,
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
    // The scope's kind bounds whatever the query asks for.
    const kindIds = query.kindIds
      ? query.kindIds.filter((id) => id === kindId)
      : [kindId];
    const { items, total } = window(
      this.#deps.annotations(state, { ...query, kindIds }),
      request.page,
    );
    const { images, annotations } = state.data;
    for (const { key, column } of columns) {
      values[key] = items.map(({ annotation }) => {
        const entity = annotations.entities[annotation.id];
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
        ({ annotation }) => images.entities[annotation.imageId]?.name ?? "",
      ),
      categoryIds: items.map(({ volume }) => volume.categoryId),
      partitions: items.map(({ annotation }) => annotation.partition),
      timepoints: items.map(
        ({ annotation }) => images.entities[annotation.imageId]?.timepoint ?? 0,
      ),
      boundingBoxes: items.map(({ annotation }) => annotation.boundingBox),
      values,
      total,
    };
  }

  async compute(
    request: MeasurementsComputeRequest,
    options?: CallOptions,
  ): Promise<MeasurementsComputeSummary> {
    const { jobs } = this.#deps;
    if (options?.signal?.aborted) return { measured: 0, cancelled: true };
    const state = this.#deps.store.getState();
    const images = request.scope.type === "images";
    const targets = images
      ? this.#unmeasuredImages(state, request)
      : this.#unmeasuredObjects(state, request);
    const noun = images ? "images" : "objects";
    const job = jobs.start(
      "measurements",
      `Measuring ${targets.length} ${noun}`,
      options?.signal,
    );
    const signal = jobs.signal(job.id);
    const chunk = images ? IMAGE_CHUNK : CHUNK;
    let measured = 0;
    let cancelled = false;
    try {
      for (let start = 0; start < targets.length; start += chunk) {
        if (signal.aborted) {
          cancelled = true;
          break;
        }
        const batch = targets.slice(start, start + chunk);
        if (images) {
          await this.#measureImages(state, batch as ImageObject[], request);
        } else {
          await this.#measureObjects(state, batch as AnnotationObject[]);
        }
        measured += batch.length;
        const percent = Math.round((measured / targets.length) * 100);
        const message = `Measured ${measured}/${targets.length} ${noun}`;
        options?.onProgress?.({ percent, message });
        jobs.update(job.id, { progress: percent, message });
      }
    } catch (error) {
      jobs.finish(job.id, "failed", { error: (error as Error).message });
      throw error;
    }
    jobs.finish(job.id, cancelled ? "cancelled" : "succeeded", {
      message: `Measured ${measured} ${noun}`,
    });
    return { jobId: job.id, measured, cancelled };
  }

  #unmeasuredObjects(
    state: RootState,
    request: MeasurementsComputeRequest,
  ): AnnotationObject[] {
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
    const { annotations } = state.data;
    return this.#deps
      .annotations(state, { ...query, kindIds })
      .map(({ annotation }) => annotations.entities[annotation.id])
      .filter(
        (annotation): annotation is AnnotationObject =>
          annotation !== undefined &&
          (request.force === true ||
            !annotation.features ||
            !annotation.intensityMeasurements),
      );
  }

  #unmeasuredImages(
    state: RootState,
    request: MeasurementsComputeRequest,
  ): ImageObject[] {
    const planesByImage = this.#planesByImage(state);
    const channelsByPlane = selectChannelsByPlane(state);
    const lacking = (channel: Channel) =>
      request.force === true || channel.median === undefined;
    return this.#deps
      .images(state, request.imageQuery ?? {})
      .filter((image) =>
        (planesByImage.get(image.id) ?? []).some((plane) =>
          (channelsByPlane.get(plane.id) ?? []).some(lacking),
        ),
      );
  }

  #planesByImage(state: RootState): Map<string, Plane[]> {
    const { planes } = state.data;
    const byImage = new Map<string, Plane[]>();
    for (const id of planes.ids) {
      const plane = planes.entities[id];
      (
        byImage.get(plane.imageId) ??
        byImage.set(plane.imageId, []).get(plane.imageId)!
      ).push(plane);
    }
    return byImage;
  }

  async #measureObjects(
    state: RootState,
    chunk: AnnotationObject[],
  ): Promise<void> {
    const { store, bus } = this.#deps;
    const channelsByPlane = selectChannelsByPlane(state);
    const byPlane = new Map<string, AnnotationObject[]>();
    for (const annotation of chunk) {
      (
        byPlane.get(annotation.planeId) ??
        byPlane.set(annotation.planeId, []).get(annotation.planeId)!
      ).push(annotation);
    }
    const measurements = this.#deps.measurements();
    const [features, intensities] = await Promise.all([
      // The worker skips what already has features; measure it all.
      measurements.computeFeatures(
        chunk.map((annotation) => ({ ...annotation, features: undefined })),
      ),
      measurements.computeIntensityMeasurements(
        [...byPlane].map(([planeId, objs]) => ({
          channelRefs: (channelsByPlane.get(planeId) ?? []).map((c) => ({
            id: c.id,
          })),
          objs,
        })),
      ),
    ]);
    const updates: AnnotationUpdate[] = [];
    for (const annotation of chunk) {
      store.dispatch(
        dataSlice.actions.updateAnnotationMask({
          id: annotation.id,
          boundingBox: annotation.boundingBox,
          encodedMask: annotation.encodedMask,
          features: features[annotation.id],
          intensityMeasurements: intensities[annotation.id] ?? {},
        }),
      );
      updates.push({ id: annotation.id, partition: annotation.partition });
    }
    bus.emit({
      type: "annotations/didUpdate",
      volumes: [],
      annotations: updates,
    });
  }

  /* Every channel of the images' planes that lacks statistics (all of them
   * with `force`), measured as a whole-plane object. */
  async #measureImages(
    state: RootState,
    chunk: ImageObject[],
    request: MeasurementsComputeRequest,
  ): Promise<void> {
    const { store, bus } = this.#deps;
    const planesByImage = this.#planesByImage(state);
    const channelsByPlane = selectChannelsByPlane(state);
    const lacking = (channel: Channel) =>
      request.force === true || channel.median === undefined;
    const batches = chunk.flatMap((image) =>
      (planesByImage.get(image.id) ?? []).flatMap((plane) => {
        const wanted = (channelsByPlane.get(plane.id) ?? []).filter(lacking);
        if (wanted.length === 0) return [];
        const { width, height } = wanted[0];
        return [
          {
            channelRefs: wanted.map((c) => ({ id: c.id })),
            objs: [
              {
                id: plane.id,
                boundingBox: [0, 0, width, height] as BBox,
                // Binary RLE starting with background: the whole plane.
                encodedMask: [0, width * height],
                features: undefined,
              },
            ],
          },
        ];
      }),
    );
    const statistics = await this.#deps
      .measurements()
      .computeIntensityMeasurements(batches);
    for (const batch of batches) {
      for (const { id } of batch.channelRefs) {
        const stats = statistics[batch.objs[0].id]?.[id];
        if (stats) {
          store.dispatch(
            dataSlice.actions.updateChannelStatistics({
              id,
              statistics: stats,
            }),
          );
        }
      }
    }
    const { images } = store.getState().data;
    bus.emit({
      type: "images/didUpdate",
      updates: chunk.map((image) =>
        imageUpdate(images.entities[image.id] ?? image),
      ),
    });
  }
}

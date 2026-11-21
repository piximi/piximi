import { dataSlice } from "store/data";
import { selectChannelsByPlane } from "store/data/selectors";

import { BackendError } from "../errors";
import { parseMeasurementColumn } from "../measurements/columns";
import { paginate } from "../query";

import type { AnnotationObject, ImageObject } from "core/entities";

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

/* Objects measured per worker round trip. */
const CHUNK = 200;

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
    const { store, jobs, bus } = this.#deps;
    const state = store.getState();
    const { annotations } = state.data;
    const targets = this.#deps
      .annotations(state, request.query)
      .map(({ annotation }) => annotations.entities[annotation.id])
      .filter(
        (annotation): annotation is AnnotationObject =>
          annotation !== undefined &&
          (request.force === true ||
            !annotation.features ||
            !annotation.intensityMeasurements),
      );
    if (options?.signal?.aborted) return { measured: 0, cancelled: true };
    const job = jobs.start(
      "measurements",
      `Measuring ${targets.length} objects`,
      options?.signal,
    );
    const signal = jobs.signal(job.id);
    const channelsByPlane = selectChannelsByPlane(state);
    let measured = 0;
    let cancelled = false;
    try {
      const measurements = this.#deps.measurements();
      for (let start = 0; start < targets.length; start += CHUNK) {
        if (signal.aborted) {
          cancelled = true;
          break;
        }
        const chunk = targets.slice(start, start + CHUNK);
        const byPlane = new Map<string, AnnotationObject[]>();
        for (const annotation of chunk) {
          (
            byPlane.get(annotation.planeId) ??
            byPlane.set(annotation.planeId, []).get(annotation.planeId)!
          ).push(annotation);
        }
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
        measured += chunk.length;
        bus.emit({
          type: "annotations/didUpdate",
          volumes: [],
          annotations: updates,
        });
        const percent = Math.round((measured / targets.length) * 100);
        const message = `Measured ${measured}/${targets.length} objects`;
        options?.onProgress?.({ percent, message });
        jobs.update(job.id, { progress: percent, message });
      }
    } catch (error) {
      jobs.finish(job.id, "failed", { error: (error as Error).message });
      throw error;
    }
    jobs.finish(job.id, cancelled ? "cancelled" : "succeeded", {
      message: `Measured ${measured} objects`,
    });
    return { jobId: job.id, measured, cancelled };
  }
}

import { selectChannelsByPlane } from "store/data/selectors";

import { BackendError } from "../errors";
import { parseMeasurementColumn } from "../measurements/columns";
import { paginate } from "../query";

import type { ImageObject } from "core/entities";

import type { RootState } from "store/rootReducer";

import type { AnnotationRow } from "../query";
import type {
  AnnotationQuery,
  BackendMeasurements,
  ImageQuery,
  MeasurementTable,
  MeasurementTableRequest,
  PageRequest,
} from "../types";
import type { StoreHandle } from "./store";

type Deps = {
  store: StoreHandle;
  /* The backend's own filtered listings, so a table and a grid agree. */
  images: (state: RootState, query: ImageQuery) => ImageObject[];
  annotations: (state: RootState, query: AnnotationQuery) => AnnotationRow[];
};

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
}

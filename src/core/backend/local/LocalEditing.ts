import { representsUnknown, UNKNOWN_KIND_ID } from "core/entities";

import { dataSlice } from "store/data";
import {
  selectAllCategories,
  selectAllKinds,
  selectChannelsByPlane,
  selectExperiment,
} from "store/data/selectors";

import { BackendError } from "../errors";
import { volumeUpdate } from "./updates";

import type {
  AnnotationCategory,
  AnnotationObject,
  Experiment,
  ImageObject,
  Kind,
} from "core/entities";

import type { RootState } from "store/rootReducer";

import type { EventBus } from "../events";
import type {
  AnnotationChangeSet,
  AnnotationHeader,
  AnnotationUpdate,
  BackendClassification,
  CallOptions,
  Changed,
  CommitConflict,
  CommitResult,
  Deleted,
  EntityRef,
  ImageChange,
} from "../types";
import type { MeasurementsProvider } from "./LocalSegmentation";
import type { StoreHandle } from "./store";

type Deps = {
  store: StoreHandle;
  /* Resolved on first use so constructing the backend spawns no workers. */
  measurements: () => MeasurementsProvider;
  classification: () => BackendClassification;
  bus: EventBus;
};

/* Objects measured per worker round trip. */
const CHUNK = 200;

const header = ({
  encodedMask: _mask,
  decodedMask: _decoded,
  ...rest
}: AnnotationObject): AnnotationHeader => rest;

/* A mask's runs must cover its box exactly, or decoding reads past it. */
const checkGeometry = (
  id: string,
  [x0, y0, x1, y1]: AnnotationObject["boundingBox"],
  encodedMask: number[],
): void => {
  if (x1 <= x0 || y1 <= y0 || x0 < 0 || y0 < 0) {
    throw new BackendError(
      "NOT_SUPPORTED",
      `Annotation ${id} has an empty or negative bounding box`,
    );
  }
  const area = (x1 - x0) * (y1 - y0);
  if (
    encodedMask.some((run) => run < 0) ||
    encodedMask.reduce((sum, run) => sum + run, 0) !== area
  ) {
    throw new BackendError(
      "NOT_SUPPORTED",
      `Annotation ${id}: the mask does not cover its bounding box`,
    );
  }
};

/*
 * Editing against the Redux store: a session's commit, kinds, and the
 * item updates applied at once. The store is the local truth, so applying
 * is dispatching; the events follow for anyone listening, as they would
 * from a remote engine. The store keeps no revisions, so the only conflict
 * a commit can meet is a row that is gone.
 */
export class LocalEditing {
  readonly #deps: Deps;

  constructor(deps: Deps) {
    this.#deps = deps;
  }

  // ── Commit ─────────────────────────────────────────────────────────────────

  async commit(
    changeSet: AnnotationChangeSet,
    options?: CallOptions,
  ): Promise<CommitResult> {
    const { store, bus } = this.#deps;
    const { data } = store.getState();
    const imageIds = new Set(changeSet.imageIds);
    for (const id of changeSet.imageIds) {
      if (!data.images.entities[id]) {
        throw new BackendError("NOT_FOUND", `Unknown image ${id}`);
      }
    }
    const { volumes: volumesIn, annotations: annotationsIn } = changeSet;

    // What the session made must sit on its images and name what exists.
    for (const volume of volumesIn.created) {
      if (!imageIds.has(volume.imageId)) {
        throw new BackendError(
          "NOT_SUPPORTED",
          `Volume ${volume.id} is not on an image of the session`,
        );
      }
      const category = data.categories.entities[volume.categoryId];
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
      if (data.annotationVolumes.entities[volume.id]) {
        throw new BackendError(
          "NOT_SUPPORTED",
          `A volume ${volume.id} already exists`,
        );
      }
    }
    const newVolumeIds = new Set(volumesIn.created.map((v) => v.id));
    for (const annotation of annotationsIn.created) {
      const plane = data.planes.entities[annotation.planeId];
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
        !data.annotationVolumes.entities[annotation.volumeId]
      ) {
        throw new BackendError(
          "NOT_FOUND",
          `Annotation ${annotation.id} names an unknown volume`,
        );
      }
      if (data.annotations.entities[annotation.id]) {
        throw new BackendError(
          "NOT_SUPPORTED",
          `An annotation ${annotation.id} already exists`,
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
    for (const change of volumesIn.updated) {
      const category = data.categories.entities[change.categoryId];
      if (!category || category.type !== "annotation") {
        throw new BackendError(
          "NOT_FOUND",
          `${change.categoryId} is not an object category`,
        );
      }
    }

    const conflicts: CommitConflict[] = [];
    const present = <T extends EntityRef>(
      type: CommitConflict["type"],
      refs: T[],
      table: { entities: Record<string, unknown> },
    ): T[] =>
      refs.filter((ref) => {
        if (table.entities[ref.id]) return true;
        conflicts.push({ type, id: ref.id, reason: "missing" });
        return false;
      });
    const volumeChanges = present(
      "volume",
      volumesIn.updated,
      data.annotationVolumes,
    );
    const volumeDeletions = present(
      "volume",
      volumesIn.deleted,
      data.annotationVolumes,
    );
    const geometryChanges = present(
      "annotation",
      annotationsIn.updated,
      data.annotations,
    );
    const annotationDeletions = present(
      "annotation",
      annotationsIn.deleted,
      data.annotations,
    );
    if (conflicts.length > 0 && !changeSet.force) {
      return { created: 0, updated: 0, deleted: 0, conflicts };
    }

    // Created, then redrawn; both measured below.
    const created = annotationsIn.created.map(
      ({ decodedMask: _decoded, ...annotation }) => ({
        ...annotation,
        features: undefined,
        intensityMeasurements: undefined,
      }),
    );
    store.dispatch(
      dataSlice.actions.batchAddAnnotationVolume(volumesIn.created),
    );
    store.dispatch(dataSlice.actions.batchAddAnnotation(created));
    for (const change of geometryChanges) {
      store.dispatch(
        dataSlice.actions.updateAnnotationMask({
          id: change.id,
          boundingBox: change.boundingBox,
          encodedMask: change.encodedMask,
          features: undefined,
          intensityMeasurements: {},
        }),
      );
    }
    // Recategorized through their annotations, so the reducer applies the
    // partition and correction rules as `categorize` does.
    const moved = new Set<string>();
    if (volumeChanges.length > 0) {
      const current = store.getState().data;
      const byVolume = new Map<string, string[]>();
      for (const id of current.annotations.ids) {
        const { volumeId } = current.annotations.entities[id];
        (
          byVolume.get(volumeId) ?? byVolume.set(volumeId, []).get(volumeId)!
        ).push(id);
      }
      const updates = volumeChanges.flatMap((change) => {
        const volume = current.annotationVolumes.entities[change.id];
        if (volume.categoryId === change.categoryId) return [];
        moved.add(change.id);
        return (byVolume.get(change.id) ?? []).map((id) => ({
          id,
          categoryId: change.categoryId,
        }));
      });
      if (updates.length > 0) {
        store.dispatch(
          dataSlice.actions.batchBubbleUpdateAnnotationCategory(updates),
        );
      }
    }
    // Deleted annotations take their emptied volumes along; a volume the
    // session dropped goes only if nothing else still uses it.
    const deletedAnnotationIds = annotationDeletions.map((ref) => ref.id);
    const candidates = new Set(
      deletedAnnotationIds.map((id) => data.annotations.entities[id].volumeId),
    );
    if (deletedAnnotationIds.length > 0) {
      store.dispatch(
        dataSlice.actions.batchDeleteAnnotation(deletedAnnotationIds),
      );
    }
    let after = store.getState().data;
    const used = new Set(
      after.annotations.ids.map(
        (id) => after.annotations.entities[id].volumeId,
      ),
    );
    const dropped = volumeDeletions
      .map((ref) => ref.id)
      .filter((id) => after.annotationVolumes.entities[id] && !used.has(id));
    if (dropped.length > 0) {
      store.dispatch(dataSlice.actions.batchDeleteAnnotationVolume(dropped));
    }
    after = store.getState().data;
    const emptyVolumeIds = [...new Set([...candidates, ...dropped])].filter(
      (id) => !after.annotationVolumes.entities[id],
    );

    await this.#measure(
      [...created.map((a) => a.id), ...geometryChanges.map((c) => c.id)],
      options,
    );

    const final = store.getState().data;
    if (created.length > 0) {
      bus.emit({
        type: "annotations/didAdd",
        volumes: volumesIn.created.map(
          (v) => final.annotationVolumes.entities[v.id] ?? v,
        ),
        annotations: created.flatMap(
          (a) => final.annotations.entities[a.id] ?? [],
        ),
      });
    }
    if (geometryChanges.length > 0 || moved.size > 0) {
      bus.emit({
        type: "annotations/didUpdate",
        volumes: [...moved].map((id) =>
          volumeUpdate(final.annotationVolumes.entities[id]),
        ),
        annotations: final.annotations.ids
          .filter((id) => moved.has(final.annotations.entities[id].volumeId))
          .map((id) => ({
            id,
            partition: final.annotations.entities[id].partition,
          })),
        headers: geometryChanges.flatMap((change) => {
          const annotation = final.annotations.entities[change.id];
          return annotation ? [header(annotation)] : [];
        }),
      });
    }
    if (deletedAnnotationIds.length > 0 || emptyVolumeIds.length > 0) {
      bus.emit({
        type: "annotations/didRemove",
        annotationIds: deletedAnnotationIds,
        volumeIds: emptyVolumeIds,
      });
    }
    return {
      created: created.length,
      updated: geometryChanges.length + moved.size,
      deleted: deletedAnnotationIds.length,
      conflicts: changeSet.force ? conflicts : [],
    };
  }

  /* Features and intensities of some annotations, written onto them. */
  async #measure(ids: string[], options?: CallOptions): Promise<void> {
    const { store } = this.#deps;
    if (ids.length === 0) return;
    const measurements = this.#deps.measurements();
    for (let start = 0; start < ids.length; start += CHUNK) {
      const state = store.getState();
      const chunk = ids
        .slice(start, start + CHUNK)
        .flatMap((id) => state.data.annotations.entities[id] ?? []);
      const channelsByPlane = selectChannelsByPlane(state);
      const byPlane = new Map<string, AnnotationObject[]>();
      for (const annotation of chunk) {
        (
          byPlane.get(annotation.planeId) ??
          byPlane.set(annotation.planeId, []).get(annotation.planeId)!
        ).push(annotation);
      }
      const [features, intensities] = await Promise.all([
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
      }
      const done = Math.min(start + CHUNK, ids.length);
      options?.onProgress?.({
        percent: Math.round((done / ids.length) * 100),
        message: `Measured ${done}/${ids.length} objects`,
      });
    }
  }

  // ── Item updates ───────────────────────────────────────────────────────────

  async updateAnnotations(updates: AnnotationUpdate[]): Promise<Changed> {
    const { store, bus } = this.#deps;
    const { annotations } = store.getState().data;
    const changed = updates.filter((update) => {
      const annotation = annotations.entities[update.id];
      if (!annotation) {
        throw new BackendError("NOT_FOUND", `Unknown annotation ${update.id}`);
      }
      return annotation.partition !== update.partition;
    });
    if (changed.length === 0) return { changed: 0 };
    store.dispatch(dataSlice.actions.batchUpdateAnnotationPartition(changed));
    bus.emit({
      type: "annotations/didUpdate",
      volumes: [],
      annotations: changed,
    });
    return { changed: changed.length };
  }

  async updateImages(updates: ImageChange[]): Promise<ImageObject[]> {
    const { store, bus } = this.#deps;
    const changed = new Set<string>();
    for (const update of updates) {
      const { data } = store.getState();
      const image = data.images.entities[update.id];
      if (!image)
        throw new BackendError("NOT_FOUND", `Unknown image ${update.id}`);
      if (update.name !== undefined && update.name !== image.name) {
        if (!update.name.trim()) {
          throw new BackendError("NOT_SUPPORTED", "An image needs a name");
        }
        store.dispatch(
          dataSlice.actions.updateImageName({
            imageId: image.id,
            name: update.name,
          }),
        );
        changed.add(image.id);
      }
      if (
        update.partition !== undefined &&
        update.partition !== image.partition
      ) {
        store.dispatch(
          dataSlice.actions.updateImagePartition({
            id: image.id,
            partition: update.partition,
          }),
        );
        changed.add(image.id);
      }
      if (
        update.activePlaneId !== undefined &&
        update.activePlaneId !== image.activePlaneId
      ) {
        const plane = data.planes.entities[update.activePlaneId];
        if (!plane || plane.imageId !== image.id) {
          throw new BackendError(
            "NOT_FOUND",
            `${update.activePlaneId} is not a plane of ${image.name}`,
          );
        }
        store.dispatch(
          dataSlice.actions.updateImageActivePlane({
            imageId: image.id,
            planeId: update.activePlaneId,
          }),
        );
        changed.add(image.id);
      }
    }
    const { images } = store.getState().data;
    if (changed.size > 0) {
      bus.emit({
        type: "images/didChange",
        images: [...changed].map((id) => images.entities[id]),
      });
    }
    return updates.map((update) => images.entities[update.id]);
  }

  // ── Kinds ──────────────────────────────────────────────────────────────────

  async createKinds(
    kinds: Array<{ kind: Kind; category: AnnotationCategory }>,
  ): Promise<Kind[]> {
    const { store, bus } = this.#deps;
    const state = store.getState();
    const names = new Set(selectAllKinds(state).map((kind) => kind.name));
    for (const { kind, category } of kinds) {
      if (state.data.kinds.entities[kind.id]) {
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
      store.dispatch(dataSlice.actions.batchAddKind(kinds));
      bus.emit({ type: "kinds/didAdd", kinds });
    }
    return kinds.map(({ kind }) => kind);
  }

  async updateKind(id: string, name: string): Promise<Kind> {
    const { store, bus } = this.#deps;
    const state = store.getState();
    const kind = state.data.kinds.entities[id];
    if (!kind) throw new BackendError("NOT_FOUND", `Unknown kind ${id}`);
    if (kind.id === UNKNOWN_KIND_ID) {
      throw new BackendError(
        "NOT_SUPPORTED",
        "The reserved unknown kind keeps its name",
      );
    }
    if (!name.trim())
      throw new BackendError("NOT_SUPPORTED", "A kind needs a name");
    if (
      selectAllKinds(state).some(
        (other) => other.name === name && other.id !== id,
      )
    ) {
      throw new BackendError(
        "NOT_SUPPORTED",
        `A kind named ${JSON.stringify(name)} already exists`,
      );
    }
    if (name === kind.name) return kind;
    store.dispatch(dataSlice.actions.updateKindName({ kindId: id, name }));
    const after = store.getState();
    bus.emit({ type: "kinds/didChange", kinds: selectAllKinds(after) });
    return after.data.kinds.entities[id];
  }

  async deleteKinds(ids: string[]): Promise<Deleted> {
    const { store, bus } = this.#deps;
    const { data } = store.getState();
    const gone = ids.filter(
      (id) =>
        data.kinds.entities[id] &&
        !representsUnknown(id) &&
        id !== UNKNOWN_KIND_ID,
    );
    if (gone.length === 0) return { deleted: 0 };
    const kindIds = new Set(gone);
    const volumeIds = data.annotationVolumes.ids.filter((id) =>
      kindIds.has(data.annotationVolumes.entities[id].kindId),
    );
    // The reducer moves the kind's volumes to the unknown kind and drops
    // its categories; the classifier slice drops the kind's classifiers.
    for (const id of gone) store.dispatch(dataSlice.actions.deleteKind(id));
    const after = store.getState();
    if (volumeIds.length > 0) {
      bus.emit({
        type: "annotations/didUpdate",
        volumes: volumeIds.map((id) =>
          volumeUpdate(after.data.annotationVolumes.entities[id]),
        ),
        annotations: [],
      });
    }
    bus.emit({
      type: "categories/didChange",
      categories: selectAllCategories(after),
    });
    bus.emit({
      type: "classifiers/didChange",
      classifiers: await this.#deps.classification().list(),
    });
    bus.emit({ type: "kinds/didRemove", kindIds: gone });
    return { deleted: gone.length };
  }

  // ── Project ────────────────────────────────────────────────────────────────

  async renameProject(name: string): Promise<Experiment> {
    const { store, bus } = this.#deps;
    if (!name.trim())
      throw new BackendError("NOT_SUPPORTED", "A project needs a name");
    if (selectExperiment(store.getState()).name !== name) {
      store.dispatch(dataSlice.actions.updateExperimentName(name));
      bus.emit({
        type: "project/didChange",
        experiment: selectExperiment(store.getState()),
      });
    }
    return selectExperiment(store.getState());
  }
}

export type { RootState };

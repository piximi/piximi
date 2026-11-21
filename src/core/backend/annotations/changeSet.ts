import type { EntityState } from "@reduxjs/toolkit";

import type { AnnotationObject, AnnotationVolume } from "core/entities";

import type { AnnotationChangeSet } from "../types";

/* The annotation tables as a viewing session found them. */
export type AnnotationSnapshot = {
  annotations: EntityState<AnnotationObject, string>;
  annotationVolumes: EntityState<AnnotationVolume, string>;
};

const sameBox = (a: readonly number[], b: readonly number[]): boolean =>
  a.length === b.length && a.every((value, i) => value === b[i]);

const sameMask = (a: number[], b: number[]): boolean =>
  a === b || (a.length === b.length && a.every((run, i) => run === b[i]));

/*
 * What a session changed on its images, as the commit the backend applies:
 * the tables now against the snapshot taken when the session opened. Only
 * geometry counts for an annotation and only category and kind for a volume;
 * partitions, predictions and measurements are the backend's to write.
 * Every entry that touches an existing row carries the revision it was read
 * at, so the backend can tell a change made elsewhere meanwhile.
 */
export const buildChangeSet = (
  base: AnnotationSnapshot,
  current: AnnotationSnapshot,
  imageIds: string[],
): AnnotationChangeSet => {
  const scope = new Set(imageIds);
  const changeSet: AnnotationChangeSet = {
    imageIds,
    volumes: { created: [], updated: [], deleted: [] },
    annotations: { created: [], updated: [], deleted: [] },
  };

  for (const id of current.annotationVolumes.ids) {
    const volume = current.annotationVolumes.entities[id];
    if (!scope.has(volume.imageId)) continue;
    const before = base.annotationVolumes.entities[id];
    if (!before) {
      changeSet.volumes.created.push(volume);
    } else if (
      volume.categoryId !== before.categoryId ||
      volume.kindId !== before.kindId
    ) {
      changeSet.volumes.updated.push({
        id,
        baseRev: before.rev,
        categoryId: volume.categoryId,
      });
    }
  }
  for (const id of base.annotationVolumes.ids) {
    const before = base.annotationVolumes.entities[id];
    if (!scope.has(before.imageId)) continue;
    if (!current.annotationVolumes.entities[id]) {
      changeSet.volumes.deleted.push({ id, baseRev: before.rev });
    }
  }

  for (const id of current.annotations.ids) {
    const annotation = current.annotations.entities[id];
    if (!scope.has(annotation.imageId)) continue;
    const before = base.annotations.entities[id];
    if (!before) {
      changeSet.annotations.created.push(annotation);
    } else if (
      annotation !== before &&
      (!sameBox(annotation.boundingBox, before.boundingBox) ||
        !sameMask(annotation.encodedMask, before.encodedMask))
    ) {
      changeSet.annotations.updated.push({
        id,
        baseRev: before.rev,
        boundingBox: annotation.boundingBox,
        encodedMask: annotation.encodedMask,
      });
    }
  }
  for (const id of base.annotations.ids) {
    const before = base.annotations.entities[id];
    if (!scope.has(before.imageId)) continue;
    if (!current.annotations.entities[id]) {
      changeSet.annotations.deleted.push({ id, baseRev: before.rev });
    }
  }
  return changeSet;
};

export const isEmptyChangeSet = (changeSet: AnnotationChangeSet): boolean =>
  [
    ...Object.values(changeSet.volumes),
    ...Object.values(changeSet.annotations),
  ].every((entries) => entries.length === 0);

/*
 * The changeset again without the entries the backend refused: what
 * "keep theirs" sends, leaving the rows changed elsewhere as they are.
 */
export const withoutConflicts = (
  changeSet: AnnotationChangeSet,
  conflicts: Array<{ type: "annotation" | "volume"; id: string }>,
): AnnotationChangeSet => {
  const refused = {
    annotation: new Set(
      conflicts.filter((c) => c.type === "annotation").map((c) => c.id),
    ),
    volume: new Set(
      conflicts.filter((c) => c.type === "volume").map((c) => c.id),
    ),
  };
  return {
    ...changeSet,
    volumes: {
      created: changeSet.volumes.created,
      updated: changeSet.volumes.updated.filter(
        (change) => !refused.volume.has(change.id),
      ),
      deleted: changeSet.volumes.deleted.filter(
        (ref) => !refused.volume.has(ref.id),
      ),
    },
    annotations: {
      created: changeSet.annotations.created,
      updated: changeSet.annotations.updated.filter(
        (change) => !refused.annotation.has(change.id),
      ),
      deleted: changeSet.annotations.deleted.filter(
        (ref) => !refused.annotation.has(ref.id),
      ),
    },
  };
};

import { describe, expect, it } from "vitest";

import { Partition } from "core/entities";

import {
  buildChangeSet,
  isEmptyChangeSet,
  withoutConflicts,
} from "./changeSet";

import type { AnnotationObject, AnnotationVolume } from "core/entities";

import type { AnnotationSnapshot } from "./changeSet";

const volume = (
  id: string,
  imageId: string,
  categoryId = "cat",
  rev?: number,
): AnnotationVolume => ({ id, imageId, kindId: "kind", categoryId, rev });

const annotation = (
  id: string,
  imageId: string,
  volumeId: string,
  box: [number, number, number, number] = [0, 0, 2, 2],
  rev?: number,
): AnnotationObject => ({
  id,
  imageId,
  planeId: `${imageId}-p`,
  volumeId,
  partition: Partition.Unassigned,
  shape: {
    planes: 1,
    height: box[3] - box[1],
    width: box[2] - box[0],
    channels: 1,
  },
  boundingBox: box,
  encodedMask: [0, (box[2] - box[0]) * (box[3] - box[1])],
  rev,
});

const tables = (
  volumes: AnnotationVolume[],
  annotations: AnnotationObject[],
): AnnotationSnapshot => ({
  annotationVolumes: {
    ids: volumes.map((v) => v.id),
    entities: Object.fromEntries(volumes.map((v) => [v.id, v])),
  },
  annotations: {
    ids: annotations.map((a) => a.id),
    entities: Object.fromEntries(annotations.map((a) => [a.id, a])),
  },
});

describe("buildChangeSet", () => {
  const base = tables(
    [
      volume("v1", "a", "cat", 3),
      volume("v2", "a", "cat", 3),
      volume("v3", "b", "cat", 1),
    ],
    [
      annotation("x", "a", "v1", [0, 0, 2, 2], 3),
      annotation("y", "a", "v2", [1, 1, 3, 3], 3),
      annotation("z", "b", "v3", [0, 0, 1, 1], 1),
    ],
  );

  it("finds nothing when nothing changed, whatever the object identity", () => {
    const copy = tables(
      base.annotationVolumes.ids.map((id) => ({
        ...base.annotationVolumes.entities[id],
      })),
      base.annotations.ids.map((id) => ({
        ...base.annotations.entities[id],
        boundingBox: [...base.annotations.entities[id].boundingBox] as [
          number,
          number,
          number,
          number,
        ],
        encodedMask: [...base.annotations.entities[id].encodedMask],
        partition: Partition.Training,
      })),
    );
    expect(isEmptyChangeSet(buildChangeSet(base, copy, ["a", "b"]))).toBe(true);
  });

  it("lists made, redrawn, recategorized and deleted rows with their base revisions", () => {
    const made = volume("v4", "a");
    const current = tables(
      [{ ...volume("v1", "a", "round", 3) }, made, volume("v3", "b", "cat", 1)],
      [
        annotation("x", "a", "v1", [0, 0, 3, 2], 3),
        annotation("n", "a", "v4"),
        annotation("z", "b", "v3", [0, 0, 1, 1], 1),
      ],
    );
    const changeSet = buildChangeSet(base, current, ["a"]);
    expect(changeSet.volumes).toEqual({
      created: [made],
      updated: [{ id: "v1", baseRev: 3, categoryId: "round" }],
      deleted: [{ id: "v2", baseRev: 3 }],
    });
    expect(changeSet.annotations.created.map((a) => a.id)).toEqual(["n"]);
    expect(changeSet.annotations.updated).toEqual([
      { id: "x", baseRev: 3, boundingBox: [0, 0, 3, 2], encodedMask: [0, 6] },
    ]);
    expect(changeSet.annotations.deleted).toEqual([{ id: "y", baseRev: 3 }]);
    // Image b is outside the session.
    expect(changeSet.imageIds).toEqual(["a"]);
  });

  it("drops the refused entries for a keep-theirs resend", () => {
    const changeSet = buildChangeSet(
      base,
      tables(
        [volume("v1", "a", "round", 3)],
        [annotation("x", "a", "v1", [0, 0, 3, 2], 3)],
      ),
      ["a"],
    );
    const kept = withoutConflicts(changeSet, [
      { type: "annotation", id: "x" },
      { type: "volume", id: "v2" },
    ]);
    expect(kept.annotations.updated).toEqual([]);
    expect(kept.annotations.deleted).toEqual([{ id: "y", baseRev: 3 }]);
    expect(kept.volumes.deleted).toEqual([]);
    expect(kept.volumes.updated).toEqual([
      { id: "v1", baseRev: 3, categoryId: "round" },
    ]);
  });
});

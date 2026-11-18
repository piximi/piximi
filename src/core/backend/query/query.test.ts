import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  countBy,
  filterAnnotations,
  filterImages,
  paginate,
  randomKey,
  sortAnnotations,
  sortImages,
} from ".";

import type {
  AnnotationVolume,
  Category,
  ImageObject,
  Plane,
} from "core/entities";

import type {
  AnnotationHeader,
  AnnotationQuery,
  AnnotationSort,
  ImageQuery,
  ImageSort,
  PageRequest,
} from "../types";
import type { AnnotationContext, AnnotationRow, ImageContext } from ".";

/*
 * The engine runs the same cases over SQLite (tests/test_query.py); one file
 * pins what both must return, random orders included.
 */
type Vectors = {
  dataset: {
    images: ImageObject[];
    planes: Plane[];
    categories: Category[];
    volumes: AnnotationVolume[];
    annotations: (AnnotationHeader & { encodedMask: number[] })[];
  };
  cases: Array<{
    name: string;
    entity: "images" | "annotations" | "imageCounts" | "annotationCounts";
    query?: ImageQuery & AnnotationQuery;
    sort?: ImageSort & AnnotationSort;
    page?: PageRequest;
    groupBy?: "category" | "partition" | "kind";
    expect: {
      ids?: string[];
      total: number;
      groups?: Record<string, number> | null;
    };
  }>;
};

const vectors = JSON.parse(
  readFileSync(
    path.resolve(
      __dirname,
      "../../../../python/packages/piximi-engine/tests/vectors/query.json",
    ),
    "utf8",
  ),
) as Vectors;

const { dataset } = vectors;
const byId = <T extends { id: string }>(rows: T[]) =>
  new Map(rows.map((row) => [row.id, row]));
const categories = byId(dataset.categories);
const images = byId(dataset.images);
const planes = byId(dataset.planes);
const volumes = byId(dataset.volumes);
const annotated = new Set(dataset.annotations.map((a) => a.imageId));

const imageContext: ImageContext = {
  categoryName: (id) => categories.get(id)?.name ?? "",
  isAnnotated: (id) => annotated.has(id),
};
const annotationContext: AnnotationContext = {
  categoryName: (id) => categories.get(id)?.name ?? "",
  imageName: (id) => images.get(id)?.name ?? "",
  planeZIndex: (id) => planes.get(id)?.zIndex ?? -Infinity,
};
const annotationRows: AnnotationRow[] = dataset.annotations.map(
  ({ encodedMask: _mask, ...annotation }) => ({
    annotation,
    volume: volumes.get(annotation.volumeId)!,
  }),
);

const run = (c: Vectors["cases"][number]) => {
  const query = c.query ?? {};
  switch (c.entity) {
    case "images": {
      const rows = sortImages(
        filterImages(dataset.images, query, imageContext),
        c.sort,
        imageContext,
      );
      if (c.page) {
        const page = paginate(rows, c.page);
        return { ids: page.items.map((im) => im.id), total: page.total };
      }
      return { ids: rows.map((im) => im.id), total: rows.length };
    }
    case "annotations": {
      const rows = sortAnnotations(
        filterAnnotations(annotationRows, query),
        c.sort,
        annotationContext,
      );
      const ids = (page: AnnotationRow[]) => page.map((r) => r.annotation.id);
      if (c.page) {
        const page = paginate(rows, c.page);
        return { ids: ids(page.items), total: page.total };
      }
      return { ids: ids(rows), total: rows.length };
    }
    case "imageCounts": {
      const rows = filterImages(dataset.images, query, imageContext);
      const key = {
        category: (im: ImageObject) => im.categoryId,
        partition: (im: ImageObject) => im.partition as string,
        kind: () => undefined,
      }[c.groupBy ?? "kind"];
      return {
        total: rows.length,
        groups: c.groupBy ? countBy(rows, key) : null,
      };
    }
    case "annotationCounts": {
      const rows = filterAnnotations(annotationRows, query);
      const key = {
        category: (r: AnnotationRow) => r.volume.categoryId,
        partition: (r: AnnotationRow) => r.annotation.partition as string,
        kind: (r: AnnotationRow) => r.volume.kindId,
      }[c.groupBy ?? "kind"];
      return {
        total: rows.length,
        groups: c.groupBy ? countBy(rows, key) : null,
      };
    }
  }
};

describe("query (shared vectors)", () => {
  for (const c of vectors.cases) {
    it(c.name, () => {
      expect(run(c)).toEqual(c.expect);
    });
  }

  it("keys random order with the engine's FNV-1a", () => {
    expect(randomKey(0, "a")).toBe(0x98b2bcaa);
    expect(randomKey(7, "x")).not.toBe(randomKey(8, "x"));
  });
});

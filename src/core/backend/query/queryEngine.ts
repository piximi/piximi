import { BackendError } from "../errors";
import { randomKey } from "./randomKey";

import type { AnnotationVolume, ImageObject } from "core/entities";

import type {
  AnnotationHeader,
  AnnotationQuery,
  AnnotationSort,
  ImageQuery,
  ImageSort,
  Page,
  PageRequest,
  SortDirection,
} from "../types";

/*
 * The contract's queries over in-memory rows, for the backends that hold
 * their metadata in the browser. The engine answers the same queries in SQL;
 * `query.test.ts` runs both against the shared vectors, so the semantics
 * here (case folding, tie-breaking, direction, open confidence ranges) are
 * the semantics of the contract.
 */

export type AnnotationRow = {
  annotation: AnnotationHeader;
  volume: AnnotationVolume;
};

/* What the sort keys need beyond the rows themselves. */
export type ImageContext = {
  categoryName: (categoryId: string) => string;
  isAnnotated: (imageId: string) => boolean;
  /* The latest classifier prediction's margin; absent on a backend without a
   * classifier, which then rejects the `softmax` sort. */
  softmaxMargin?: (imageId: string) => number | undefined;
};

export type AnnotationContext = {
  categoryName: (categoryId: string) => string;
  imageName: (imageId: string) => string;
  planeZIndex: (planeId: string) => number;
  softmaxMargin?: (annotationId: string, kindId: string) => number | undefined;
};

type Compare<T> = (a: T, b: T) => number;

/* ASCII case folding, as SQLite's NOCASE collation does. */
const fold = (text: string) => text.replace(/[A-Z]/g, (c) => c.toLowerCase());

const byText =
  <T>(field: (row: T) => string): Compare<T> =>
  (a, b) => {
    const x = fold(field(a));
    const y = fold(field(b));
    return x < y ? -1 : x > y ? 1 : 0;
  };

const byString =
  <T>(field: (row: T) => string): Compare<T> =>
  (a, b) => {
    const x = field(a);
    const y = field(b);
    return x < y ? -1 : x > y ? 1 : 0;
  };

const byNumber =
  <T>(field: (row: T) => number): Compare<T> =>
  (a, b) =>
    field(a) - field(b);

const bySoftmax = <T>(
  margin: ((row: T) => number | undefined) | undefined,
): Compare<T> => {
  if (!margin) {
    throw new BackendError(
      "NOT_SUPPORTED",
      "This backend holds no classifier predictions to sort by",
    );
  }
  return (a, b) => (margin(a) ?? 1) - (margin(b) ?? 1);
};

/* Stable, with ties in input order; `desc` is the exact reverse. */
const ordered = <T>(
  rows: T[],
  compare: Compare<T> | undefined,
  direction: SortDirection = "asc",
): T[] => {
  let sorted: T[];
  if (compare) {
    const keyed = rows.map((row, index) => ({ row, index }));
    keyed.sort((a, b) => compare(a.row, b.row) || a.index - b.index);
    sorted = keyed.map((k) => k.row);
  } else {
    sorted = [...rows];
  }
  return direction === "desc" ? sorted.reverse() : sorted;
};

const inSet = <T>(values: T[] | undefined): Set<T> | undefined =>
  values ? new Set(values) : undefined;

const within = (
  range: { min: number; max: number },
  value: number | undefined,
): boolean => value !== undefined && value > range.min && value < range.max;

// ── Images ───────────────────────────────────────────────────────────────────

export const filterImages = (
  rows: ImageObject[],
  query: ImageQuery,
  ctx: ImageContext,
): ImageObject[] => {
  const ids = inSet(query.ids);
  const series = inSet(query.seriesIds);
  const categories = inSet(query.categoryIds);
  const partitions = inSet(query.partitions);
  return rows.filter(
    (image) =>
      (!ids || ids.has(image.id)) &&
      (!series || series.has(image.seriesId)) &&
      (!categories || categories.has(image.categoryId)) &&
      (!partitions || partitions.has(image.partition)) &&
      (!query.confidence ||
        within(query.confidence, image.predictionConfidence)) &&
      (query.annotated === undefined ||
        ctx.isAnnotated(image.id) === query.annotated),
  );
};

export const sortImages = (
  rows: ImageObject[],
  sort: ImageSort | undefined,
  ctx: ImageContext,
): ImageObject[] => {
  const seed = sort?.seed ?? 0;
  let compare: Compare<ImageObject> | undefined;
  switch (sort?.key ?? "none") {
    case "none":
      break;
    case "name":
      compare = byText((image) => image.name);
      break;
    case "category":
      compare = byText((image) => ctx.categoryName(image.categoryId));
      break;
    case "random":
      compare = byNumber((image) => randomKey(seed, image.id));
      break;
    case "softmax":
      compare = bySoftmax(
        ctx.softmaxMargin && ((image) => ctx.softmaxMargin!(image.id)),
      );
      break;
  }
  return ordered(rows, compare, sort?.direction);
};

// ── Annotations ──────────────────────────────────────────────────────────────

export const filterAnnotations = (
  rows: AnnotationRow[],
  query: AnnotationQuery,
): AnnotationRow[] => {
  const ids = inSet(query.ids);
  const images = inSet(query.imageIds);
  const planes = inSet(query.planeIds);
  const volumes = inSet(query.volumeIds);
  const kinds = inSet(query.kindIds);
  const categories = inSet(query.categoryIds);
  const partitions = inSet(query.partitions);
  return rows.filter(
    ({ annotation, volume }) =>
      (!ids || ids.has(annotation.id)) &&
      (!images || images.has(annotation.imageId)) &&
      (!planes || planes.has(annotation.planeId)) &&
      (!volumes || volumes.has(annotation.volumeId)) &&
      (!kinds || kinds.has(volume.kindId)) &&
      (!categories || categories.has(volume.categoryId)) &&
      (!partitions || partitions.has(annotation.partition)) &&
      (!query.confidence ||
        within(query.confidence, volume.predictionConfidence)),
  );
};

export const sortAnnotations = (
  rows: AnnotationRow[],
  sort: AnnotationSort | undefined,
  ctx: AnnotationContext,
): AnnotationRow[] => {
  const seed = sort?.seed ?? 0;
  let compare: Compare<AnnotationRow> | undefined;
  switch (sort?.key ?? "none") {
    case "none":
      break;
    case "plane":
      compare = byNumber((row) => ctx.planeZIndex(row.annotation.planeId));
      break;
    case "volume":
      compare = byString((row) => row.annotation.volumeId);
      break;
    case "category":
      compare = byText((row) => ctx.categoryName(row.volume.categoryId));
      break;
    case "image":
      compare = byText((row) => ctx.imageName(row.annotation.imageId));
      break;
    case "random":
      compare = byNumber((row) => randomKey(seed, row.annotation.id));
      break;
    case "softmax":
      compare = bySoftmax(
        ctx.softmaxMargin &&
          ((row) => ctx.softmaxMargin!(row.annotation.id, row.volume.kindId)),
      );
      break;
  }
  return ordered(rows, compare, sort?.direction);
};

// ── Pages and counts ─────────────────────────────────────────────────────────

export const paginate = <T>(rows: T[], page: PageRequest): Page<T> => {
  const offset = page.offset ?? 0;
  return { items: rows.slice(offset, offset + page.limit), total: rows.length };
};

/* Rows per key; rows without one are left out, as the engine leaves out NULL. */
export const countBy = <T>(
  rows: T[],
  key: (row: T) => string | undefined,
): Record<string, number> => {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    const k = key(row);
    if (k !== undefined) counts[k] = (counts[k] ?? 0) + 1;
  }
  return counts;
};

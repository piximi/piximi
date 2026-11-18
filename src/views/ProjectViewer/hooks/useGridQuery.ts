import { useMemo, useState } from "react";

import { useSelector } from "react-redux";

import { Partition } from "core/entities";

import {
  selectCategoriesByKindId,
  selectImageCategories,
} from "store/data/selectors";
import { useParameterizedSelector } from "store/hooks";

import {
  selectActiveKindState,
  selectActiveView,
  selectFilterSelectedImages,
  selectImageAnnotationStatusFilter,
  selectImageFilters,
  selectImageSortType,
  selectSelectedImageIds,
} from "@ProjectViewer/state/selectors";
import { AnnotationSortType, ImageSortType } from "@ProjectViewer/state/types";

import type {
  AnnotationQuery,
  AnnotationSort,
  AnnotationSortKey,
  ImageQuery,
  ImageSort,
  ImageSortKey,
} from "core/backend";

import type { KindState, ViewState } from "@ProjectViewer/state/types";

/*
 * The grids' filter and sort state as backend queries. Filters are kept as
 * exclusion lists (what the user hid); a query names what to keep, so a
 * list is complemented against everything known, and left out when nothing
 * is hidden.
 */

export type GridQuery<Q, S> = { query: Q; sort: S; key: string };

const ALL_PARTITIONS = Object.values(Partition);

const IMAGE_SORT_KEYS: Record<ImageSortType, ImageSortKey> = {
  [ImageSortType.None]: "none",
  [ImageSortType.FileName]: "name",
  [ImageSortType.Name]: "name",
  [ImageSortType.Category]: "category",
  [ImageSortType.Random]: "random",
  [ImageSortType.Softmax]: "softmax",
};

const ANNOTATION_SORT_KEYS: Record<AnnotationSortType, AnnotationSortKey> = {
  [AnnotationSortType.None]: "none",
  [AnnotationSortType.Plane]: "plane",
  [AnnotationSortType.Volume]: "volume",
  [AnnotationSortType.Category]: "category",
  [AnnotationSortType.Image]: "image",
  [AnnotationSortType.Random]: "random",
  [AnnotationSortType.Softmax]: "softmax",
};

const keep = <T>(all: T[], hidden: T[]): T[] | undefined =>
  hidden.length === 0 ? undefined : all.filter((x) => !hidden.includes(x));

const confidenceRange = (range: { min: number; max: number }) =>
  range.max - range.min === 100
    ? undefined
    : { min: range.min, max: range.max };

// A positive 32-bit seed, as the random order is keyed on one.
const generateSeed = () => Math.floor(Math.random() * (2 ** 31 - 1));

/* A fresh shuffle each time the sort is chosen, stable while it stays. */
export const useSortSeed = (sortType: string): number => {
  const [state, setState] = useState(() => ({
    sortType,
    seed: generateSeed(),
  }));
  if (state.sortType !== sortType) {
    setState({ sortType, seed: generateSeed() });
  }
  return state.seed;
};

export const useImageGridQuery = (): GridQuery<ImageQuery, ImageSort> => {
  const filters = useSelector(selectImageFilters);
  const annotationStatus = useSelector(selectImageAnnotationStatusFilter);
  const sortType = useSelector(selectImageSortType);
  const categories = useSelector(selectImageCategories);
  const seed = useSortSeed(sortType);
  return useMemo(() => {
    const query: ImageQuery = {
      categoryIds: keep(
        categories.map((c) => c.id),
        filters.categoryId,
      ),
      partitions: keep(ALL_PARTITIONS, filters.partition),
      confidence: confidenceRange(filters.predictionConfidence),
      annotated:
        annotationStatus === "all"
          ? undefined
          : annotationStatus === "annotated",
    };
    const sort: ImageSort = { key: IMAGE_SORT_KEYS[sortType], seed };
    return { query, sort, key: JSON.stringify(["images", query, sort]) };
  }, [filters, annotationStatus, sortType, categories, seed]);
};

export const useAnnotationGridQuery = (
  kindState: KindState,
): GridQuery<AnnotationQuery, AnnotationSort> => {
  const categories = useParameterizedSelector(
    selectCategoriesByKindId,
    kindState.id,
  );
  const onlySelectedImages = useSelector(selectFilterSelectedImages);
  const selectedImageIds = useSelector(selectSelectedImageIds);
  const seed = useSortSeed(kindState.sortType);
  const { id, filters, sortType } = kindState;
  return useMemo(() => {
    const query: AnnotationQuery = {
      kindIds: [id],
      categoryIds: keep(
        categories.map((c) => c.id),
        filters.categoryId,
      ),
      partitions: keep(ALL_PARTITIONS, filters.partition),
      confidence: confidenceRange(filters.predictionConfidence),
      // An empty selection with the filter on is read literally: nothing.
      imageIds: onlySelectedImages ? selectedImageIds : undefined,
    };
    const sort: AnnotationSort = { key: ANNOTATION_SORT_KEYS[sortType], seed };
    return { query, sort, key: JSON.stringify(["annotations", query, sort]) };
  }, [
    id,
    filters,
    sortType,
    categories,
    onlySelectedImages,
    selectedImageIds,
    seed,
  ]);
};

export type ActiveGridQuery =
  | ({ view: "images" } & GridQuery<ImageQuery, ImageSort>)
  | ({ view: "annotations"; kindId: string } & GridQuery<
      AnnotationQuery,
      AnnotationSort
    >);

/* The query of whichever grid is showing. */
export const useActiveGridQuery = (): ActiveGridQuery => {
  const view: ViewState = useSelector(selectActiveView);
  const kindState = useSelector(selectActiveKindState);
  const images = useImageGridQuery();
  const annotations = useAnnotationGridQuery(kindState);
  return useMemo(
    () =>
      view === "images"
        ? { view, ...images }
        : { view, kindId: kindState.id, ...annotations },
    [view, images, annotations, kindState.id],
  );
};

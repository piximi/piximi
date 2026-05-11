import { useMemo } from "react";

import { useSelector } from "react-redux";

import { selectActiveClassifierModelTarget } from "@ProjectViewer/state/selectors";
import type {
  ExtendedAnnotationObject,
  ExtendedImageObject,
} from "store/dataV2/types";
import { useParameterizedSelector } from "store/hooks";
import { selectActiveSoftmaxById } from "store/classifier/selectors";
import {
  ANNOTATION_SORT_CASES,
  generateSeed,
  IMAGE_SORT_CASES,
  marginOf,
  noopSort,
} from "@ProjectViewer/state/sortConfig";

import type {
  AnnotationSortType,
  Comparator,
  ImageSortType,
  MarginedSoftmax,
  SortMap,
} from "@ProjectViewer/state/types";

const useSort = <T, S extends string>(
  sortType: S,
  cases: SortMap<T, S>,
): Comparator<T> => {
  const modelTarget = useSelector(selectActiveClassifierModelTarget);
  const softmaxByItemId = useParameterizedSelector(
    selectActiveSoftmaxById,
    modelTarget,
  );

  const margined = useMemo(
    () =>
      !softmaxByItemId
        ? undefined
        : Object.entries(softmaxByItemId).reduce(
            (msm: MarginedSoftmax, [id, softmax]) => {
              msm[id] = marginOf(softmax);
              return msm;
            },
            {},
          ),
    [softmaxByItemId],
  );
  // Re-seed only when sortType changes
  const seed = useMemo(() => generateSeed(), [sortType]);

  return useMemo(() => {
    const factory = cases[sortType];
    return factory ? factory({ margined, seed }) : noopSort;
    // cases intentionally not in deps — only sortType/margined/seed drive output.
  }, [sortType, margined, seed]);
};

export const useImageSort = (sortType: ImageSortType) => {
  return useSort<ExtendedImageObject, ImageSortType>(
    sortType,
    IMAGE_SORT_CASES,
  );
};

export const useAnnotationSort = (sortType: AnnotationSortType) => {
  return useSort<ExtendedAnnotationObject, AnnotationSortType>(
    sortType,
    ANNOTATION_SORT_CASES,
  );
};

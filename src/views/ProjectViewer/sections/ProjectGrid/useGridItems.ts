import { useMemo } from "react";

import { useSelector } from "react-redux";

import {
  selectCategoryEntities,
  selectChannelMetaEntities,
  selectChannelsByPlane,
  selectImageEntities,
  selectPlaneEntities,
} from "store/data/selectors";

import { extendAnnotation, extendImage } from "./gridItems";

import type { AnnotationRecord, ImageRecord } from "core/backend";
import type {
  ExtendedAnnotationObject,
  ExtendedImageObject,
} from "core/entities";

import type { AnnotationLookups, ImageLookups } from "./gridItems";

export const useImageLookups = (): ImageLookups => {
  const categories = useSelector(selectCategoryEntities);
  const channelMetas = useSelector(selectChannelMetaEntities);
  return useMemo(
    () => ({ categories, channelMetas }),
    [categories, channelMetas],
  );
};

export const useAnnotationLookups = (): AnnotationLookups => {
  const categories = useSelector(selectCategoryEntities);
  const channelMetas = useSelector(selectChannelMetaEntities);
  const images = useSelector(selectImageEntities);
  const planes = useSelector(selectPlaneEntities);
  const channelsByPlane = useSelector(selectChannelsByPlane);
  return useMemo(
    () => ({ categories, channelMetas, images, planes, channelsByPlane }),
    [categories, channelMetas, images, planes, channelsByPlane],
  );
};

/* Both lookup sets, for a grid that builds its preload list itself. */
export const useGridItems = () => {
  const lookups = useImageLookups();
  const annotationLookups = useAnnotationLookups();
  return { lookups, annotationLookups };
};

export const useImageGridItem = (
  record: ImageRecord | undefined,
): ExtendedImageObject | null => {
  const lookups = useImageLookups();
  return useMemo(
    () => (record ? extendImage(record, lookups) : null),
    [record, lookups],
  );
};

export const useAnnotationGridItem = (
  record: AnnotationRecord | undefined,
): ExtendedAnnotationObject | null => {
  const lookups = useAnnotationLookups();
  return useMemo(
    () => (record ? extendAnnotation(record, lookups) : null),
    [record, lookups],
  );
};

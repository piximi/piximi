import { createSelector } from "@reduxjs/toolkit";
import { ImageSortKey, sortTypeByKey } from "types/ImageSortType";
import { Project } from "types/Project";

export const imageSortKeySelector = ({
  project,
}: {
  project: Project;
}): ImageSortKey => {
  return project.imageSortKey;
};

export const selectImageSortType = createSelector(
  imageSortKeySelector,
  (sortKey) => {
    return sortTypeByKey(sortKey);
  }
);

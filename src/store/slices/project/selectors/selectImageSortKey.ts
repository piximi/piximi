import { createSelector } from "@reduxjs/toolkit";
import { ImageSortKey, sortTypeByKey } from "types/ImageSortType";
import { Project } from "types/Project";

export const selectImageSortKey = ({
  project,
}: {
  project: Project;
}): ImageSortKey => {
  return project.imageSortKey;
};

export const selectImageSortType = createSelector(
  selectImageSortKey,
  (sortKey) => {
    return sortTypeByKey(sortKey);
  }
);

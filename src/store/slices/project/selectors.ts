import { Project } from "types";

import { createSelector } from "@reduxjs/toolkit";
import { ImageSortKey, sortTypeByKey } from "types/ImageSortType";

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
export const selectHighlightedCategories = ({
  project,
}: {
  project: Project;
}) => {
  return project.highlightedCategory;
};

export const selectSelectedImageIds = ({
  project,
}: {
  project: Project;
}): Array<string> => {
  return project.selectedImageIds;
};
export const selectProject = ({ project }: { project: Project }): Project => {
  return project;
};
export const selectProjectName = ({ project }: { project: Project }) => {
  return project.name;
};

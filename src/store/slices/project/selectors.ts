import { Project } from "types";

import { createSelector } from "@reduxjs/toolkit";
import {
  ImageSortKey,
  ThingSortKey_new,
  sortTypeByKey,
} from "types/ImageSortType";

export const selectImageSortKey = ({
  project,
}: {
  project: Project;
}): ImageSortKey => {
  return project.imageSortKey;
};

export const selectSortTypeNew = ({
  project,
}: {
  project: Project;
}): ThingSortKey_new => {
  return project.sortType_new;
};

export const selectActiveKind = ({ project }: { project: Project }) => {
  return project.activeKind;
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

export const selectSelectedThingIds = ({
  project,
}: {
  project: Project;
}): Array<string> => {
  return project.selectedThingIds;
};

export const selectProject = ({ project }: { project: Project }): Project => {
  return project;
};
export const selectProjectName = ({ project }: { project: Project }) => {
  return project.name;
};

export const selectImageFilters = ({ project }: { project: Project }) => {
  return project.imageFilters;
};

export const selectAnnotationFilters = ({ project }: { project: Project }) => {
  return project.annotationFilters;
};

export const selectActiveFilteredStateHasFilters = ({
  project,
}: {
  project: Project;
}) => {
  const activeKind = project.activeKind;
  const thingFilters = project.thingFilters[activeKind];
  if (!thingFilters) return false;
  const hasFilters = Object.values(thingFilters).some((filters) => {
    return filters.length > 0;
  });

  return hasFilters;
};

export const selectImageFilteredState = createSelector(
  selectImageFilters,
  (imageFilters) => {
    const hasImageFilters = Object.values(imageFilters).some((filters) => {
      return filters.length > 0;
    });
    return hasImageFilters;
  }
);

export const selectAnnotationFilteredState = createSelector(
  selectAnnotationFilters,
  (annotationFilters) => {
    const hasAnnotationFilters = Object.values(annotationFilters).some(
      (filters) => {
        return filters.length > 0;
      }
    );
    return hasAnnotationFilters;
  }
);

export const selectFilteredState = createSelector(
  [selectImageFilteredState, selectAnnotationFilteredState],
  (hasImageFilters, hasAnnotationFilters) => {
    return { hasImageFilters, hasAnnotationFilters };
  }
);

export const selectThingFilters = ({ project }: { project: Project }) => {
  return project.thingFilters;
};

export const selectActiveThingFilters = ({ project }: { project: Project }) => {
  const activeKind = project.activeKind;
  return project.thingFilters[activeKind] ?? {};
};

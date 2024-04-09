import { ProjectState } from "store/types";

import { createSelector } from "@reduxjs/toolkit";
import { ImageSortKey, ThingSortKey_new } from "utils/common/enums";
import { sortTypeByKey } from "utils/common/helpers";

export const selectImageSortKey = ({
  project,
}: {
  project: ProjectState;
}): ImageSortKey => {
  return project.imageSortKey;
};

export const selectSortTypeNew = ({
  project,
}: {
  project: ProjectState;
}): ThingSortKey_new => {
  return project.sortType_new;
};

export const selectActiveKindId = ({ project }: { project: ProjectState }) => {
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
  project: ProjectState;
}) => {
  return project.highlightedCategory;
};

export const selectSelectedImageIds = ({
  project,
}: {
  project: ProjectState;
}): Array<string> => {
  return project.selectedImageIds;
};

export const selectSelectedThingIds = ({
  project,
}: {
  project: ProjectState;
}): Array<string> => {
  return project.selectedThingIds;
};

export const selectProject = ({
  project,
}: {
  project: ProjectState;
}): ProjectState => {
  return project;
};
export const selectProjectName = ({ project }: { project: ProjectState }) => {
  return project.name;
};

export const selectImageFilters = ({ project }: { project: ProjectState }) => {
  return project.imageFilters;
};

export const selectAnnotationFilters = ({
  project,
}: {
  project: ProjectState;
}) => {
  return project.annotationFilters;
};

export const selectActiveFilteredStateHasFilters = ({
  project,
}: {
  project: ProjectState;
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

export const selectThingFilters = ({ project }: { project: ProjectState }) => {
  return project.thingFilters;
};

export const selectActiveThingFilters = ({
  project,
}: {
  project: ProjectState;
}) => {
  const activeKind = project.activeKind;
  return project.thingFilters[activeKind] ?? {};
};

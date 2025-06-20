import { createSelector } from "@reduxjs/toolkit";

import { GridSortKey } from "utils/enums";

import { ProjectState } from "store/types";

export const selectProject = ({
  project,
}: {
  project: ProjectState;
}): ProjectState => {
  return project;
};

/*
NAME
*/

export const selectProjectName = ({ project }: { project: ProjectState }) => {
  return project.name;
};

/*
SELECTED THINGS
*/

export const selectSelectedImages = ({
  project,
}: {
  project: ProjectState;
}): Record<string, number[]> => {
  return project.selectedImages;
};

export const selectSelectedAnnotations = ({
  project,
}: {
  project: ProjectState;
}): Array<string> => {
  return project.selectedAnnotations;
};

export const selectSelectedThingIds = ({
  project,
}: {
  project: ProjectState;
}): Array<string> => {
  return project.selectedThingIds;
};

/*
SORT TYPE
*/

export const selectSortType = ({
  project,
}: {
  project: ProjectState;
}): GridSortKey => {
  return project.sortType;
};

/*
ACTIVE KIND
*/

export const selectActiveKindId = ({ project }: { project: ProjectState }) => {
  return project.activeKind;
};

/*
HIGHLIGHTED CATEGORY
*/

export const selectHighlightedCategory = ({
  project,
}: {
  project: ProjectState;
}) => {
  return project.highlightedCategory;
};

/*
THING FILTERS
*/

export const selectThingFilters = ({ project }: { project: ProjectState }) => {
  return project.thingFilters;
};

export const selectActiveThingFilters = createSelector(
  selectActiveKindId,
  selectThingFilters,
  (activeKind, thingFilters) => {
    return thingFilters[activeKind] ?? {};
  },
);
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

export const selectKindTabFilters = ({
  project,
}: {
  project: ProjectState;
}) => {
  return project.kindTabFilters;
};

export const selectProjectImageChannels = ({
  project,
}: {
  project: ProjectState;
}) => {
  return project.imageChannels;
};

export const selectAllSelectedGridItems = createSelector(
  selectSelectedAnnotations,
  selectSelectedImages,
  (selectedAnnotations, selectedImages) => {
    return {
      images: Object.keys(selectedImages),
      annotations: selectedAnnotations,
    };
  },
);

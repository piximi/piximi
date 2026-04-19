import { createSelector } from "@reduxjs/toolkit";
import { difference } from "lodash";

import { ThingSortKey } from "utils/enums";
import { Partition } from "utils/models/enums";

import {
  AnnotationGridState,
  ImageFilters,
  ImageSortType,
  ProjectState,
} from "./types";

export const selectProject = ({
  project,
}: {
  project: ProjectState;
}): ProjectState => {
  return project;
};

export const selectAnnotationGridState = ({
  project,
}: {
  project: ProjectState;
}): AnnotationGridState => {
  return project.annotationGridState;
};

/*
NAME
*/

export const selectProjectName = ({ project }: { project: ProjectState }) => {
  return project.name;
};

/*
IMAGES
*/
export const selectSelectedImageIds = ({
  project,
}: {
  project: ProjectState;
}): Array<string> => {
  return project.imageGridState.selectedIds;
};

export const selectNumSelectedImages = ({
  project,
}: {
  project: ProjectState;
}): number => {
  return project.imageGridState.selectedIds.length;
};

export const selectImageFilters = ({
  project,
}: {
  project: ProjectState;
}): ImageFilters => {
  return project.imageGridState.filters;
};

export const selectImageSortType = ({
  project,
}: {
  project: ProjectState;
}): ImageSortType => {
  return project.imageGridState.sortType;
};

/*
SELECTED THINGS
*/

export const selectSelectedThingIds = ({
  project,
}: {
  project: ProjectState;
}): Array<string> => {
  return project.selectedThingIds;
};

export const selectSelectedThingIdsLength = ({
  project,
}: {
  project: ProjectState;
}) => {
  return project.selectedThingIds.length;
};

/*
SORT TYPE
*/

export const selectSortType = ({
  project,
}: {
  project: ProjectState;
}): ThingSortKey => {
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

export const selectUnfilteredActivePartitions = createSelector(
  selectActiveThingFilters,
  (thingFilters) => {
    const filteredPartitions = thingFilters.partition;
    const allPartitions = Object.values(Partition);
    const unfilteredPartitions = difference(allPartitions, filteredPartitions);
    return unfilteredPartitions;
  },
);

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

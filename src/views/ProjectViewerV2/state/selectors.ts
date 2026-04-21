import { createSelector } from "@reduxjs/toolkit";
import { difference } from "lodash";

import { ThingSortKey } from "utils/enums";
import { Partition } from "utils/models/enums";

import {
  AnnotationGridState,
  ImageFilters,
  ImageSortType,
  ProjectState,
  ViewState,
} from "./types";

export const selectProject = ({
  projectV2: project,
}: {
  projectV2: ProjectState;
}): ProjectState => {
  return project;
};

export const selectActiveView = ({
  projectV2: project,
}: {
  projectV2: ProjectState;
}): ViewState => {
  return project.activeView;
};
export const selectAnnotationGridState = ({
  projectV2: project,
}: {
  projectV2: ProjectState;
}): AnnotationGridState => {
  return project.annotationGridState;
};

/*
NAME
*/

export const selectProjectName = ({
  projectV2: project,
}: {
  projectV2: ProjectState;
}) => {
  return project.name;
};

/*
IMAGES
*/
export const selectSelectedImageIds = ({
  projectV2: project,
}: {
  projectV2: ProjectState;
}): Array<string> => {
  return project.imageGridState.selectedIds;
};

export const selectNumSelectedImages = ({
  projectV2: project,
}: {
  projectV2: ProjectState;
}): number => {
  return project.imageGridState.selectedIds.length;
};

export const selectImageFilters = ({
  projectV2: project,
}: {
  projectV2: ProjectState;
}): ImageFilters => {
  return project.imageGridState.filters;
};

export const selectImageSortType = ({
  projectV2: project,
}: {
  projectV2: ProjectState;
}): ImageSortType => {
  return project.imageGridState.sortType;
};

/*
SELECTED THINGS
*/

export const selectSelectedThingIds = ({
  projectV2: project,
}: {
  projectV2: ProjectState;
}): Array<string> => {
  return project.selectedThingIds;
};

export const selectSelectedThingIdsLength = ({
  projectV2: project,
}: {
  projectV2: ProjectState;
}) => {
  return project.selectedThingIds.length;
};

/*
SORT TYPE
*/

export const selectSortType = ({
  projectV2: project,
}: {
  projectV2: ProjectState;
}): ThingSortKey => {
  return project.sortType;
};

/*
ACTIVE KIND
*/

export const selectActiveKindId = ({
  projectV2: project,
}: {
  projectV2: ProjectState;
}) => {
  return project.activeKind;
};

/*
HIGHLIGHTED CATEGORY
*/

export const selectHighlightedCategory = ({
  projectV2: project,
}: {
  projectV2: ProjectState;
}) => {
  return project.highlightedCategory;
};

/*
THING FILTERS
*/

export const selectThingFilters = ({
  projectV2: project,
}: {
  projectV2: ProjectState;
}) => {
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
  projectV2: project,
}: {
  projectV2: ProjectState;
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
  projectV2: project,
}: {
  projectV2: ProjectState;
}) => {
  return project.kindTabFilters;
};

export const selectProjectImageChannels = ({
  projectV2: project,
}: {
  projectV2: ProjectState;
}) => {
  return project.imageChannels;
};

export const selectKindStates = ({
  projectV2: project,
}: {
  projectV2: ProjectState;
}) => {
  return project.annotationGridState.kindStates;
};

export const selectKindStateArray = createSelector(selectKindStates, (states) =>
  Object.values(states),
);

export const selectVisibleKindStates = createSelector(
  selectKindStates,
  (states) => Object.values(states).filter((state) => state.visible === true),
);

export const selectActiveKindState = ({
  projectV2: project,
}: {
  projectV2: ProjectState;
}) => {
  const activeStateId = project.annotationGridState.activeKindId;
  return project.annotationGridState.kindStates[activeStateId];
};

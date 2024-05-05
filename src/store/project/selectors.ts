import { createSelector } from "@reduxjs/toolkit";
import { difference } from "lodash";
import { ProjectState } from "store/types";

import { ThingSortKey } from "utils/common/enums";
import { Partition } from "utils/models/enums";

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

export const selectActiveThingFilters = ({
  project,
}: {
  project: ProjectState;
}) => {
  const activeKind = project.activeKind;
  return project.thingFilters[activeKind] ?? {};
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

export const selectUnfilteredActivePartitions = createSelector(
  selectActiveThingFilters,
  (thingFilters) => {
    const filteredPartitions = thingFilters.partition;
    const allPartitions = Object.values(Partition);
    const unfilteredPartitions = difference(allPartitions, filteredPartitions);
    return unfilteredPartitions;
  }
);

export const selectKindTabFilters = ({
  project,
}: {
  project: ProjectState;
}) => {
  return project.kindTabFilters;
};

/*
LOAD PERCENT
*/

export const selectLoadPercent = ({ project }: { project: ProjectState }) => {
  return project.loadPercent;
};

/*
LOAD MESSAGE
*/

export const selectLoadMessage = ({ project }: { project: ProjectState }) => {
  return project.loadMessage;
};

export const selectProjectImageChannels = ({
  project,
}: {
  project: ProjectState;
}) => {
  return project.imageChannels;
};

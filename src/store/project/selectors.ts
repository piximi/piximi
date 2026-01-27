import { createSelector } from "@reduxjs/toolkit";

import { GridSortKey } from "utils/enums";

import { ProjectState } from "store/types";
import { IMAGE_KIND } from "store/data/constants";

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

export const selectActiveKindId = ({ project }: { project: ProjectState }) => {
  return project.activeKind;
};

export const selectSelectedKindItems = ({
  project,
}: {
  project: ProjectState;
}): Record<string, Array<string>> => project.selectedKindItems;

export const selectSortType = ({
  project,
}: {
  project: ProjectState;
}): GridSortKey => {
  return project.sortType;
};

export const selectActiveCategory = ({
  project,
}: {
  project: ProjectState;
}) => {
  return project.activeCategory;
};

export const selectKindItemFilters = ({
  project,
}: {
  project: ProjectState;
}) => {
  return project.kindItemFilters;
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
export const selectProjectChannels = ({
  project,
}: {
  project: ProjectState;
}) => {
  return project.projectChannels;
};

export const selectExpandedTime = ({ project }: { project: ProjectState }) => {
  return project.expandedTime;
};

export const selectActiveKindItemFilters = createSelector(
  selectActiveKindId,
  selectKindItemFilters,
  (activeKind, kindItemFilters) => {
    return kindItemFilters[activeKind] ?? {};
  },
);

export const selectAllActiveSelectedKindItemIds = createSelector(
  selectActiveKindId,
  selectSelectedKindItems,
  (activeKindId, selectedKindItems) => {
    return selectedKindItems[activeKindId] ?? [];
  },
);

export const selectAllSelectedKindItems = createSelector(
  selectSelectedKindItems,
  (selectedKindItems) => {
    return {
      images: selectedKindItems[IMAGE_KIND] ?? [],
      annotations: Object.keys(selectedKindItems).reduce(
        (annIds: string[], kind) => {
          if (kind === IMAGE_KIND) return annIds;
          annIds.push(...selectedKindItems[kind]);
          return annIds;
        },
        [],
      ),
    };
  },
);

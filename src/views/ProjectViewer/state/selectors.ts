import { createSelector } from "@reduxjs/toolkit";

import { IMAGE_CLASSIFIER_ID } from "store/dataV2/constants";

import type {
  AnnotationGridState,
  ImageFilters,
  ImageGridState,
  ImageSortType,
  ProjectState,
  ViewState,
} from "./types";

export const selectProject = ({
  project,
}: {
  project: ProjectState;
}): ProjectState => {
  return project;
};

export const selectActiveView = ({
  project,
}: {
  project: ProjectState;
}): ViewState => {
  return project.activeView;
};

export const selectProjectImageChannels = ({
  project,
}: {
  project: ProjectState;
}) => {
  return project.imageChannels;
};

export const selectProjectName = ({ project }: { project: ProjectState }) => {
  return project.name;
};

/*
~~ IMAGE GRID
*/
export const selectImageGridState = ({
  project,
}: {
  project: ProjectState;
}): ImageGridState => {
  return project.imageGridState;
};
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
~~ ANNOTATION GRID
*/

export const selectAnnotationGridState = ({
  project,
}: {
  project: ProjectState;
}): AnnotationGridState => {
  return project.annotationGridState;
};

export const selectKindStates = ({ project }: { project: ProjectState }) => {
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
  project,
}: {
  project: ProjectState;
}) => {
  const activeStateId = project.annotationGridState.activeKindId;
  return project.annotationGridState.kindStates[activeStateId];
};

export const selectActiveKindId = ({ project }: { project: ProjectState }) => {
  return project.annotationGridState.activeKindId;
};

/*
~~ ACTIVE GRID
*/
export const selectActiveViewState = createSelector(
  selectActiveView,
  selectImageGridState,
  selectActiveKindState,
  (view, imGrid, kindGrid) => {
    if (view === "images") return { view, ...imGrid };
    return { view, ...kindGrid };
  },
);

export const selectActiveFilters = ({ project }: { project: ProjectState }) => {
  const viewState = project.activeView;
  const activeKindId = project.annotationGridState.activeKindId;
  const activeState =
    viewState === "images"
      ? project.imageGridState
      : project.annotationGridState.kindStates[activeKindId];

  return activeState.filters;
};

export const selectActiveStateFilterCount = ({
  project,
}: {
  project: ProjectState;
}): boolean => {
  const viewState = project.activeView;
  const activeKindId = project.annotationGridState.activeKindId;
  const activeState =
    viewState === "images"
      ? project.imageGridState
      : project.annotationGridState.kindStates[activeKindId];

  return Boolean(
    Object.values(activeState.filters).reduce((cnt: number, f) => {
      cnt += f.length;
      return cnt;
    }, 0),
  );
};

export const selectActiveSelectedIds = ({
  project,
}: {
  project: ProjectState;
}): string[] => {
  const viewState = project.activeView;
  const activeKindId = project.annotationGridState.activeKindId;
  const activeState =
    viewState === "images"
      ? project.imageGridState
      : project.annotationGridState.kindStates[activeKindId];

  return activeState.selectedIds;
};

export const selectActiveFilteredSelectedIds = ({
  project,
}: {
  project: ProjectState;
}): string[] => {
  const viewState = project.activeView;
  const activeKindId = project.annotationGridState.activeKindId;
  const activeState =
    viewState === "images"
      ? project.imageGridState
      : project.annotationGridState.kindStates[activeKindId];

  return activeState.selectedIds;
};

export const selectActiveClassifierModelTarget = createSelector(
  selectActiveView,
  selectActiveKindState,
  (viewState, activeKindState): { id: string; name: string } => {
    if (viewState === "images")
      return { id: IMAGE_CLASSIFIER_ID, name: "Image" };
    return { id: activeKindState.id, name: activeKindState.name };
  },
);

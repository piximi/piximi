import { createSelector } from "@reduxjs/toolkit";

import {
  AnnotationGridState,
  ImageFilters,
  ImageGridState,
  ImageSortType,
  ProjectState,
  ViewState,
} from "./types";
import { IMAGE_CLASSIFIER_ID } from "store/dataV2/constants";

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

export const selectProjectImageChannels = ({
  projectV2: project,
}: {
  projectV2: ProjectState;
}) => {
  return project.imageChannels;
};

export const selectProjectName = ({
  projectV2: project,
}: {
  projectV2: ProjectState;
}) => {
  return project.name;
};

/*
~~ IMAGE GRID
*/
export const selectImageGridState = ({
  projectV2: project,
}: {
  projectV2: ProjectState;
}): ImageGridState => {
  return project.imageGridState;
};
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
~~ ANNOTATION GRID
*/

export const selectAnnotationGridState = ({
  projectV2: project,
}: {
  projectV2: ProjectState;
}): AnnotationGridState => {
  return project.annotationGridState;
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

export const selectActiveKindId = ({
  projectV2: project,
}: {
  projectV2: ProjectState;
}) => {
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

export const selectActiveFilters = ({
  projectV2: project,
}: {
  projectV2: ProjectState;
}) => {
  const viewState = project.activeView;
  const activeKindId = project.annotationGridState.activeKindId;
  const activeState =
    viewState === "images"
      ? project.imageGridState
      : project.annotationGridState.kindStates[activeKindId];

  return activeState.filters;
};

export const selectActiveStateFilterCount = ({
  projectV2: project,
}: {
  projectV2: ProjectState;
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
  projectV2: project,
}: {
  projectV2: ProjectState;
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
  projectV2: project,
}: {
  projectV2: ProjectState;
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

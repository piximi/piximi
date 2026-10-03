import { createSelector } from "@reduxjs/toolkit";

import { selectWorkingAnnotationEntity } from "./selectors";

import type { WorkingAnnotation } from "@ImageViewer/utils/types";

export const selectFullWorkingAnnotation = createSelector(
  selectWorkingAnnotationEntity,
  (workingAnnotationEntity) => {
    if (!workingAnnotationEntity.saved) return;
    return {
      ...workingAnnotationEntity.saved,
      ...workingAnnotationEntity.changes,
    } as WorkingAnnotation;
  },
);

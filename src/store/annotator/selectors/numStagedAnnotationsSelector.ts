import { createSelector } from "@reduxjs/toolkit";
import { stagedAnnotationsSelector } from "./stagedAnnotationsSelector";

export const numStagedAnnotationsSelector = createSelector(
  stagedAnnotationsSelector,
  (stagedAnnotations) => stagedAnnotations.length
);

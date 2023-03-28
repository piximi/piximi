// import { createSelector } from "@reduxjs/toolkit";
import { Annotator } from "types";
// import { stagedAnnotationsSelector } from "./stagedAnnotationsSelector";

// export const numStagedAnnotationsSelector = createSelector(
//   stagedAnnotationsSelector,
//   (stagedAnnotations) => stagedAnnotations.length
// );

export const numStagedAnnotationsSelector = ({
  annotator,
}: {
  annotator: Annotator;
}) => {
  return annotator.stagedAnnotationIds.length;
};

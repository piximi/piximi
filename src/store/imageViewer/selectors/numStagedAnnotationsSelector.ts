// import { createSelector } from "@reduxjs/toolkit";
import { ImageViewer } from "types";
// import { stagedAnnotationsSelector } from "./stagedAnnotationsSelector";

// export const numStagedAnnotationsSelector = createSelector(
//   stagedAnnotationsSelector,
//   (stagedAnnotations) => stagedAnnotations.length
// );

export const numStagedAnnotationsSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}) => {
  return imageViewer.stagedAnnotationIds.length;
};

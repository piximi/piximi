// import { createSelector } from "@reduxjs/toolkit";
import { ImageViewerStore } from "types";
// import { stagedAnnotationsSelector } from "./stagedAnnotationsSelector";

// export const numStagedAnnotationsSelector = createSelector(
//   stagedAnnotationsSelector,
//   (stagedAnnotations) => stagedAnnotations.length
// );

export const numStagedAnnotationsSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewerStore;
}) => {
  return imageViewer.stagedAnnotationIds.length;
};

import type { ImageViewerDataState } from "../types";

export const selectHasUnsavedChanges = ({
  imageViewerData,
}: {
  imageViewerData: ImageViewerDataState;
}) => {
  return imageViewerData.hasUnsavedChanges;
};

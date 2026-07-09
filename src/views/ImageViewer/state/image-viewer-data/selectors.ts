import type { ImageViewerDataState } from "../types";

export const selectHasUnsavedChanges = ({
  imageViewerData,
}: {
  imageViewerData: ImageViewerDataState;
}) => {
  return imageViewerData.hasUnsavedChanges;
};

export const selectImageStackIds = ({
  imageViewerData,
}: {
  imageViewerData: ImageViewerDataState;
}) => {
  return imageViewerData.imageStack;
};

export const selectActiveImageId = ({
  imageViewerData,
}: {
  imageViewerData: ImageViewerDataState;
}) => {
  return imageViewerData.activeImageId;
};

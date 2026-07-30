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

export const selectFilterLayer = ({
  imageViewerData,
}: {
  imageViewerData: ImageViewerDataState;
}) => {
  return imageViewerData.filterLayer;
};
export const selectPlaneScope = ({
  imageViewerData,
}: {
  imageViewerData: ImageViewerDataState;
}) => {
  return imageViewerData.planeScope;
};
export const selectSelectedCategory = ({
  imageViewerData,
}: {
  imageViewerData: ImageViewerDataState;
}) => {
  return imageViewerData.selectedCategory;
};
export const selectSelectionLayer = ({
  imageViewerData,
}: {
  imageViewerData: ImageViewerDataState;
}) => {
  return imageViewerData.selectionLayer;
};

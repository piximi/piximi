import { createSelector } from "@reduxjs/toolkit";
import { ImageViewerDataState, ImageViewerMetadataDetails } from "./types";

export const selectActiveMetadataId = ({
  imageViewerData,
}: {
  imageViewerData: ImageViewerDataState;
}): string | undefined => {
  return imageViewerData.activeMetdataId;
};

export const selectActiveMetadata = ({
  imageViewerData,
}: {
  imageViewerData: ImageViewerDataState;
}): ImageViewerMetadataDetails | undefined => {
  if (!imageViewerData.activeMetdataId) return;
  return imageViewerData.metadataStack[imageViewerData.activeMetdataId];
};

export const selectActiveAnnotationIds = ({
  imageViewerData,
}: {
  imageViewerData: ImageViewerDataState;
}) => {
  return imageViewerData.activeAnnotationIds;
};

export const selectSelectedIVCategoryId = ({
  imageViewerData,
}: {
  imageViewerData: ImageViewerDataState;
}) => {
  return imageViewerData.selectedCategoryId;
};

export const selectMetadataStack = ({
  imageViewerData,
}: {
  imageViewerData: ImageViewerDataState;
}) => {
  return imageViewerData.metadataStack;
};

export const selectHighligtedIVCatogory = ({
  imageViewerData,
}: {
  imageViewerData: ImageViewerDataState;
}) => {
  return imageViewerData.highlightedCategory;
};

export const selectHasUnsavedChanges = ({
  imageViewerData,
}: {
  imageViewerData: ImageViewerDataState;
}) => {
  return imageViewerData.hasUnsavedChanges;
};
export const selectSelectedAnnotationIds = ({
  imageViewerData,
}: {
  imageViewerData: ImageViewerDataState;
}): string[] => {
  return imageViewerData.selectedAnnotationIds;
};

// Z Linking Selectors

export const selectZLinkingState = ({
  imageViewerData,
}: {
  imageViewerData: ImageViewerDataState;
}) => {
  return imageViewerData.zLinking.active;
};
export const selectZLinkingAnnIds = ({
  imageViewerData,
}: {
  imageViewerData: ImageViewerDataState;
}) => {
  return imageViewerData.zLinking.annIds;
};

export const selectActivePlane = createSelector(
  selectActiveMetadata,
  (activeImageSeries) => {
    return activeImageSeries?.activePlane;
  },
);

export const selectActiveImageId = createSelector(
  selectActiveMetadata,
  (activeImageSeries) => {
    return activeImageSeries?.activeImageId;
  },
);

export const selectMetadataStackArray = createSelector(
  selectMetadataStack,
  (stack) => Object.values(stack),
);

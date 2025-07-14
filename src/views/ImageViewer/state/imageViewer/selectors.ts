import { createSelector } from "@reduxjs/toolkit";
import { ImageViewerState } from "../../utils/types";
import {
  ColorAdjustmentOptionsType,
  ZoomToolOptionsType,
} from "views/ImageViewer/utils/types";

export const selectActiveImageSeries = ({
  imageViewer,
}: {
  imageViewer: ImageViewerState;
}) => {
  if (imageViewer.activeImageSeriesId === undefined) {
    return undefined;
  }
  return imageViewer.imageStack[imageViewer.activeImageSeriesId];
};

export const selectActivePlane = createSelector(
  selectActiveImageSeries,
  (activeImageSeries) => {
    return activeImageSeries?.activePlane;
  },
);

export const selectActiveTimepoint = createSelector(
  selectActiveImageSeries,
  (activeImageSeries) => {
    return activeImageSeries?.activeTimepoint;
  },
);

export const selectZoomToolOptions = ({
  imageViewer,
}: {
  imageViewer: ImageViewerState;
}): ZoomToolOptionsType => {
  return imageViewer.zoomOptions;
};

export const selectZoomSelection = ({
  imageViewer,
}: {
  imageViewer: ImageViewerState;
}): {
  dragging: boolean;
  minimum: { x: number; y: number } | undefined;
  maximum: { x: number; y: number } | undefined;
  selecting: boolean;
  centerPoint: { x: number; y: number } | undefined;
} => {
  return imageViewer.zoomSelection;
};

export const selectStageWidth = ({
  imageViewer,
}: {
  imageViewer: ImageViewerState;
}): number => {
  return imageViewer.stageWidth;
};

export const selectStageScale = ({
  imageViewer,
}: {
  imageViewer: ImageViewerState;
}): number => {
  return imageViewer.zoomOptions.scale;
};

export const selectStagePosition = ({
  imageViewer,
}: {
  imageViewer: ImageViewerState;
}): { x: number; y: number } => {
  return imageViewer.stagePosition;
};

export const selectStageHeight = ({
  imageViewer,
}: {
  imageViewer: ImageViewerState;
}): number => {
  return imageViewer.stageHeight;
};

export const selectSelectedIVCategoryId = ({
  imageViewer,
}: {
  imageViewer: ImageViewerState;
}) => {
  return imageViewer.selectedCategoryId;
};

export const selectImageViewerFilters = ({
  imageViewer,
}: {
  imageViewer: ImageViewerState;
}) => {
  return imageViewer.filters;
};

export const selectImageStackImageIds = ({
  imageViewer,
}: {
  imageViewer: ImageViewerState;
}) => {
  return imageViewer.imageStack;
};

export const selectImageOrigin = ({
  imageViewer,
}: {
  imageViewer: ImageViewerState;
}) => {
  return imageViewer.imageOrigin;
};

export const selectImageIsloading = ({
  imageViewer,
}: {
  imageViewer: ImageViewerState;
}) => {
  return imageViewer.imageIsLoading;
};

export const selectHighligtedIVCatogory = ({
  imageViewer,
}: {
  imageViewer: ImageViewerState;
}) => {
  return imageViewer.highlightedCategory;
};

export const selectFilteredImageViewerCategoryIds = ({
  imageViewer,
}: {
  imageViewer: ImageViewerState;
}) => {
  return imageViewer.filters.categoryId;
};

export const selectCursor = ({
  imageViewer,
}: {
  imageViewer: ImageViewerState;
}): string => {
  return imageViewer.cursor;
};

export const selectColorAdjustments = ({
  imageViewer,
}: {
  imageViewer: ImageViewerState;
}): ColorAdjustmentOptionsType => {
  return imageViewer.colorAdjustment;
};

export const selectActiveImageId = ({
  imageViewer,
}: {
  imageViewer: ImageViewerState;
}): string | undefined => {
  return imageViewer.activeImageSeriesId;
};

export const selectActiveAnnotationIds = ({
  imageViewer,
}: {
  imageViewer: ImageViewerState;
}) => {
  return imageViewer.activeAnnotationIds;
};

/*
UNSAVED CHANGES
*/

export const selectHasUnsavedChanges = ({
  imageViewer,
}: {
  imageViewer: ImageViewerState;
}) => {
  return imageViewer.hasUnsavedChanges;
};

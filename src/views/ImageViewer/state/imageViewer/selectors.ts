import {
  ColorAdjustmentOptionsType,
  ImageViewerState,
  ZoomToolOptionsType,
} from "../types";

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

export const selectImageViewerFilters = ({
  imageViewer,
}: {
  imageViewer: ImageViewerState;
}) => {
  return imageViewer.filters;
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

/*
UNSAVED CHANGES
*/

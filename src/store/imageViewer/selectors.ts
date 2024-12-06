import { ImageViewerState } from "store/types";
import {
  ColorAdjustmentOptionsType,
  ZoomToolOptionsType,
} from "utils/annotator/types";

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

export const selectWorkingAnnotationId = ({
  imageViewer,
}: {
  imageViewer: ImageViewerState;
}): string | undefined => {
  return imageViewer.workingAnnotationId;
};
export const selectWorkingAnnotation = ({
  imageViewer,
}: {
  imageViewer: ImageViewerState;
}) => {
  return imageViewer.workingAnnotation;
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

export const selectSelectedAnnotationIds = ({
  imageViewer,
}: {
  imageViewer: ImageViewerState;
}): string[] => {
  return imageViewer.selectedAnnotationIds;
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

export const selectActiveImageRenderedSrcs = ({
  imageViewer,
}: {
  imageViewer: ImageViewerState;
}): Array<string> => {
  return imageViewer.activeImageRenderedSrcs;
};

export const selectActiveImageId = ({
  imageViewer,
}: {
  imageViewer: ImageViewerState;
}): string | undefined => {
  return imageViewer.activeImageId;
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
  project,
}: {
  project: ImageViewerState;
}) => {
  return project.hasUnsavedChanges;
};

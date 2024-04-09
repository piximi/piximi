import { ImageViewerState } from "store/types";

export const selectSelectedAnnotationCategoryId = ({
  imageViewer,
}: {
  imageViewer: ImageViewerState;
}) => {
  return imageViewer.selectedCategoryId;
};

export const selectSelectedIVCategoryId = ({
  imageViewer,
}: {
  imageViewer: ImageViewerState;
}) => {
  return imageViewer.selectedCategoryId;
};

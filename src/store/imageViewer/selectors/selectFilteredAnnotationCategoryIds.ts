import { ImageViewerState } from "store/types";

export const selectFilteredAnnotationCategoryIds = ({
  imageViewer,
}: {
  imageViewer: ImageViewerState;
}) => {
  return imageViewer.annotationFilters.categoryId;
};

export const selectFilteredImageViewerCategoryIds = ({
  imageViewer,
}: {
  imageViewer: ImageViewerState;
}) => {
  return imageViewer.filters.categoryId;
};

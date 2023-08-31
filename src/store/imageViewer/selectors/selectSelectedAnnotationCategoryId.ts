import { ImageViewerStore } from "types";

export const selectSelectedAnnotationCategoryId = ({
  imageViewer,
}: {
  imageViewer: ImageViewerStore;
}) => {
  return imageViewer.selectedCategoryId;
};

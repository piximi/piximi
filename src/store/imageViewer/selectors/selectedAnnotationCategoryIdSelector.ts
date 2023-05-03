import { ImageViewerStore } from "types";

export const selectedAnnotationCategoryIdSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewerStore;
}) => {
  return imageViewer.selectedCategoryId;
};

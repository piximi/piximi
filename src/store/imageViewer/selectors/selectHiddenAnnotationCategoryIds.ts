import { ImageViewerStore } from "types";

export const selectHiddenAnnotationCategoryIds = ({
  imageViewer,
}: {
  imageViewer: ImageViewerStore;
}) => {
  return imageViewer.hiddenCategoryIds;
};

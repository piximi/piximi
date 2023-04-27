import { ImageViewer } from "types";

export const selectHiddenAnnotationCategoryIds = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}) => {
  return imageViewer.hiddenCategoryIds;
};

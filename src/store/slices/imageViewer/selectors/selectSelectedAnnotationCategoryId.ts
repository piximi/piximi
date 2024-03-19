import { ImageViewer } from "types";

export const selectSelectedAnnotationCategoryId = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}) => {
  return imageViewer.selectedCategoryId;
};

export const selectSelectedIVCategoryId = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}) => {
  return imageViewer.selectedCategoryId;
};

import { ImageViewer } from "types";

export const selectedAnnotationCategoryIdSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}) => {
  return imageViewer.selectedCategoryId;
};

import { ImageViewer } from "types";

export const selectFilteredAnnotationCategoryIds = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}) => {
  return imageViewer.annotationFilters.categoryId;
};

import { Category, ImageViewer, DataStoreSlice } from "types";

export const selectSelectedAnnotationCategory = ({
  imageViewer,
  data,
}: {
  imageViewer: ImageViewer;
  data: DataStoreSlice;
}): Category => {
  return data.annotationCategories.entities[imageViewer.selectedCategoryId];
};

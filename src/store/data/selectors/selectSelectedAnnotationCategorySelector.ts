import { Category, Annotator, DataStoreSlice } from "types";

export const selectSelectedAnnotationCategory = ({
  annotator,
  data,
}: {
  annotator: Annotator;
  data: DataStoreSlice;
}): Category => {
  return data.annotationCategories.entities[annotator.selectedCategoryId];
};

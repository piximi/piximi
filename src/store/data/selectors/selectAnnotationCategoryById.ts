import { DataStoreSlice } from "types";

export const selectAnnotationCategoryById =
  (categoryId: string) =>
  ({ data }: { data: DataStoreSlice }) => {
    return data.annotationCategories.entities[categoryId];
  };

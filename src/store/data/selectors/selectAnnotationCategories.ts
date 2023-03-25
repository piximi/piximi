import { DataStoreSlice } from "types";

export const selectAnnotationCategories = ({
  data,
}: {
  data: DataStoreSlice;
}) => {
  return Object.values(data.annotationCategories.entities);
};

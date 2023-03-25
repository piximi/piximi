import { DataStoreSlice } from "types";

export const selectAllAnnotationCategories = ({
  data,
}: {
  data: DataStoreSlice;
}) => {
  return Object.values(data.categories.entities);
};

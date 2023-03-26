import { DataStoreSlice } from "types";

export const selectAnnotationEntities = ({
  data,
}: {
  data: DataStoreSlice;
}) => {
  return data.annotations.entities;
};

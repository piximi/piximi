import { DataStoreSlice } from "types";

export const selectImageEntities = ({ data }: { data: DataStoreSlice }) => {
  return data.images.entities;
};

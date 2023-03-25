import { DataStoreSlice } from "types";

export const selectAllCategories = ({ data }: { data: DataStoreSlice }) => {
  return Object.values(data.categories.entities);
};

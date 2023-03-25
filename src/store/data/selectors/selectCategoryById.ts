import { DataStoreSlice } from "types";

export const selectCategoryById =
  (categoryId: string) =>
  ({ data }: { data: DataStoreSlice }) => {
    return data.categories.entities[categoryId];
  };

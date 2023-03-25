import { DataStoreSlice } from "types";

export const selectImagesByCategory =
  (categoryId: string) =>
  ({ data }: { data: DataStoreSlice }) => {
    return data.imagesByCategory[categoryId] ?? [];
  };

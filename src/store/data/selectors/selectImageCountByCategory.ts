import { DataStoreSlice } from "types";

export const selectImageCountByCategory =
  (categoryId: string) =>
  ({ data }: { data: DataStoreSlice }) => {
    return data.imagesByCategory[categoryId]?.length;
  };

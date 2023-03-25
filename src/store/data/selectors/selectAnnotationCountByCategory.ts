import { DataStoreSlice } from "types";

export const selectAnnotationCountByCategory =
  (categoryId: string) =>
  ({ data }: { data: DataStoreSlice }) => {
    return data.annotationsByCategory[categoryId]?.length;
  };

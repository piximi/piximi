import { DataStoreSlice } from "types";

export const selectCreatedCategoryCount = ({
  data,
}: {
  data: DataStoreSlice;
}) => {
  return data.categories.ids.length - 1;
};

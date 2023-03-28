import { DataStoreSlice } from "types";

export const selectStagedImageEntities = ({
  data,
}: {
  data: DataStoreSlice;
}) => {
  return data.stagedImages.entities;
};

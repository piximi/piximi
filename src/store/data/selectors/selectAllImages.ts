import { DataStoreSlice } from "types";

export const selectAllImages = ({ data }: { data: DataStoreSlice }) => {
  return Object.values(data.images.entities);
};

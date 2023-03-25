import { DataStoreSlice } from "types";

export const selectImageCount = ({ data }: { data: DataStoreSlice }) => {
  return data.images.ids.length;
};

import { DataStoreSlice } from "types";

export const selectAnnotationsByImageObject = ({
  data,
}: {
  data: DataStoreSlice;
}) => {
  return data.annotationsByImage;
};

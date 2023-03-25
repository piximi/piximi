import { DataStoreSlice } from "types";

export const selectAllVisibleAnnotationCategories = ({
  data,
}: {
  data: DataStoreSlice;
}) => {
  return Object.values(data.categories.entities).filter(
    (category) => category.visible === true
  );
};

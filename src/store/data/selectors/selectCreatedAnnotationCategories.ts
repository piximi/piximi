import { UNKNOWN_ANNOTATION_CATEGORY_ID } from "types/Category";
import { sortBy } from "lodash";
import { DataStoreSlice } from "types";

export const selectCreatedAnnotatorCategories = ({
  data,
}: {
  data: DataStoreSlice;
}) => {
  const categories = Object.values(data.annotationCategories.entities).filter(
    (category) => category.id !== UNKNOWN_ANNOTATION_CATEGORY_ID
  );

  return sortBy(categories, "name");
};

import { DataStoreSlice } from "types";

export const selectAnnotationEntities = ({
  data,
}: {
  data: DataStoreSlice;
}) => {
  return data.annotations.entities;
};
export const selectAnnotationCategoryEntities = ({
  data,
}: {
  data: DataStoreSlice;
}) => {
  return data.annotationCategories.entities;
};

export const selectAnnotationsByImageEntity = ({
  data,
}: {
  data: DataStoreSlice;
}) => {
  return data.annotationsByImage;
};

export const selectStagedAnnotationEntities = ({
  data,
}: {
  data: DataStoreSlice;
}) => {
  return data.stagedAnnotations.entities;
};

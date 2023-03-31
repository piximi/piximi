import { DataStoreSlice, Category, ImageViewer } from "types";
import { UNKNOWN_ANNOTATION_CATEGORY_ID } from "types/Category";
import { sortBy } from "lodash";

export const selectAllAnnotationCategories = ({
  data,
}: {
  data: DataStoreSlice;
}) => {
  return Object.values(data.annotationCategories.entities);
};
export const selectAnnotationCategoryEntities = ({
  data,
}: {
  data: DataStoreSlice;
}) => {
  return data.annotationCategories.entities;
};
export const selectAllVisibleAnnotationCategories = ({
  data,
}: {
  data: DataStoreSlice;
}) => {
  return Object.values(data.categories.entities).filter(
    (category) => category.visible === true
  );
};
export const selectAnnotationCategoryById =
  (categoryId: string) =>
  ({ data }: { data: DataStoreSlice }) => {
    return data.annotationCategories.entities[categoryId];
  };

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

//TODO: reselect
export const selectSelectedAnnotationCategory = ({
  imageViewer,
  data,
}: {
  imageViewer: ImageViewer;
  data: DataStoreSlice;
}): Category => {
  return data.annotationCategories.entities[imageViewer.selectedCategoryId];
};

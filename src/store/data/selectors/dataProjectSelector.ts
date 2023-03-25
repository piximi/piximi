import { Category, DataStoreSlice, OldImageType } from "types";

export const dataProjectSelector = ({
  data,
}: {
  data: DataStoreSlice;
}): {
  images: Array<OldImageType>;
  categories: Array<Category>;
  annotationCategories: Array<Category>;
} => {
  const images: Array<OldImageType> = Object.values(data.images.entities).map(
    (image) => {
      const annotationIds = data.annotationsByImage[image.id];
      const annotations = Object.values(data.annotations.entities).filter(
        (annotation) => annotationIds.includes(annotation!.id)
      );
      return { ...image, annotations } as OldImageType;
    }
  );

  return {
    images,
    categories: Object.values(data.categories.entities),
    annotationCategories: Object.values(data.annotationCategories.entities),
  };
};

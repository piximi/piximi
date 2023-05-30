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
      const annotationIds = data.annotationsByImage[image.saved.id];
      const annotations = Object.values(data.annotations.entities).filter(
        (annotation) => annotationIds.includes(annotation!.saved.id)
      );
      return {
        ...image.saved,
        annotations: annotations.map((entity) => entity.saved),
      } as OldImageType;
    }
  );

  return {
    images,
    categories: Object.values(data.imageCategories.entities).map(
      (entity) => entity.saved
    ),
    annotationCategories: Object.values(data.annotationCategories.entities).map(
      (entity) => entity.saved
    ),
  };
};

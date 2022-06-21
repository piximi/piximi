import { Category, UNKNOWN_ANNOTATION_CATEGORY_ID } from "types/Category";
import { ImageViewer } from "types/ImageViewer";

export const unknownAnnotationCategorySelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}) => {
  return imageViewer.categories.find((category: Category) => {
    return category.id === UNKNOWN_ANNOTATION_CATEGORY_ID;
  })!;
};

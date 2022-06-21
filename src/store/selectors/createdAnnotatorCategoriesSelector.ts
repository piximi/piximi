import { Category, UNKNOWN_ANNOTATION_CATEGORY_ID } from "types/Category";
import { sortBy } from "lodash";
import { ImageViewer } from "types/ImageViewer";

export const createdAnnotatorCategoriesSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}) => {
  const categories = imageViewer.categories.filter((category: Category) => {
    return category.id !== UNKNOWN_ANNOTATION_CATEGORY_ID;
  });

  return sortBy(categories, "name");
};

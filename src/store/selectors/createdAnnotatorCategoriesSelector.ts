import { Category } from "../../types/Category";
import { sortBy } from "underscore";
import { ImageViewer } from "../../types/ImageViewer";

export const createdAnnotatorCategoriesSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}) => {
  const categories = imageViewer.categories.filter((category: Category) => {
    return category.id !== "00000000-0000-0000-0000-000000000000";
  });

  return sortBy(categories, "name");
};

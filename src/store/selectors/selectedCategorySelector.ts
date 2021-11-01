import { ImageViewer } from "../../types/ImageViewer";
import * as _ from "lodash";
import { Category } from "../../types/Category";

export const selectedCategorySelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): Category => {
  const category = _.find(imageViewer.categories, (category: Category) => {
    return category.id === imageViewer.selectedCategory;
  });

  return category!;
};

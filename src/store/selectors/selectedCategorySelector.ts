import { ImageViewer } from "../../types/ImageViewer";
import * as _ from "lodash";
import { Category } from "../../types/Category";
import { Project } from "../../types/Project";

export const selectedCategorySelector = ({
  project,
  imageViewer,
}: {
  project: Project;
  imageViewer: ImageViewer;
}): Category => {
  const category = _.find(project.categories, (category: Category) => {
    return category.id === imageViewer.selectedCategory;
  });

  return category!;
};

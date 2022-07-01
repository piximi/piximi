import { ImageViewer } from "../../types/ImageViewer";
import * as _ from "lodash";
import { Category } from "../../types/Category";
import { Project } from "types/Project";

export const selectedCategorySelector = ({
  imageViewer,
  project,
}: {
  imageViewer: ImageViewer;
  project: Project;
}): Category => {
  const category = _.find(
    project.annotationCategories,
    (category: Category) => {
      return category.id === imageViewer.selectedCategoryId;
    }
  );

  return category!;
};

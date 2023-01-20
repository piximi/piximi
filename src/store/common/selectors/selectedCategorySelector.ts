import _ from "lodash";
import { Category, ImageViewer, Project } from "types";

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

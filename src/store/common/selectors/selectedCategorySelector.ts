import { Category, Annotator, Project } from "types";

export const selectedCategorySelector = ({
  annotator,
  project,
}: {
  annotator: Annotator;
  project: Project;
}): Category => {
  const category = project.annotationCategories.find((category: Category) => {
    return category.id === annotator.selectedCategoryId;
  });

  return category!;
};

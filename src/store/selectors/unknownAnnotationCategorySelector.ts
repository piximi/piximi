import { Category, UNKNOWN_ANNOTATION_CATEGORY_ID } from "types/Category";
import { Project } from "types/Project";

export const unknownAnnotationCategorySelector = ({
  project,
}: {
  project: Project;
}) => {
  return project.annotationCategories.find((category: Category) => {
    return category.id === UNKNOWN_ANNOTATION_CATEGORY_ID;
  })!;
};

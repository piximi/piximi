import { Category, UNKNOWN_ANNOTATION_CATEGORY_ID, Project } from "types";

export const unknownAnnotationCategorySelector = ({
  project,
}: {
  project: Project;
}) => {
  return project.annotationCategories.find((category: Category) => {
    return category.id === UNKNOWN_ANNOTATION_CATEGORY_ID;
  })!;
};

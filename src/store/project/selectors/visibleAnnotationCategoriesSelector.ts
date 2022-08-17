import { Project } from "types";

export const visibleAnnotationCategoriesSelector = ({
  project,
}: {
  project: Project;
}) => {
  return project.annotationCategories
    .filter((category) => category.visible)
    .map((category) => {
      return category.id;
    });
};

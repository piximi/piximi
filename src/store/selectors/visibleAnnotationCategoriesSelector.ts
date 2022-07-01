import { Project } from "types/Project";
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

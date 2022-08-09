import { Project } from "types/Project";

export const annotationCategoriesSelector = ({
  project,
}: {
  project: Project;
}) => {
  return project.annotationCategories;
};

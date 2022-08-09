import { Project } from "types/Project";
import { Category } from "types/Category";

export const annotationCategoriesSelector = ({
  project,
}: {
  project: Project;
}): Array<Category> => {
  return project.annotationCategories;
};

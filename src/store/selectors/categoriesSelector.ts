import { Project } from "../../types/Project";
import { Category } from "../../types/Category";

export const categoriesSelector = ({
  project,
}: {
  project: Project;
}): Array<Category> => {
  return project.categories;
};

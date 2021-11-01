import { Project } from "../../types/Project";
export const categoriesSelector = (project: Project) => {
  return project.categories;
};

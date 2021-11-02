import { Project } from "../../types/Project";
export const categoriesSelector = ({ project }: { project: Project }) => {
  return project.categories;
};

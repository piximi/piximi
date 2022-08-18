import { Project } from "types";
export const categoriesSelector = ({ project }: { project: Project }) => {
  return project.categories;
};

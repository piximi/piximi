import { Project } from "types";

export const highlightedCategoriesSelector = ({
  project,
}: {
  project: Project;
}) => {
  return project.highlightedCategory;
};

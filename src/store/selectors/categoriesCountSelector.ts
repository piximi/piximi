import { Project } from "../../types/Project";

export const categoriesCountSelector = ({
  project,
}: {
  project: Project;
}): number => {
  return project.categories.length - 1;
};

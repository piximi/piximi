import { Project } from "../../types/Project";

export const createdCategoriesCountSelector = ({
  project,
}: {
  project: Project;
}): number => {
  return project.categories.length - 1;
};

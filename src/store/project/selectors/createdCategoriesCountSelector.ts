import { Project } from "types";

export const createdCategoriesCountSelector = ({
  project,
}: {
  project: Project;
}): number => {
  return project.categories.length - 1;
};

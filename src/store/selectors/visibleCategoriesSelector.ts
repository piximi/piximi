import { Project } from "../../types/Project";
export const visibleCategoriesSelector = ({
  project,
}: {
  project: Project;
}) => {
  return project.categories
    .filter((category) => category.visible)
    .map((category) => {
      return category.id;
    });
};

import { Category, UNKNOWN_CATEGORY_ID, Project } from "types";

export const unknownCategorySelector = ({ project }: { project: Project }) => {
  return project.categories.find((category: Category) => {
    return category.id === UNKNOWN_CATEGORY_ID;
  })!;
};

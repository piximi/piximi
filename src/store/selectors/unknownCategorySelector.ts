import { Category, UNKNOWN_CATEGORY_ID } from "../../types/Category";
import { Project } from "../../types/Project";

export const unknownCategorySelector = ({ project }: { project: Project }) => {
  return project.categories.find((category: Category) => {
    return category.id === UNKNOWN_CATEGORY_ID;
  })!;
};

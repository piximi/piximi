import { Category } from "../../types/Category";
import { Project } from "../../types/Project";

export const unknownCategorySelector = ({ project }: { project: Project }) => {
  return project.categories.find((category: Category) => {
    return category.id === "00000000-0000-0000-0000-000000000000";
  })!;
};

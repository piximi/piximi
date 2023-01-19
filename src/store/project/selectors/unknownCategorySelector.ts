import { Category, UNKNOWN_CLASS_CATEGORY_ID, Project } from "types";

export const unknownCategorySelector = ({ project }: { project: Project }) => {
  return project.categories.find((category: Category) => {
    return category.id === UNKNOWN_CLASS_CATEGORY_ID;
  })!;
};

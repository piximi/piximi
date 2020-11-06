import { Project } from "../../types/Project";
import { Category } from "../../types/Category";

export const unknownCategorySelector = ({
  project,
}: {
  project: Project;
}): Category => {
  return project.categories.find((category: Category) => {
    return category.id === "00000000-0000-0000-0000-000000000000";
  })!;
};

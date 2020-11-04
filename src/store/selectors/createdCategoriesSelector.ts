import { Project } from "../../types/Project";
import { Category } from "../../types/Category";
import { sortBy } from "underscore";

export const createdCategoriesSelector = ({
  project,
}: {
  project: Project;
}): Array<Category> => {
  const categories = project.categories.filter((category: Category) => {
    return category.id !== "00000000-0000-0000-0000-000000000000";
  });
  return sortBy(categories, "name");
};

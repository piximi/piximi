import { Category } from "../../types/Category";
import { sortBy } from "underscore";
import { Project } from "../../types/Project";

export const createdCategoriesSelector = ({
  project,
}: {
  project: Project;
}) => {
  const categories = project.categories.filter((category: Category) => {
    return category.id !== "00000000-0000-0000-0000-000000000000";
  });

  return sortBy(categories, "name");
};

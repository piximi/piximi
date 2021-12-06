import { Category, UNKNOWN_CATEGORY_ID } from "../../types/Category";
import { sortBy } from "lodash";
import { Project } from "../../types/Project";

export const createdCategoriesSelector = ({
  project,
}: {
  project: Project;
}) => {
  const categories = project.categories.filter((category: Category) => {
    return category.id !== UNKNOWN_CATEGORY_ID;
  });

  return sortBy(categories, "name");
};

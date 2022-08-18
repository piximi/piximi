import { Project, Category, UNKNOWN_CATEGORY_ID } from "types";

export const createdCategoriesSelector = ({
  project,
}: {
  project: Project;
}) => {
  const categories = project.categories.filter((category: Category) => {
    return category.id !== UNKNOWN_CATEGORY_ID;
  });

  return categories;
};

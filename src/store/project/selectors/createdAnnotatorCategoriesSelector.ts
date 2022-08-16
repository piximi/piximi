import { Category, UNKNOWN_ANNOTATION_CATEGORY_ID } from "types/Category";
import { sortBy } from "lodash";
import { Project } from "types/Project";

export const createdAnnotatorCategoriesSelector = ({
  project,
}: {
  project: Project;
}) => {
  const categories = project.annotationCategories.filter(
    (category: Category) => {
      return category.id !== UNKNOWN_ANNOTATION_CATEGORY_ID;
    }
  );

  return sortBy(categories, "name");
};

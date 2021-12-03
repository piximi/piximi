import { Project } from "../../types/Project";
import { Image } from "../../types/Image";
import { Category, UNKNOWN_CATEGORY_ID } from "../../types/Category";
import { sortBy } from "underscore";
import { Partition } from "../../types/Partition";

export const predictedCategoriesSelector = ({
  project,
}: {
  project: Project;
}): Array<Category> => {
  const categories: Array<Category> = [];

  project.images.forEach((image: Image) => {
    if (
      image.partition === Partition.Inference &&
      image.categoryId &&
      image.categoryId !== UNKNOWN_CATEGORY_ID
    ) {
      //case where neural net assigned a category to test images

      project.categories.forEach((category: Category) => {
        if (category.id === image.categoryId) {
          categories.push(category); //TODO change name
        }
      });
    }
  });

  return sortBy(categories, "name");
};

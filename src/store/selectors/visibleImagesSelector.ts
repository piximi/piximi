import { Project } from "../../types/Project";
import { Image } from "../../types/Image";
import { Category } from "../../types/Category";

export const visibleImagesSelector = ({
  project,
}: {
  project: Project;
}): Array<Image> => {
  return project.images.filter((image: Image) => {
    const category = project.categories.find((c: Category) => {
      return c.id === image.categoryId;
    });
    return category ? category.visible : true;
  });
};

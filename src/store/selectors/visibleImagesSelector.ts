import { Project } from "../../types/Project";
import { ImageType } from "../../types/ImageType";
import { Category } from "../../types/Category";

export const visibleImagesSelector = ({
  project,
}: {
  project: Project;
}): Array<ImageType> => {
  const visibleImages = project.images.filter((image: ImageType) => {
    const category = project.categories.find((c: Category) => {
      return c.id === image.categoryId;
    });
    return category ? category.visible : true;
  });

  return visibleImages.filter((image: ImageType) => {
    return image.visible;
  });
};

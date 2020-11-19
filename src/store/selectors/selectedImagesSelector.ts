import { Settings } from "../../types/Settings";
import { Project } from "../../types/Project";
import { Image } from "../../types/Image";
import { Category } from "../../types/Category";

export const selectedImagesSelector = ({
  project,
  settings,
}: {
  project: Project;
  settings: Settings;
}): Array<string> => {
  return Array.from(settings.selectedImages).filter((id: string) => {
    const visibleCategories: Array<string> = project.categories
      .filter((category: Category) => {
        return category.visible;
      })
      .map((category: Category) => {
        return category.id;
      });

    return project.images
      .filter((image: Image) => {
        return id === image.id;
      })
      .filter((image: Image) => {
        return image.categoryId && visibleCategories.includes(image.categoryId);
      })
      .map((image) => {
        return image.id;
      });
  });
};

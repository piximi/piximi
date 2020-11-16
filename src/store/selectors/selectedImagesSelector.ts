import { Settings } from "../../types/Settings";
import { Project } from "../../types/Project";
import { Image } from "../../types/Image";

export const selectedImagesSelector = ({
  project,
  settings,
}: {
  project: Project;
  settings: Settings;
}): Array<string> => {
  return Array.from(settings.selectedImages).filter((id: string) => {
    const visible_categories = project.categories
      .filter((category) => category.visible)
      .map((category) => {
        return category.id;
      });

    return project.images
      .filter((image: Image) => {
        return id === image.id;
      })
      .filter((image: Image) => {
        if (image.categoryId) {
          visible_categories.includes(image.categoryId);
        }
      })
      .map((image) => {
        return image.id;
      });
  });
};

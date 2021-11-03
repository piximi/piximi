import { Project } from "../../types/Project";
import { Image } from "../../types/Image";

export const uncategorizedImagesSelector = ({
  project,
}: {
  project: Project;
}): Array<Image> => {
  return project.images.filter((image: Image) => {
    return image.categoryId === "00000000-0000-0000-0000-000000000000";
  });
};

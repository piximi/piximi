import { Image } from "../../types/Image";
import { Project } from "../../types/Project";

export const imagesSelector = ({
  project,
}: {
  project: Project;
}): Array<Image> => {
  return project.images;
};

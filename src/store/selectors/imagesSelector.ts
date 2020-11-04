import { Project } from "../../types/Project";
import { Image } from "../../types/Image";

export const imagesSelector = ({
  project,
}: {
  project: Project;
}): Array<Image> => {
  return project.images;
};

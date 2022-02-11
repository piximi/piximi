import { ImageType } from "../../types/ImageType";
import { Project } from "../../types/Project";

export const imagesSelector = ({
  project,
}: {
  project: Project;
}): Array<ImageType> => {
  return project.images;
};

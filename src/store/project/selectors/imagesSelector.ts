import { ImageType, Project } from "types";

export const imagesSelector = ({
  project,
}: {
  project: Project;
}): Array<ImageType> => {
  return project.images;
};

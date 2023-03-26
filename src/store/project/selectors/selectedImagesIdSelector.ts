import { Project } from "types";

export const selectedImagesIdSelector = ({
  project,
}: {
  project: Project;
}): Array<string> => {
  return project.selectedImageIds;
};

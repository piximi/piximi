import { Project } from "types";

export const selectedImagesSelector = ({
  project,
}: {
  project: Project;
}): Array<string> => {
  return project.selectedImageIds;
};

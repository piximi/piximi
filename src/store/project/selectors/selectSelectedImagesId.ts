import { Project } from "types";

export const selectSelectedImagesId = ({
  project,
}: {
  project: Project;
}): Array<string> => {
  return project.selectedImageIds;
};

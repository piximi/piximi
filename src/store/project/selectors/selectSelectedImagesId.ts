import { ProjectState } from "store/types";

export const selectSelectedImagesId = ({
  project,
}: {
  project: ProjectState;
}): Array<string> => {
  return project.selectedImageIds;
};

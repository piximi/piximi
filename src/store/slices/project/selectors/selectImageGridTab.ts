import { Project, ImageGridTab } from "types";

export const selectImageGridTab = ({
  project,
}: {
  project: Project;
}): ImageGridTab => {
  return project.imageGridTab;
};

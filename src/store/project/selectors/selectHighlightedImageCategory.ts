import { ProjectState } from "store/types";

export const selectHighlightedImageCategory = ({
  project,
}: {
  project: ProjectState;
}) => {
  return project.highlightedCategory;
};

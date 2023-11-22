import { Project } from "types";

export const selectHighlightedImageCategory = ({
  project,
}: {
  project: Project;
}) => {
  return project.highlightedCategory;
};

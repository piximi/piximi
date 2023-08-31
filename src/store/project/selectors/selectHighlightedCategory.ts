import { Project } from "types";

export const selectHighlightedCategory = ({
  project,
}: {
  project: Project;
}) => {
  return project.highlightedCategory;
};

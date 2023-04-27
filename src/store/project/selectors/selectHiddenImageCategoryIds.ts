import { Project } from "types";

export const selectHiddenImageCategoryIds = ({
  project,
}: {
  project: Project;
}) => {
  return project.hiddenImageCategoryIds;
};

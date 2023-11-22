import { Project } from "types";

export const selectFilteredImageCategoryIds = ({
  project,
}: {
  project: Project;
}) => {
  return project.imageFilters.categoryId;
};

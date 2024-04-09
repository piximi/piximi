import { ProjectState } from "store/types";

export const selectFilteredImageCategoryIds = ({
  project,
}: {
  project: ProjectState;
}) => {
  return project.imageFilters.categoryId;
};

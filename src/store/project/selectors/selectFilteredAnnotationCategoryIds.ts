import { ProjectState } from "store/types";

export const selectFilteredAnnotationCategoryIds = ({
  project,
}: {
  project: ProjectState;
}) => {
  return project.annotationFilters.categoryId;
};

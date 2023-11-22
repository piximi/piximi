import { Project } from "types";

export const selectFilteredAnnotationCategoryIds = ({
  project,
}: {
  project: Project;
}) => {
  return project.annotationFilters.categoryId;
};

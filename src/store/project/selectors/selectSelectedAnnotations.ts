import { Project } from "types";

export const selectSelectedAnnotations = ({
  project,
}: {
  project: Project;
}) => {
  return project.selectedAnnotationIds;
};

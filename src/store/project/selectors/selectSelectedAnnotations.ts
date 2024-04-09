import { ProjectState } from "store/types";

export const selectSelectedAnnotations = ({
  project,
}: {
  project: ProjectState;
}) => {
  return project.selectedAnnotationIds;
};

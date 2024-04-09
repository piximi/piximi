import { ProjectState } from "store/types";

export const selectProjectName = ({ project }: { project: ProjectState }) => {
  return project.name;
};

import { Project } from "types";

export const selectProjectName = ({ project }: { project: Project }) => {
  return project.name;
};

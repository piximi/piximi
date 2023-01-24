import { Project } from "types";

export const projectNameSelector = ({ project }: { project: Project }) => {
  return project.name;
};

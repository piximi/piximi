import { Project } from "types";

export const selectLoadPercent = ({ project }: { project: Project }) => {
  return project.loadPercent;
};

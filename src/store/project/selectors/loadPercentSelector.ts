import { Project } from "types";

export const loadPercentSelector = ({ project }: { project: Project }) => {
  return project.loadPercent;
};

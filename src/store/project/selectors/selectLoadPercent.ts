import { ProjectState } from "store/types";

export const selectLoadPercent = ({ project }: { project: ProjectState }) => {
  return project.loadPercent;
};

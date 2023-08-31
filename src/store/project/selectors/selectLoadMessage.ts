import { Project } from "types";

export const selectLoadMessage = ({ project }: { project: Project }) => {
  return project.loadMessage;
};

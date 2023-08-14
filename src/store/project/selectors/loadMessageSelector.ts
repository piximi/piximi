import { Project } from "types";

export const loadMessageSelector = ({ project }: { project: Project }) => {
  return project.loadMessage;
};

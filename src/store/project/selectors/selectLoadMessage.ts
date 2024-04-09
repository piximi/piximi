import { ProjectState } from "store/types";

export const selectLoadMessage = ({ project }: { project: ProjectState }) => {
  return project.loadMessage;
};

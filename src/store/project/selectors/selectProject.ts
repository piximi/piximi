import { ProjectState } from "store/types";

export const selectProject = ({
  project,
}: {
  project: ProjectState;
}): ProjectState => {
  return project;
};

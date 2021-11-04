import { Project } from "../../types/Project";

export const trainFlagSelector = ({
  project,
}: {
  project: Project;
}): number => {
  return project.trainFlag;
};

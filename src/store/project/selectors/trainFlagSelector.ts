import { Project } from "types";

export const trainFlagSelector = ({
  project,
}: {
  project: Project;
}): number => {
  return project.trainFlag;
};

import { Project, Task } from "types";

export const taskSelector = ({ project }: { project: Project }): Task => {
  return project.task;
};

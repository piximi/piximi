import { Project } from "../../types/Project";
import { Task } from "../../types/Task";

export const taskSelector = ({ project }: { project: Project }): Task => {
  return project.task;
};

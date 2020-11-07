import { Project } from "../../types/Project";

export const tileSizeSelector = ({ project }: { project: Project }): number => {
  return project.tileSize;
};

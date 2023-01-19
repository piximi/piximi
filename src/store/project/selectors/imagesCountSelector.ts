import { Project } from "types";

export const imagesCountSelector = ({
  project,
}: {
  project: Project;
}): Number => {
  return project.images.length;
};

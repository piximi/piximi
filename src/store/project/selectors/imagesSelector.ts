import { OldImageType, Project } from "types";

export const imagesSelector = ({
  project,
}: {
  project: Project;
}): Array<OldImageType> => {
  return project.images;
};

import { OldImageType, Partition, Project } from "types";

export const valImagesSelector = ({
  project,
}: {
  project: Project;
}): Array<OldImageType> => {
  return project.images.filter((image: OldImageType) => {
    return image.partition === Partition.Validation;
  });
};

import { OldImageType, Partition, Project } from "types";

export const testImagesSelector = ({
  project,
}: {
  project: Project;
}): Array<OldImageType> => {
  return project.images.filter((image: OldImageType) => {
    return image.partition === Partition.Inference;
  });
};

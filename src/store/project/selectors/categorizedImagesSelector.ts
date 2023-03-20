import { OldImageType, Project, Partition } from "types";

export const categorizedImagesSelector = ({
  project,
}: {
  project: Project;
}): Array<OldImageType> => {
  return project.images.filter((image: OldImageType) => {
    return image.partition !== Partition.Inference;
  });
};

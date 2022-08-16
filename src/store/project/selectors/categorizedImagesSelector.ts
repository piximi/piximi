import { ImageType, Project, Partition } from "types";

export const categorizedImagesSelector = ({
  project,
}: {
  project: Project;
}): Array<ImageType> => {
  return project.images.filter((image: ImageType) => {
    return image.partition !== Partition.Inference;
  });
};

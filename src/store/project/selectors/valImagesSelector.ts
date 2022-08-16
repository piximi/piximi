import { ImageType, Partition, Project } from "types";

export const valImagesSelector = ({
  project,
}: {
  project: Project;
}): Array<ImageType> => {
  return project.images.filter((image: ImageType) => {
    return image.partition === Partition.Validation;
  });
};

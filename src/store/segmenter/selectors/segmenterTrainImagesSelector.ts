import { Project } from "types/Project";
import { OldImageType } from "types/ImageType";
import { Partition } from "types/Partition";

export const segmenterTrainImagesSelector = ({
  project,
}: {
  project: Project;
}): Array<OldImageType> => {
  return project.images.filter((image: OldImageType) => {
    return image.partition === Partition.Training;
  });
};

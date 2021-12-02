import { Project } from "../../types/Project";
import { Image } from "../../types/Image";
import { Partition } from "../../types/Partition";

export const categorizedImagesSelector = ({
  project,
}: {
  project: Project;
}): Array<Image> => {
  return project.images.filter((image: Image) => {
    return image.partition !== Partition.Inference;
  });
};

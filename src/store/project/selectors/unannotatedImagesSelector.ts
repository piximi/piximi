import { Project } from "types/Project";
import { OldImageType } from "types/ImageType";

export const unannotatedImagesSelector = ({
  project,
}: {
  project: Project;
}): Array<OldImageType> => {
  return project.images.filter((image: OldImageType) => {
    return !image.annotations.length;
  });
};

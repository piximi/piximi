import { ImageType, Annotator, Project, ShadowImageType } from "types";

export const annotatorFullImagesSelector = ({
  annotator,
  project,
}: {
  annotator: Annotator;
  project: Project;
}): Array<ImageType> => {
  return annotator.images.map((shadowImage: ShadowImageType) => {
    return (
      project.images.find((im: ImageType) => im.id === shadowImage.id) ||
      (shadowImage as ImageType)
    );
  });
};

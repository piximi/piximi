import { ImageType, Annotator, Project, ShadowImageType } from "types";

export const imageSelector = ({
  annotator,
  project,
}: {
  annotator: Annotator;
  project: Project;
}) => {
  /*
    find the shadow image matching the active image id
    if the corresponding full image exists in project slice
      then return full image from project slice
    else if image only exists in image viewer
      then the shadow image is the full image, so return that
  */

  if (!annotator.images.length) return;

  const image =
    project.images.find((im: ImageType) => {
      return im.id === annotator.activeImageId;
    }) ||
    (annotator.images.find((im: ShadowImageType) => {
      return im.id === annotator.activeImageId;
    }) as ImageType);

  if (!image) return;

  return image;
};

import { ImageType, ImageViewer, Project, ShadowImageType } from "types";

// TODO: image_data - should be called fullImageSelector ?
export const imageSelector = ({
  imageViewer,
  project,
}: {
  imageViewer: ImageViewer;
  project: Project;
}) => {
  /*
    find the shadow image matching the active image id
    if the corresponding full image exists in project slice
      then return full image from project slice
    else if image only exists in image viewer
      then the shadow image is the full image, so return that
  */

  if (!imageViewer.images.length) return;

  // TODO: image_data - bad because project.images image.colors.color is untouchable reference
  const image =
    project.images.find((im: ImageType) => {
      return im.id === imageViewer.activeImageId;
    }) ||
    (imageViewer.images.find((im: ShadowImageType) => {
      return im.id === imageViewer.activeImageId;
    }) as ImageType);

  if (!image) return;

  return image;
};

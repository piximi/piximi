import { ImageType, ImageViewer, Project, ShadowImageType } from "types";

export const imageDataSelector = ({
  imageViewer,
  project,
}: {
  imageViewer: ImageViewer;
  project: Project;
}) => {
  if (!imageViewer.images.length || !imageViewer.activeImageId) return;

  /*
   * return image data from full image in projects,
   * if not in projects, full image in imageViewer,
   * so return image data from there instead
   */
  const image =
    project.images.find((image: ImageType) => {
      return image.id === imageViewer.activeImageId;
    }) ||
    imageViewer.images.find((image: ShadowImageType) => {
      return image.id === imageViewer.activeImageId;
    });

  if (!image) return;

  return image.data;
};

import { ImageType, ImageViewer, Project, ShadowImageType } from "types";

// TODO: image-data - getting original color tensor is bad
export const imageViewerFullImagesSelector = ({
  imageViewer,
  project,
}: {
  imageViewer: ImageViewer;
  project: Project;
}): Array<ImageType> => {
  return imageViewer.images.map((shadowImage: ShadowImageType) => {
    return (
      project.images.find((im: ImageType) => im.id === shadowImage.id) ||
      (shadowImage as ImageType)
    );
  });
};

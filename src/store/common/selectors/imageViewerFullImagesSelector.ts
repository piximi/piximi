import { ImageType, ImageViewer, Project, ShadowImageType } from "types";

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

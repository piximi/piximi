import { ImageViewer, Project, ShadowImageType } from "types";

export const activeImageSelector = ({
  imageViewer,
  project,
}: {
  imageViewer: ImageViewer;
  project: Project;
}): ShadowImageType | undefined => {
  const activeImage = imageViewer.images.find((image: ShadowImageType) => {
    return imageViewer.activeImageId === image.id;
  });

  return activeImage;
};

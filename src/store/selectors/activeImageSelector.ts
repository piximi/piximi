import { ImageViewer } from "../../types/ImageViewer";
import { ShadowImageType } from "../../types/ImageType";
import { Project } from "types/Project";

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

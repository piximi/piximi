import { ImageViewer } from "../../types/ImageViewer";
import { ImageType, ShadowImageType } from "../../types/ImageType";
import { Project } from "types/Project";

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

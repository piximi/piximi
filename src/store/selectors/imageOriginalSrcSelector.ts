import { ImageViewer } from "../../types/ImageViewer";
import { ImageType, ShadowImageType } from "../../types/ImageType";
import { Project } from "types/Project";

export const imageOriginalSrcSelector = ({
  imageViewer,
  project,
}: {
  imageViewer: ImageViewer;
  project: Project;
}) => {
  if (!imageViewer.images.length || !imageViewer.activeImageId) return;

  /*
   * return originalSrc from full image in projects,
   * if not in projects, full image in imageViewer,
   * so return originalSrc from there instead
   */
  const image =
    project.images.find((image: ImageType) => {
      return image.id === imageViewer.activeImageId;
    }) ||
    imageViewer.images.find((image: ShadowImageType) => {
      return image.id === imageViewer.activeImageId;
    });

  if (!image) return;

  return image.originalSrc;
};

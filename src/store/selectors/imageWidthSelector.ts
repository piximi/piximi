import { ImageViewer } from "../../types/ImageViewer";
import { Image } from "../../types/Image";
import { Project } from "../../types/Project";

export const imageWidthSelector = ({
  imageViewer,
  project,
}: {
  imageViewer: ImageViewer;
  project: Project;
}) => {
  if (!project.images.length || !imageViewer.activeImageId) return;

  const image = project.images.filter((image: Image) => {
    return image.id === imageViewer.activeImageId;
  })[0];

  return image.shape.width;
};

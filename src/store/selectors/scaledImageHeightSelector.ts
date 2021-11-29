import { ImageViewer } from "../../types/ImageViewer";
import { Image } from "../../types/Image";
import { Project } from "../../types/Project";

export const scaledImageHeightSelector = ({
  imageViewer,
  project,
}: {
  imageViewer: ImageViewer;
  project: Project;
}) => {
  if (!project.images.length) return;

  const image = project.images.filter((image: Image) => {
    return image.id === imageViewer.activeImageId;
  })[0];

  if (!image) return;

  return image.shape.height * imageViewer.stageScale;
};

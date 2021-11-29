import { ImageViewer } from "../../types/ImageViewer";
import { Image } from "../../types/Image";
import { Project } from "../../types/Project";

export const imageSelector = ({
  imageViewer,
  project,
}: {
  imageViewer: ImageViewer;
  project: Project;
}) => {
  if (!project.images.length) return;

  const image = project.images.find((image: Image) => {
    return image.id === imageViewer.activeImageId;
  });

  if (!image) return;

  return image;
};

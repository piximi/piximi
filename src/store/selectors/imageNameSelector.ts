import { ImageViewer } from "../../types/ImageViewer";
import { ImageType } from "../../types/ImageType";
import { Project } from "../../types/Project";

export const imageNameSelector = ({
  imageViewer,
  project,
}: {
  imageViewer: ImageViewer;
  project: Project;
}) => {
  if (!project.images.length) return;

  const image = project.images.find((image: ImageType) => {
    return image.id === imageViewer.activeImageId;
  });

  if (!image) return;

  return image.name;
};

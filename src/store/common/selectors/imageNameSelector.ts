import { ImageType, ImageViewer, Project } from "types";

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

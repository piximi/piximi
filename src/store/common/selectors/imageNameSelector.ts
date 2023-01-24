import { ImageType, Annotator, Project } from "types";

export const imageNameSelector = ({
  annotator,
  project,
}: {
  annotator: Annotator;
  project: Project;
}) => {
  if (!project.images.length) return;

  const image = project.images.find((image: ImageType) => {
    return image.id === annotator.activeImageId;
  });

  if (!image) return;

  return image.name;
};

import { OldImageType, Annotator, Project } from "types";

export const imageNameSelector = ({
  annotator,
  project,
}: {
  annotator: Annotator;
  project: Project;
}) => {
  if (!project.images.length) return;

  const image = project.images.find((image: OldImageType) => {
    return image.id === annotator.activeImageId;
  });

  if (!image) return;

  return image.name;
};

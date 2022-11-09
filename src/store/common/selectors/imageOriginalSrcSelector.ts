import { ImageType, Annotator, Project, ShadowImageType } from "types";

export const imageOriginalSrcSelector = ({
  annotator,
  project,
}: {
  annotator: Annotator;
  project: Project;
}) => {
  if (!annotator.images.length || !annotator.activeImageId) return;

  /*
   * return originalSrc from full image in projects,
   * if not in projects, full image in annotator,
   * so return originalSrc from there instead
   */
  const image =
    project.images.find((image: ImageType) => {
      return image.id === annotator.activeImageId;
    }) ||
    annotator.images.find((image: ShadowImageType) => {
      return image.id === annotator.activeImageId;
    });

  if (!image) return;

  return image.originalSrc;
};

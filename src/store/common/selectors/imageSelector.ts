import { ImageType, Annotator, Project, ShadowImageType } from "types";

// TODO: post PR #407 - should be called fullImageSelector ?
export const imageSelector = ({
  annotator,
  project,
}: {
  annotator: Annotator;
  project: Project;
}) => {
  /*
    find the shadow image matching the active image id
    if the corresponding full image exists in project slice
      then return full image from project slice
    else if image only exists in image viewer
      then the shadow image is the full image, so return that
  */

  let activeImageId: string;
  if (!annotator.images.length || !annotator.activeImageId) {
    return;
  } else {
    activeImageId = annotator.activeImageId;
  }

  const image = annotator.images.find((im: ShadowImageType) => {
    return im.id === activeImageId;
  }) as ShadowImageType;

  if (!image.data) {
    const projectImage = project.images.find((im: ImageType) => {
      return im.id === activeImageId;
    }) as ImageType;

    // can't just return project image directly because
    // imageViewer image has cloned color tensor
    return {
      ...projectImage,
      ...image,
      data: projectImage.data.clone(),
    } as ImageType;
  }

  return image as ImageType;
};

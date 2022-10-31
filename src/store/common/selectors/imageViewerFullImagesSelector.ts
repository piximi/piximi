import { ImageType, ImageViewer, Project, ShadowImageType } from "types";

export const imageViewerFullImagesSelector = ({
  imageViewer,
  project,
}: {
  imageViewer: ImageViewer;
  project: Project;
}): Array<ImageType> => {
  return imageViewer.images.map((shadowImage: ShadowImageType) => {
    const projectImage = project.images.find(
      (im: ImageType) => im.id === shadowImage.id
    );

    if (projectImage) {
      // can't return project image directly since
      // image viewer image has its own color tensor
      return {
        ...projectImage,
        ...shadowImage,
        data: projectImage.data.clone(),
      };
    } else {
      return shadowImage as ImageType;
    }
  });
};

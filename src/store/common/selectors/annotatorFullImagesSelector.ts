import { OldImageType, Annotator, Project, ShadowImageType } from "types";

export const annotatorFullImagesSelector = ({
  annotator,
  project,
}: {
  annotator: Annotator;
  project: Project;
}): Array<OldImageType> => {
  return annotator.images.map((shadowImage: ShadowImageType) => {
    const projectImage = project.images.find(
      (im: OldImageType) => im.id === shadowImage.id
    );

    if (projectImage) {
      // can't return project image directly since
      // image viewer image has its own color tensor
      return {
        ...projectImage,
        ...shadowImage,
        // TODO: COCO - disabled, possibly memory leak
        // data: projectImage.data.clone(),
      };
    } else {
      return shadowImage as OldImageType;
    }
  });
};

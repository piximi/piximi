import {
  OldImageType,
  Annotator,
  ShadowImageType,
  DataStoreSlice,
  ImageType,
} from "types";

export const annotatorFullImagesSelector = ({
  annotator,
  data,
}: {
  annotator: Annotator;
  data: DataStoreSlice;
}): Array<OldImageType> => {
  return annotator.images.map((shadowImage: ShadowImageType) => {
    const projectImage = Object.values(data.images.entities).find(
      (im: ImageType) => im.id === shadowImage.id
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

import { ImageViewer } from "types/ImageViewer";
import { Category } from "types/Category";
import { ImageType, ShadowImageType } from "types/ImageType";
import { Project } from "types/Project";

import { SerializedFileType, SerializedAnnotationType } from "types";

export const activeSerializedAnnotationsSelector = ({
  imageViewer,
  project,
}: {
  imageViewer: ImageViewer;
  project: Project;
}): SerializedFileType | undefined => {
  if (!imageViewer.images.length) return undefined;

  /*
    Find full image in project slice, else if not there
    full image is in imageViewer slice, return from there
  */
  const image =
    project.images.find((image: ImageType) => {
      return image.id === imageViewer.activeImageId;
    }) ||
    (imageViewer.images.find((image: ShadowImageType) => {
      return image.id === imageViewer.activeImageId;
    }) as ImageType);

  if (!image) return undefined;

  const categoriesFound: { [categoryId: string]: Category } = {};

  const annotations: Array<SerializedAnnotationType> = [];

  for (const annotation of image.annotations) {
    const index = project.annotationCategories.findIndex(
      (category: Category) => {
        return category.id === annotation.categoryId;
      }
    );

    const category = project.annotationCategories[index];

    if (categoriesFound[category.id] === undefined) {
      categoriesFound[category.id] = category;
    }

    annotations.push({
      categoryId: category.id,
      id: annotation.id,
      mask: annotation.mask.join(" "),
      boundingBox: [...annotation.boundingBox],
      plane: annotation.plane,
    });
  }

  const categories: Array<Category> = Object.values(categoriesFound);

  return { annotations, categories };
};

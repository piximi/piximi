import { Category, ShadowImageType, SerializedAnnotationType } from "types";

export const serializeProject = (
  images: Array<ShadowImageType>,
  categories: Array<Category>
) => {
  const serializedImages = images.map((im) => ({ id: im.id, name: im.name }));

  const serializedCategories = categories.map((cat) => ({
    id: cat.id,
    color: cat.color,
    name: cat.name,
    visible: cat.visible,
  }));

  const serializedAnnotations: Array<SerializedAnnotationType> = [];

  for (const im of images) {
    for (const ann of im.annotations) {
      serializedAnnotations.push({
        categoryId: ann.categoryId,
        imageId: im.id,
        id: ann.id,
        mask: ann.encodedMask!.join(" "),
        plane: ann.plane,
        boundingBox: ann.boundingBox,
      });
    }
  }

  return {
    categories: serializedCategories,
    images: serializedImages,
    annotations: serializedAnnotations,
  };
};

import {
  Category,
  SerializedAnnotationType,
  ImageType,
  AnnotationType,
} from "types";

export const serializeProject = (
  images: Array<ImageType>,
  annotations: Array<AnnotationType>,
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

  for (const ann of annotations) {
    serializedAnnotations.push({
      categoryId: ann.categoryId,
      imageId: ann.imageId,
      id: ann.id,
      mask: ann.encodedMask!.join(" "),
      plane: ann.plane,
      boundingBox: ann.boundingBox,
    });
  }

  return {
    categories: serializedCategories,
    images: serializedImages,
    annotations: serializedAnnotations,
  };
};

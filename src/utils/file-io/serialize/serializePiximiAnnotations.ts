import {
  Kind,
  AnnotationObject,
  Category,
  ImageObject,
} from "store/data/types";
import { NewSerializedAnnotationType } from "../types";

export const serializePiximiAnnotations = (
  images: Array<ImageObject>,
  annotations: Array<AnnotationObject>,
  categories: Array<Category>,
  kinds: Array<Kind>
) => {
  const piximiVersion = process.env.REACT_APP_VERSION;

  const serializedImages = images.map((im) => ({ id: im.id, name: im.name }));

  /*
    serializedCategories and serializedKinds are mapped to make sure serialization remains consitent even if data structure changes.
    If serialization needs to change, update REACT_APP_VERSION
  */
  const serializedCategories = categories.map((cat) => ({
    id: cat.id,
    color: cat.color,
    name: cat.name,
    visible: cat.visible,
    kind: cat.kind,
    containing: cat.containing,
  }));

  const serializedKinds = kinds.map((kind) => ({
    id: kind.id,
    containing: kind.containing,
    categories: kind.categories,
    unknownCategoryId: kind.unknownCategoryId,
  }));

  const serializedAnnotations: Array<NewSerializedAnnotationType> = [];

  for (const ann of annotations) {
    serializedAnnotations.push({
      categoryId: ann.categoryId,
      imageId: ann.imageId,
      id: ann.id,
      name: ann.name,
      mask: ann.encodedMask.join(" "),
      activePlane: ann.activePlane,
      boundingBox: ann.boundingBox,
      partition: ann.partition,
      kind: ann.kind,
      shape: Object.values(ann.shape),
    });
  }

  return {
    version: piximiVersion!,
    categories: serializedCategories,
    images: serializedImages,
    annotations: serializedAnnotations,
    kinds: serializedKinds,
  };
};

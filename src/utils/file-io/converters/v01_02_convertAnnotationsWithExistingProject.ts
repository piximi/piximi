import Image from "image-js";
import { intersection } from "lodash";
import { ShapeArray } from "store/data/types";
import { getPropertiesFromImageSync } from "store/data/utils";
import { logger } from "utils/logUtils";
import { convertArrayToShape } from "utils/models/utils";

import {
  V01_AnnotationObject,
  V01_Category,
  V02AnnotationObject,
  V02Category,
  V02ImageObject,
  V02Kind,
} from "../types";
import { v02GenerateKind } from "../utils";

export const v01_02_convertAnnotationsWithExistingProject = async (
  existingImages: Record<string, V02ImageObject>,
  existingKinds: Record<string, V02Kind>,
  oldAnnotations: V01_AnnotationObject[],
  oldAnnotationCategories: V01_Category[],
) => {
  const catId2Name: Record<string, string> = {};
  const newKinds: Record<string, V02Kind> = {};
  const newCategories: Record<string, V02Category> = {};
  const newAnnotations: V02AnnotationObject[] = [];
  const imageMap: Record<string, Image> = {};

  oldAnnotationCategories.forEach((anCat) => {
    catId2Name[anCat.id] = anCat.name;
    if (!(anCat.name in existingKinds) && !(anCat.name in newKinds)) {
      const { kind: anKind, unknownCategory: newUnknownCategory } =
        v02GenerateKind(anCat.name);
      newCategories[newUnknownCategory.id] = newUnknownCategory;

      newKinds[anKind.id] = anKind;
    }
  });
  for await (const ann of oldAnnotations) {
    const newAnn: Partial<V02AnnotationObject> = { ...ann };
    const existingImage = existingImages[ann.imageId];
    if (!existingImage) {
      logger(`No image found for annotation: ${ann.id}\nskipping`);
      continue;
    }
    const newKindName = catId2Name[ann.categoryId];
    if (!newKindName) {
      logger(`No category found for annotation: ${ann.id}\nskipping`);
      continue;
    }
    const kind = existingKinds[newKindName] ?? newKinds[newKindName];
    if (!kind) {
      logger(`No kind found for annotation: ${ann.id}\nskipping`);
      continue;
    }
    newAnn.kind = kind.id;
    newAnn.categoryId = kind.unknownCategoryId;
    const numAnns = intersection(
      existingImage.containing,
      kind.containing,
    ).length;
    newAnn.name = `${existingImage.name}-${kind.id}_${numAnns}`;
    let renderedIm: Image;
    if (imageMap[existingImage.id]) {
      renderedIm = imageMap[existingImage.id];
    } else {
      renderedIm = await Image.load(existingImage.src);
      imageMap[existingImage.id] = renderedIm;
    }
    const imageProperties = getPropertiesFromImageSync(
      renderedIm,
      existingImage,
      ann,
    );
    Object.assign(newAnn, imageProperties);
    newAnn.shape = convertArrayToShape(newAnn.data!.shape as ShapeArray);
    newAnnotations.push(newAnn as V02AnnotationObject);
  }
  return {
    newAnnotations,
    newCategories: Object.values(newCategories),
    newKinds: Object.values(newKinds),
  };
};

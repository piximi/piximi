import Image from "image-js";
import { intersection } from "lodash";

import {
  AnnotationTypeV01,
  CategoryV01,
} from "utils/file-io/deserialize/v01/types";
import {
  KindV02,
  AnnotationObjectV02,
  CategoryV02,
  ImageObjectV02,
  ShapeArrayV02,
} from "utils/file-io/deserialize/v02/types";
import { logger } from "utils/logUtils";
import { convertArrayToShape } from "utils/dl/utils";
import { generateUUID } from "store/dataV2/utils";
import { tensor2d, image as tfImage } from "@tensorflow/tfjs";
import { UNKNOWN_IMAGE_CATEGORY_COLOR } from "store/dataV2/constants";

export const UNKNOWN_CATEGORY_NAME: string = "Unknown";
const generateUnknownCategory = (kind: string) => {
  const unknownCategoryId = generateUUID({ definesUnknown: true });
  const unknownCategory: CategoryV02 = {
    id: unknownCategoryId,
    name: UNKNOWN_CATEGORY_NAME,
    color: UNKNOWN_IMAGE_CATEGORY_COLOR,
    containing: [],
    kind: kind,
    visible: true,
  };
  return unknownCategory;
};
export const generateKind = (kindName: string, useUUID?: boolean) => {
  const kindId = useUUID ? generateUUID() : kindName;
  const unknownCategory = generateUnknownCategory(kindId);
  const kind: KindV02 = {
    id: kindId,
    displayName: kindName,
    categories: [unknownCategory.id],
    unknownCategoryId: unknownCategory.id,
    containing: [],
  };
  return { kind, unknownCategory };
};

export const getPropertiesFromImageSync = (
  renderedIm: Image,
  image: ImageObjectV02,
  annotation: { boundingBox: number[] },
) => {
  const normalizingWidth = image.shape.width - 1;
  const normalizingHeight = image.shape.height - 1;
  const bbox = annotation.boundingBox;
  const x1 = bbox[0] / normalizingWidth;
  const x2 = bbox[2] / normalizingWidth;
  const y1 = bbox[1] / normalizingHeight;
  const y2 = bbox[3] / normalizingHeight;
  const box = tensor2d([[y1, x1, y2, x2]]);
  const width = bbox[2] - bbox[0];
  const height = bbox[3] - bbox[1];
  const objectImage = renderedIm.crop({
    x: Math.abs(bbox[0]),
    y: Math.abs(bbox[1]),
    width: Math.abs(Math.min(image.shape.width, bbox[2]) - bbox[0]),
    height: Math.abs(Math.min(image.shape.height, bbox[3]) - bbox[1]),
  });
  const objSrc = objectImage.getCanvas().toDataURL();
  const data = tfImage.cropAndResize(image.data, box, [0], [height, width]);
  box.dispose();

  return {
    data: data,
    src: objSrc,
    imageId: image.id,
    boundingBox: bbox as [number, number, number, number],
    bitDepth: image.bitDepth,
  };
};
export const convertAnnotationsWithExistingProject_v01v02 = async (
  existingImages: Record<string, ImageObjectV02>,
  existingKinds: Record<string, KindV02>,
  oldAnnotations: AnnotationTypeV01[],
  oldAnnotationCategories: CategoryV01[],
) => {
  const catId2Name: Record<string, string> = {};
  const newKinds: Record<string, KindV02> = {};
  const newCategories: Record<string, CategoryV02> = {};
  const newAnnotations: AnnotationObjectV02[] = [];
  const imageMap: Record<string, Image> = {};

  oldAnnotationCategories.forEach((anCat) => {
    catId2Name[anCat.id] = anCat.name;
    if (!(anCat.name in existingKinds) && !(anCat.name in newKinds)) {
      const { kind: anKind, unknownCategory: newUnknownCategory } =
        generateKind(anCat.name);
      newCategories[newUnknownCategory.id] = newUnknownCategory;

      newKinds[anKind.id] = anKind;
    }
  });
  for await (const ann of oldAnnotations) {
    const newAnn: Partial<AnnotationObjectV02> = { ...ann };
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
    newAnn.shape = convertArrayToShape(newAnn.data!.shape as ShapeArrayV02);
    newAnnotations.push(newAnn as AnnotationObjectV02);
  }
  return {
    newAnnotations,
    newCategories: Object.values(newCategories),
    newKinds: Object.values(newKinds),
  };
};

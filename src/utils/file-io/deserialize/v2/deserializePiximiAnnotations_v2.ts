import { convertArrayToShape, generateUUID } from "utils/common/helpers";
import { getPropertiesFromImage } from "utils/common/image/imageHelper";

import {
  SerializedFileTypeV2,
  SerializedAnnotatorImageType,
  ShapeArray,
  PartialBy,
  Partition,
} from "types";
import { Kind, NewCategory } from "types/Category";
import {
  NewAnnotationType,
  NewImageType,
  NewSerializedAnnotationType,
} from "types/ThingType";

type KindMap = Record<string, { new: Kind; existing?: Kind }>;
type CategoryMap = Record<string, { new: NewCategory; existing?: NewCategory }>;
type ImageMap = Record<
  string,
  { new: SerializedAnnotatorImageType; existing?: NewImageType }
>;

export const deserializeAnnotations = (
  serializedAnnotations: Array<NewSerializedAnnotationType>,
  imageId: string
) => {
  const annotations: Array<
    PartialBy<NewAnnotationType, "bitDepth" | "data" | "src">
  > = [];

  for (const annotation of serializedAnnotations) {
    annotations.push({
      id: generateUUID(),
      kind: annotation.kind,
      name: annotation.name,
      encodedMask: annotation.mask.split(" ").map((e) => Number(e)),
      activePlane: annotation.activePlane,
      boundingBox: annotation.boundingBox as [number, number, number, number],
      shape: convertArrayToShape(annotation.shape as ShapeArray),
      categoryId: annotation.categoryId,
      partition: annotation.partition as Partition,
      imageId,
    });
  }

  return annotations;
};

const reconcileKinds = (
  existingKinds: Array<Kind>,
  serializedKinds: Array<Kind>
) => {
  const kindMap: KindMap = {};

  serializedKinds.forEach((kind) => {
    const existingKind = existingKinds.find((k) => kind.id === k.id);
    kindMap[kind.id] = { new: kind };
    if (existingKind) {
      kindMap[kind.id].existing = existingKind;
    }
  });

  return kindMap;
};

const reconcileCategories = (
  existingCategories: Array<NewCategory>,
  serializedCategories: Array<NewCategory>
) => {
  const categoryMap: CategoryMap = {};
  serializedCategories.forEach((category) => {
    const existingCategory = existingCategories.find(
      (c) => category.name === c.name && category.kind === c.kind
    );
    categoryMap[category.id] = { new: category };
    if (existingCategory) {
      categoryMap[category.id].existing = existingCategory;
    }
  });
  return categoryMap;
};

const reconcileImages = (
  existingImages: Array<NewImageType>,
  serializedImages: Array<SerializedAnnotatorImageType>
) => {
  const imageMap: ImageMap = {};
  serializedImages.forEach((image) => {
    const existingImage = existingImages.find((i) => image.name === i.name);
    imageMap[image.id] = { new: image };
    if (existingImage) {
      imageMap[image.id].existing = existingImage;
    }
  });
  return imageMap;
};

export const deserializePiximiAnnotations_v2 = async (
  serializedProject: SerializedFileTypeV2,
  existingImages: Array<NewImageType>,
  existingCategories: Array<NewCategory>,
  existingKinds: Array<Kind>
) => {
  // this must come first
  const imageMap = reconcileImages(existingImages, serializedProject.images);

  const kindMap = reconcileKinds(existingKinds, serializedProject.kinds);

  const catMap = reconcileCategories(
    existingCategories,
    serializedProject.categories
  );

  const reconciledAnnotations: NewAnnotationType[] = [];
  const kindsToReconcile: Record<string, Kind> = {};
  const categoriesToReconcile: Record<string, NewCategory> = {};

  for await (let annotation of serializedProject.annotations) {
    const annImage = imageMap[annotation.imageId];
    const category = catMap[annotation.categoryId];
    const kind = kindMap[annotation.kind];
    let appliedUnknownCategory = false;

    /*
      HANDLE IMAGE
    */
    // If no existing image we cant build the annotation
    if (!annImage.existing) continue;
    const image = annImage.existing;
    const annPropsFromIm = await getPropertiesFromImage(image, annotation);
    annotation = { ...annotation, ...annPropsFromIm };

    /*
      HANDLE KIND
    */

    if (kind.existing) {
      const existingKind = kind.existing;
      if (annotation.categoryId === kind.new.unknownCategoryId) {
        annotation.categoryId = existingKind.unknownCategoryId;
        appliedUnknownCategory = true;
      }
    } else {
      const newKind = kind.new;
      if (!(newKind.id in kindsToReconcile)) {
        kindsToReconcile[newKind.id] = newKind;
      }
    }

    /*
      HANDLE CATEGORY
    */
    if (!appliedUnknownCategory) {
      if (category.existing) {
        const existingCat = category.existing;
        annotation.categoryId = existingCat.id;
      } else {
        const newCategory = category.new;
        if (!(newCategory.id in categoriesToReconcile))
          categoriesToReconcile[newCategory.id] = newCategory;
      }
    }

    const annotationShape = convertArrayToShape(annotation.shape as ShapeArray);
    const annotationEncoding = annotation.mask.split(" ").map((e) => +e);
    const { mask, ...deserializedAnnotation } = {
      ...annotation,
      shape: annotationShape,
      encodedMask: annotationEncoding,
    };
    reconciledAnnotations.push(deserializedAnnotation as NewAnnotationType);
  }

  return {
    annotations: reconciledAnnotations,
    newKinds: Object.values(kindsToReconcile),
    newCategories: Object.values(categoriesToReconcile),
  };
};

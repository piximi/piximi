import { getPropertiesFromImage } from "store/data/utils";
import { convertArrayToShape } from "utils/models/utils";
import { generateUUID } from "store/data/utils";
import { Partition } from "utils/models/enums";
import {
  V02_SerializedAnnotationType,
  SerializedAnnotatorImageType,
  SerializedFileTypeV02,
  V02AnnotationObject,
  V02Kind,
  V02Category,
  V02ImageObject,
} from "../../types";
import { PartialBy } from "utils/types";
import { ShapeArray } from "store/data/types";

type V02KindMap = Record<string, { new: V02Kind; existing?: V02Kind }>;
type V02CategoryMap = Record<
  string,
  { new: V02Category; existing?: V02Category }
>;
type ImageMap = Record<
  string,
  { new: SerializedAnnotatorImageType; existing?: V02ImageObject }
>;

export const v02_deserializeAnnotations = (
  serializedAnnotations: Array<V02_SerializedAnnotationType>,
  imageId: string,
) => {
  const annotations: Array<
    PartialBy<V02AnnotationObject, "bitDepth" | "data" | "src">
  > = [];

  for (const annotation of serializedAnnotations) {
    annotations.push({
      id: generateUUID(),
      kind: annotation.kind,
      name: annotation.name,
      encodedMask: annotation.mask.split(" ").map((e) => Number(e)),
      plane: annotation.activePlane,
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

const reconcileV02Kinds = (
  existingV02Kinds: Array<V02Kind>,
  serializedV02Kinds: Array<V02Kind>,
) => {
  const kindMap: V02KindMap = {};

  serializedV02Kinds.forEach((kind) => {
    const existingV02Kind = existingV02Kinds.find((k) => kind.id === k.id);
    kindMap[kind.id] = { new: kind };
    if (existingV02Kind) {
      kindMap[kind.id].existing = existingV02Kind;
    }
  });

  return kindMap;
};

const reconcileCategories = (
  existingCategories: Array<V02Category>,
  serializedCategories: Array<V02Category>,
) => {
  const categoryMap: V02CategoryMap = {};
  serializedCategories.forEach((category) => {
    const existingCategory = existingCategories.find(
      (c) => category.name === c.name && category.kind === c.kind,
    );
    categoryMap[category.id] = { new: category };
    if (existingCategory) {
      categoryMap[category.id].existing = existingCategory;
    }
  });
  return categoryMap;
};

const reconcileImages = (
  existingImages: Array<V02ImageObject>,
  serializedImages: Array<SerializedAnnotatorImageType>,
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

export const v02_deserializePiximiAnnotations = async (
  serializedProject: SerializedFileTypeV02,
  existingImages: Array<V02ImageObject>,
  existingCategories: Array<V02Category>,
  existingV02Kinds: Array<V02Kind>,
) => {
  // this must come first
  const imageMap = reconcileImages(existingImages, serializedProject.images);

  const kindMap = reconcileV02Kinds(existingV02Kinds, serializedProject.kinds);

  const catMap = reconcileCategories(
    existingCategories,
    serializedProject.categories,
  );

  const reconciledAnnotations: V02AnnotationObject[] = [];
  const kindsToReconcile: Record<string, V02Kind> = {};
  const categoriesToReconcile: Record<string, V02Category> = {};

  for await (const annotation of serializedProject.annotations) {
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
    const annPropsFromIm = await getPropertiesFromImage(image, {
      boundingBox: annotation.boundingBox as [number, number, number, number],
    });
    const expandedAnnotation = { ...annotation, ...annPropsFromIm };

    /*
      HANDLE KIND
    */

    if (kind.existing) {
      const existingV02Kind = kind.existing;
      if (expandedAnnotation.categoryId === kind.new.unknownCategoryId) {
        expandedAnnotation.categoryId = existingV02Kind.unknownCategoryId;
        appliedUnknownCategory = true;
      }
    } else {
      const newV02Kind = kind.new;
      if (!(newV02Kind.id in kindsToReconcile)) {
        kindsToReconcile[newV02Kind.id] = newV02Kind;
      }
    }

    /*
      HANDLE CATEGORY
    */
    if (!appliedUnknownCategory) {
      if (category.existing) {
        const existingCat = category.existing;
        expandedAnnotation.categoryId = existingCat.id;
      } else {
        const newCategory = category.new;
        if (!(newCategory.id in categoriesToReconcile))
          categoriesToReconcile[newCategory.id] = newCategory;
      }
    }

    const annotationShape = convertArrayToShape(
      expandedAnnotation.shape as ShapeArray,
    );
    const annotationEncoding = expandedAnnotation.mask
      .split(" ")
      .map((e) => +e);
    const { mask: _mask, ...deserializedAnnotation } = {
      ...expandedAnnotation,
      shape: annotationShape,
      encodedMask: annotationEncoding,
      plane: expandedAnnotation.activePlane,
      bitDepth: image.bitDepth,
    };
    reconciledAnnotations.push(deserializedAnnotation as V02AnnotationObject);
  }

  return {
    annotations: reconciledAnnotations,
    newV02Kinds: Object.values(kindsToReconcile),
    newCategories: Object.values(categoriesToReconcile),
  };
};

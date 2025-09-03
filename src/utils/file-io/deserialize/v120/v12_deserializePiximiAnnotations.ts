import { getPropertiesFromImage } from "store/data/utils";
import { convertArrayToShape } from "utils/models/utils";
import { generateUUID } from "store/data/utils";
import { Partition } from "utils/models/enums";
import {
  SerializedAnnotatorImageType,
  SerializedFileTypeV12,
  V12_SerializedAnnotationType,
  V12AnnotationObject,
  V12Category,
  V12GeneralizedKindItem,
  V12Kind,
} from "../../types";
import { PartialBy } from "utils/types";
import { ShapeArray } from "store/data/types";

type V12KindMap = Record<string, { new: V12Kind; existing?: V12Kind }>;
type V12CategoryMap = Record<
  string,
  { new: V12Category; existing?: V12Category }
>;
type ImageMap = Record<
  string,
  { new: SerializedAnnotatorImageType; existing?: V12GeneralizedKindItem }
>;

export const v12_deserializeAnnotations = (
  serializedAnnotations: Array<V12_SerializedAnnotationType>,
  imageId: string,
) => {
  const annotations: Array<
    PartialBy<V12AnnotationObject, "bitDepth" | "data" | "src">
  > = [];

  for (const annotation of serializedAnnotations) {
    annotations.push({
      id: generateUUID(),
      kind: annotation.kind,
      name: annotation.name,
      encodedMask: annotation.mask.split(" ").map((e) => Number(e)),
      plane: annotation.plane,
      timepoint: +annotation.timepoint,
      boundingBox: annotation.boundingBox as [number, number, number, number],
      shape: convertArrayToShape(annotation.shape as ShapeArray),
      categoryId: annotation.categoryId,
      partition: annotation.partition as Partition,
      imageId,
    });
  }

  return annotations;
};

const reconcileV12Kinds = (
  existingV12Kinds: Array<V12Kind>,
  serializedV12Kinds: Array<V12Kind>,
) => {
  const kindMap: V12KindMap = {};

  serializedV12Kinds.forEach((kind) => {
    const existingV12Kind = existingV12Kinds.find((k) => kind.id === k.id);
    kindMap[kind.id] = { new: kind };
    if (existingV12Kind) {
      kindMap[kind.id].existing = existingV12Kind;
    }
  });

  return kindMap;
};

const reconcileCategories = (
  existingCategories: Array<V12Category>,
  serializedCategories: Array<V12Category>,
) => {
  const categoryMap: V12CategoryMap = {};
  serializedCategories.forEach((category) => {
    const existingV12Category = existingCategories.find(
      (c) => category.name === c.name && category.kind === c.kind,
    );
    categoryMap[category.id] = { new: category };
    if (existingV12Category) {
      categoryMap[category.id].existing = existingV12Category;
    }
  });
  return categoryMap;
};

const reconcileImages = (
  existingImages: Array<V12GeneralizedKindItem>,
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

export const v12_deserializePiximiAnnotations = async (
  serializedProject: SerializedFileTypeV12,
  existingImages: Array<V12GeneralizedKindItem>,
  existingCategories: Array<V12Category>,
  existingV12Kinds: Array<V12Kind>,
) => {
  // this must come first
  const imageMap = reconcileImages(existingImages, serializedProject.images);

  const kindMap = reconcileV12Kinds(existingV12Kinds, serializedProject.kinds);

  const catMap = reconcileCategories(
    existingCategories,
    serializedProject.categories,
  );

  const reconciledAnnotations: V12AnnotationObject[] = [];
  const kindsToReconcile: Record<string, V12Kind> = {};
  const categoriesToReconcile: Record<string, V12Category> = {};

  for await (const annotation of serializedProject.annotations) {
    const annImage = imageMap[annotation.imageId];
    const category = catMap[annotation.categoryId];
    const kind = kindMap[annotation.kind];
    let appliedUnknownV12Category = false;

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
      const existingV12Kind = kind.existing;
      if (expandedAnnotation.categoryId === kind.new.unknownCategoryId) {
        expandedAnnotation.categoryId = existingV12Kind.unknownCategoryId;
        appliedUnknownV12Category = true;
      }
    } else {
      const newV12Kind = kind.new;
      if (!(newV12Kind.id in kindsToReconcile)) {
        kindsToReconcile[newV12Kind.id] = newV12Kind;
      }
    }

    /*
      HANDLE CATEGORY
    */
    if (!appliedUnknownV12Category) {
      if (category.existing) {
        const existingCat = category.existing;
        expandedAnnotation.categoryId = existingCat.id;
      } else {
        const newV12Category = category.new;
        if (!(newV12Category.id in categoriesToReconcile))
          categoriesToReconcile[newV12Category.id] = newV12Category;
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
      plane: expandedAnnotation.plane,
      bitDepth: image.bitDepth,
    };
    reconciledAnnotations.push(deserializedAnnotation as V12AnnotationObject);
  }

  return {
    annotations: reconciledAnnotations,
    newV12Kinds: Object.values(kindsToReconcile),
    newCategories: Object.values(categoriesToReconcile),
  };
};

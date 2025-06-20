import { getPropertiesFromImage } from "store/data/utils";
import { convertArrayToShape } from "utils/models/utils";
import { generateUUID } from "store/data/utils";
import { Partition } from "utils/models/enums";
import {
  V02_SerializedAnnotationType,
  SerializedAnnotatorImageType,
  SerializedFileTypeV02,
  V02AnnotationObject,
} from "../../types";
import { PartialBy } from "utils/types";
import { Kind, Category, ImageObject, ShapeArray } from "store/data/types";

type KindMap = Record<string, { new: Kind; existing?: Kind }>;
type CategoryMap = Record<string, { new: Category; existing?: Category }>;
type ImageMap = Record<
  string,
  { new: SerializedAnnotatorImageType; existing?: ImageObject }
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

const reconcileKinds = (
  existingKinds: Array<Kind>,
  serializedKinds: Array<Kind>,
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
  existingCategories: Array<Category>,
  serializedCategories: Array<Category>,
) => {
  const categoryMap: CategoryMap = {};
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
  existingImages: Array<ImageObject>,
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
  existingImages: Array<ImageObject>,
  existingCategories: Array<Category>,
  existingKinds: Array<Kind>,
) => {
  // this must come first
  const imageMap = reconcileImages(existingImages, serializedProject.images);

  const kindMap = reconcileKinds(existingKinds, serializedProject.kinds);

  const catMap = reconcileCategories(
    existingCategories,
    serializedProject.categories,
  );

  const reconciledAnnotations: V02AnnotationObject[] = [];
  const kindsToReconcile: Record<string, Kind> = {};
  const categoriesToReconcile: Record<string, Category> = {};

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
      const existingKind = kind.existing;
      if (expandedAnnotation.categoryId === kind.new.unknownCategoryId) {
        expandedAnnotation.categoryId = existingKind.unknownCategoryId;
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
    newKinds: Object.values(kindsToReconcile),
    newCategories: Object.values(categoriesToReconcile),
  };
};

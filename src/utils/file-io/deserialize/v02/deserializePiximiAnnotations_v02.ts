import { getPropertiesFromImage } from "store/data/utils";
import { convertArrayToShape } from "utils/modelsV2/utils";
import {
  SerializedAnnotatorImageType,
  SerializedFileTypeV02,
} from "../../types";
import {
  KindV02,
  AnnotationObjectV02,
  CategoryV02,
  ImageObjectV02,
  ShapeArrayV02,
} from "./types";

type KindMap = Record<string, { new: KindV02; existing?: KindV02 }>;
type CategoryMap = Record<string, { new: CategoryV02; existing?: CategoryV02 }>;
type ImageMap = Record<
  string,
  { new: SerializedAnnotatorImageType; existing?: ImageObjectV02 }
>;

const reconcileKinds = (
  existingKinds: Array<KindV02>,
  serializedKinds: Array<KindV02>,
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
  existingCategories: Array<CategoryV02>,
  serializedCategories: Array<CategoryV02>,
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
  existingImages: Array<ImageObjectV02>,
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

export const deserializePiximiAnnotations_v02 = async (
  serializedProject: SerializedFileTypeV02,
  existingImages: Array<ImageObjectV02>,
  existingCategories: Array<CategoryV02>,
  existingKinds: Array<KindV02>,
) => {
  // this must come first
  const imageMap = reconcileImages(existingImages, serializedProject.images);

  const kindMap = reconcileKinds(existingKinds, serializedProject.kinds);

  const catMap = reconcileCategories(
    existingCategories,
    serializedProject.categories,
  );

  const reconciledAnnotations: AnnotationObjectV02[] = [];
  const kindsToReconcile: Record<string, KindV02> = {};
  const categoriesToReconcile: Record<string, CategoryV02> = {};

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
    const annPropsFromIm = await getPropertiesFromImage(image, {
      boundingBox: annotation.boundingBox as [number, number, number, number],
    });
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

    const annotationShape = convertArrayToShape(
      annotation.shape as ShapeArrayV02,
    );
    const annotationEncoding = annotation.mask.split(" ").map((e) => +e);
    const { mask: _mask, ...deserializedAnnotation } = {
      ...annotation,
      shape: annotationShape,
      encodedMask: annotationEncoding,
    };
    reconciledAnnotations.push(deserializedAnnotation as AnnotationObjectV02);
  }

  return {
    annotations: reconciledAnnotations,
    newKinds: Object.values(kindsToReconcile),
    newCategories: Object.values(categoriesToReconcile),
  };
};

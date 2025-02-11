import { EntityState } from "@reduxjs/toolkit";
import Image from "image-js";
import { intersection } from "lodash";
import {
  UNKNOWN_ANNOTATION_CATEGORY_ID,
  UNKNOWN_IMAGE_CATEGORY_ID,
} from "store/data/constants";
import { generateKind, isUnknownCategory } from "store/data/helpers";
import {
  OldAnnotationType,
  OldCategory,
  OldImageType,
  Kind,
  AnnotationObject,
  Category,
  ImageObject,
  Shape,
  ShapeArray,
} from "store/data/types";
import {
  convertArrayToShape,
  generateKind,
  getPropertiesFromImageSync,
  logger,
} from "utils/common/helpers";
import { Partition } from "utils/models/enums";

export const dataConverter_v01v02 = (data: {
  images: OldImageType[];
  oldCategories: OldCategory[];
  annotationCategories: OldCategory[];
  annotations: OldAnnotationType[];
}) => {
  const { images, oldCategories, annotationCategories, annotations } = data;
  const categories: EntityState<Category, string> = {
    ids: [],
    entities: {},
  };
  const things: EntityState<ImageObject | AnnotationObject, string> = {
    ids: [],
    entities: {},
  };
  const kinds: EntityState<Kind, string> = { ids: [], entities: {} };

  const { kind: imageKind, unknownCategory } = generateKind("Image");
  kinds.ids.push(imageKind.id);

  kinds.entities[imageKind.id] = imageKind;

  categories.ids.push(unknownCategory.id);
  categories.entities[unknownCategory.id] = {
    ...unknownCategory,
    containing: [],
  };

  const nonUnknownCategoryMap: Record<string, string> = {};
  for (const category of oldCategories) {
    if (category.id === UNKNOWN_IMAGE_CATEGORY_ID) {
      continue;
    } else {
      let catId: string = category.id;
      if (isUnknownCategory(catId)) {
        catId = "1" + category.id.slice(1);
        nonUnknownCategoryMap[category.id] = catId;
      }
      categories.ids.push(catId);
      categories.entities[catId] = {
        ...category,
        id: catId,
        kind: "Image",
        containing: [],
      } as Category;

      kinds.entities["Image"].categories.push(catId);
    }
  }

  for (const image of images) {
    image.kind = imageKind.id;
    kinds.entities[imageKind.id].containing.push(image.id);
    let cat: string;
    if (image.categoryId === UNKNOWN_IMAGE_CATEGORY_ID) {
      cat = unknownCategory.id;
    } else {
      cat = nonUnknownCategoryMap[image.categoryId] ?? image.categoryId;
    }
    image.categoryId = cat;
    image.containing = [];

    things.ids.push(image.id);

    things.entities[image.id] = image as ImageObject;
    if (cat in categories.entities) {
      categories.entities[cat]!.containing.push(image.id);
    }
  }

  const anCat2KindNAme: Record<string, string> = {};
  for (const anCat of annotationCategories) {
    if (anCat.id === UNKNOWN_ANNOTATION_CATEGORY_ID) continue;

    const { kind: anKind, unknownCategory } = generateKind(anCat.name);
    kinds.ids.push(anKind.id);

    kinds.entities[anKind.id] = anKind;
    categories.ids.push(unknownCategory.id);
    categories.entities[unknownCategory.id] = {
      ...unknownCategory,
      containing: [],
    };
    anCat2KindNAme[anCat.id] = anCat.name;
  }

  const numAnnotationsOfKindPerImage: Record<string, number> = {};

  for (const annotation of annotations as AnnotationObject[]) {
    const { plane: _plane, ..._annotation } = {
      ...annotation,
      activePlane: annotation.plane,
    };
    _annotation.kind = anCat2KindNAme[_annotation.categoryId];
    const unknownCategory = kinds.entities[_annotation.kind]!.unknownCategoryId;
    let annotationName: string;
    if (_annotation.imageId in things.entities) {
      annotationName = `${things.entities[_annotation.imageId]!.name}-${
        _annotation.kind
      }`;
      (things.entities[_annotation.imageId] as ImageObject).containing.push(
        _annotation.id,
      );
    } else {
      annotationName = `${_annotation.kind}`;
    }
    if (annotationName in numAnnotationsOfKindPerImage) {
      annotationName += `_${numAnnotationsOfKindPerImage[annotationName]++}`;
    } else {
      numAnnotationsOfKindPerImage[annotationName] = 1;
      annotationName += "_0";
    }
    _annotation.name = annotationName;
    _annotation.categoryId = unknownCategory;
    _annotation.shape = _annotation.data.shape.reduce(
      (shape: Shape, value: number, idx) => {
        switch (idx) {
          case 0:
            shape.planes = value;
            break;
          case 1:
            shape.height = value;
            break;
          case 2:
            shape.width = value;
            break;
          case 3:
            shape.channels = value;
            break;
          default:
            break;
        }
        return shape;
      },
      { planes: 0, height: 0, width: 0, channels: 0 },
    );
    _annotation.partition = Partition.Unassigned;
    _annotation.bitDepth = things.entities[_annotation.imageId]!.bitDepth;
    things.ids.push(_annotation.id);

    things.entities[_annotation.id] = _annotation as AnnotationObject;

    kinds.entities[_annotation.kind]!.containing.push(_annotation.id);

    categories.entities[unknownCategory]!.containing.push(_annotation.id);
  }

  return { kinds, categories, things };
};

export const convertAnnotationsWithExistingProject_v01v02 = async (
  existingImages: Record<string, ImageObject>,
  existingKinds: Record<string, Kind>,
  oldAnnotations: OldAnnotationType[],
  oldAnnotationCategories: OldCategory[],
) => {
  const catId2Name: Record<string, string> = {};
  const newKinds: Record<string, Kind> = {};
  const newCategories: Record<string, Category> = {};
  const newAnnotations: AnnotationObject[] = [];
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
    const newAnn: Partial<AnnotationObject> = { ...ann };
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
    newAnnotations.push(newAnn as AnnotationObject);
  }
  return {
    newAnnotations,
    newCategories: Object.values(newCategories),
    newKinds: Object.values(newKinds),
  };
};

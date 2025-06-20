import React from "react";
import {
  V01_AnnotationObject,
  V01_Category,
  V01_ImageObject,
  V01Project,
  V02AnnotationObject,
  V02ImageObject,
  V02Project,
} from "../types";
import { EntityState } from "@reduxjs/toolkit";
import { Category, Kind, Shape } from "store/data/types";
import { generateKind, isUnknownCategory } from "store/data/utils";
import {
  UNKNOWN_ANNOTATION_CATEGORY_ID,
  UNKNOWN_IMAGE_CATEGORY_ID,
} from "store/data/constants";
import { Partition } from "utils/models/enums";

const v01_02_dataConverter = (data: {
  images: V01_ImageObject[];
  oldCategories: V01_Category[];
  annotationCategories: V01_Category[];
  annotations: V01_AnnotationObject[];
}): {
  kinds: EntityState<Kind, string>;
  categories: EntityState<Category, string>;
  things: EntityState<V02AnnotationObject | V02ImageObject, string>;
} => {
  const { images, oldCategories, annotationCategories, annotations } = data;

  const things: EntityState<V02ImageObject | V02AnnotationObject, string> = {
    ids: [],
    entities: {},
  };

  // Create Kind Entity State
  const kinds: EntityState<Kind, string> = { ids: [], entities: {} };
  // Add "Image" Kind
  const { kind: imageKind, unknownCategory: unknownImageCategory } =
    generateKind("Image");
  kinds.ids.push(imageKind.id);
  kinds.entities[imageKind.id] = imageKind;

  // Create Categories Entity State
  const categories: EntityState<Category, string> = {
    ids: [],
    entities: {},
  };

  // Add new "Unknown" image category
  categories.ids.push(unknownImageCategory.id);
  categories.entities[unknownImageCategory.id] = {
    ...unknownImageCategory,
    containing: [],
  };

  const nonUnknownCategoryMap: Record<string, string> = {};
  for (const category of oldCategories) {
    if (category.id === UNKNOWN_IMAGE_CATEGORY_ID) {
      continue;
    } else {
      let catId: string = category.id;
      // Check if id starts with "0", which indicates an unknown category in the new project version
      // If it does, replace with "1" and add to the mapping
      if (isUnknownCategory(catId)) {
        catId = "1" + category.id.slice(1);
        nonUnknownCategoryMap[category.id] = catId;
      }

      // create and add category to Entity State
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
      cat = unknownImageCategory.id;
    } else {
      cat = nonUnknownCategoryMap[image.categoryId] ?? image.categoryId;
    }
    image.categoryId = cat;
    image.containing = [];

    things.ids.push(image.id);

    things.entities[image.id] = image as V02ImageObject;
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

  for (const annotation of annotations as V02AnnotationObject[]) {
    const _annotation = {
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
      (things.entities[_annotation.imageId] as V02ImageObject).containing.push(
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

    things.entities[_annotation.id] = _annotation as V02AnnotationObject;

    kinds.entities[_annotation.kind]!.containing.push(_annotation.id);

    categories.entities[unknownCategory]!.containing.push(_annotation.id);
  }

  return { kinds, categories, things };
};

export const v01_02_projectConverter = (v01Project: V01Project): V02Project => {
  const { kinds, categories, things } = v01_02_dataConverter({
    images: v01Project.data.images,
    annotations: v01Project.data.annotations,
    annotationCategories: v01Project.data.annotationCategories,
    oldCategories: v01Project.data.categories,
  });
  return {
    project: v01Project.project,
    classifier: v01Project.classifier,
    segmenter: v01Project.segmenter,
    data: { kinds, categories, things },
  };
};

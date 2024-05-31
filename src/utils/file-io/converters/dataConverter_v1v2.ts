import Image from "image-js";
import { intersection } from "lodash";
import {
  UNKNOWN_ANNOTATION_CATEGORY_ID,
  UNKNOWN_CATEGORY_NAME,
  UNKNOWN_IMAGE_CATEGORY_ID,
} from "store/data/constants";
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
import { DeferredEntityState } from "store/entities";
import { UNKNOWN_IMAGE_CATEGORY_COLOR } from "utils/common/constants";
import {
  convertArrayToShape,
  generateUnknownCategory,
  generateUUID,
  getPropertiesFromImageSync,
} from "utils/common/helpers";
import { logger } from "utils/common/helpers";
import { Partition } from "utils/models/enums";

export const dataConverter_v1v2 = (data: {
  images: OldImageType[];
  oldCategories: OldCategory[];
  annotationCategories: OldCategory[];
  annotations: OldAnnotationType[];
}) => {
  const { images, oldCategories, annotationCategories, annotations } = data;
  const categories: DeferredEntityState<Category> = {
    ids: [],
    entities: {},
  };
  const things: DeferredEntityState<ImageObject | AnnotationObject> = {
    ids: [],
    entities: {},
  };
  const kinds: DeferredEntityState<Kind> = { ids: [], entities: {} };

  kinds.ids.push("Image");
  const unknownCategoryId = generateUUID({ definesUnknown: true });
  const unknownCategory: Category = {
    id: unknownCategoryId,
    name: UNKNOWN_CATEGORY_NAME,
    color: UNKNOWN_IMAGE_CATEGORY_COLOR,
    containing: [],
    kind: "Image",
    visible: true,
  };
  kinds.entities["Image"] = {
    saved: {
      id: "Image",
      containing: [],
      categories: [unknownCategoryId],
      unknownCategoryId,
    },
    changes: {},
  };
  categories.ids.push(unknownCategoryId);
  categories.entities[unknownCategoryId] = {
    saved: {
      ...unknownCategory,
      containing: [],
    },
    changes: {},
  };
  for (const category of oldCategories) {
    if (category.id === UNKNOWN_IMAGE_CATEGORY_ID) {
      continue;
    } else {
      categories.ids.push(category.id);
      categories.entities[category.id] = {
        saved: {
          ...category,
          containing: [],
        } as Category,
        changes: {},
      };
      kinds.entities["Image"].saved.categories.push(category.id);
    }
  }

  for (const image of images) {
    image.kind = "Image";
    kinds.entities["Image"].saved.containing.push(image.id);
    const cat =
      image.categoryId === UNKNOWN_IMAGE_CATEGORY_ID
        ? unknownCategoryId
        : image.categoryId;
    image.categoryId = cat;
    image.containing = [];

    things.ids.push(image.id);

    things.entities[image.id] = { saved: image as ImageObject, changes: {} };
    if (cat in categories.entities) {
      categories.entities[cat].saved.containing.push(image.id);
    }
  }

  const anCat2KindNAme: Record<string, string> = {};
  for (const anCat of annotationCategories) {
    if (anCat.id === UNKNOWN_ANNOTATION_CATEGORY_ID) continue;
    kinds.ids.push(anCat.name);
    const unknownCategoryId = generateUUID({ definesUnknown: true });
    const unknownCategory: Category = {
      id: unknownCategoryId,
      name: UNKNOWN_CATEGORY_NAME,
      color: UNKNOWN_IMAGE_CATEGORY_COLOR,
      containing: [],
      kind: anCat.name,
      visible: true,
    };
    kinds.entities[anCat.name] = {
      saved: {
        id: anCat.name,
        containing: [],
        categories: [unknownCategoryId],
        unknownCategoryId,
      },
      changes: {},
    };
    categories.ids.push(unknownCategoryId);
    categories.entities[unknownCategoryId] = {
      saved: {
        ...unknownCategory,
        containing: [],
      },
      changes: {},
    };
    anCat2KindNAme[anCat.id] = anCat.name;
  }

  const numAnnotationsOfKindPerImage: Record<string, number> = {};

  for (const annotation of annotations as AnnotationObject[]) {
    const { plane, ..._annotation } = {
      ...annotation,
      activePlane: annotation.plane,
    };
    _annotation.kind = anCat2KindNAme[_annotation.categoryId];
    const unknownCategory =
      kinds.entities[_annotation.kind].saved.unknownCategoryId;
    let annotationName: string;
    if (_annotation.imageId in things.entities) {
      annotationName = `${things.entities[_annotation.imageId].saved.name}-${
        _annotation.kind
      }`;
      (
        things.entities[_annotation.imageId].saved as ImageObject
      ).containing.push(_annotation.id);
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
      { planes: 0, height: 0, width: 0, channels: 0 }
    );
    _annotation.partition = Partition.Unassigned;
    _annotation.bitDepth = things.entities[_annotation.imageId].saved.bitDepth;
    things.ids.push(_annotation.id);

    things.entities[_annotation.id] = {
      saved: _annotation as AnnotationObject,
      changes: {},
    };

    kinds.entities[_annotation.kind].saved.containing.push(_annotation.id);

    categories.entities[unknownCategory].saved.containing.push(_annotation.id);
  }

  return { kinds, categories, things };
};

export const convertAnnotationsWithExistingProject_v1_2 = async (
  existingImages: Record<string, ImageObject>,
  existingKinds: Record<string, Kind>,
  oldAnnotations: OldAnnotationType[],
  oldAnnotationCategories: OldCategory[]
) => {
  const catId2Name: Record<string, string> = {};
  const newKinds: Record<string, Kind> = {};
  const newCategories: Record<string, Category> = {};
  const newAnnotations: AnnotationObject[] = [];
  const imageMap: Record<string, Image> = {};

  oldAnnotationCategories.forEach((anCat) => {
    catId2Name[anCat.id] = anCat.name;
    if (!(anCat.name in existingKinds) && !(anCat.name in newKinds)) {
      const newUnknownCategory = generateUnknownCategory(anCat.name);
      newCategories[newUnknownCategory.id] = newUnknownCategory;
      const kind: Kind = {
        id: anCat.name,
        containing: [],
        categories: [newUnknownCategory.id],
        unknownCategoryId: newUnknownCategory.id,
      };
      newKinds[anCat.name] = kind;
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
      kind.containing
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
      ann
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

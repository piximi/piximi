import { encode, maskFromPoints } from "views/ImageViewer/utils";
import { generateUUID } from "store/data/utils";
import { getPropertiesFromImage } from "store/data/utils";
import { logger } from "utils/logUtils";

import { Partition } from "utils/models/enums";
import {
  SerializedCOCOAnnotationType,
  SerializedCOCOCategoryType,
  SerializedCOCOFileType,
  SerializedCOCOImageType,
  V02AnnotationObject,
  V02Category,
  V02ImageObject,
  V02Kind,
} from "../../types";
import { Point } from "utils/types";
import { RequireOnly } from "utils/types";
import { Shape } from "store/data/types";
import {
  UNKNOWN_ANNOTATION_CATEGORY_COLOR,
  UNKNOWN_CATEGORY_NAME,
} from "store/data/constants";

type V02KindMap = Record<
  string,
  { new: V02Kind; existing?: V02Kind } | { new?: V02Kind; existing: V02Kind }
>;
type V02CategoryMap = Record<
  string,
  | { new: V02Category; existing?: V02Category }
  | { new?: V02Category; existing: V02Category }
>;
type ImageMap = Record<
  string,
  { new: SerializedCOCOImageType; existing?: V02ImageObject }
>;

const reconcileCOCOCategories = (
  existingCategories: Array<V02Category>,
  existingV02Kinds: Array<V02Kind>,
  serializedCategories: Array<SerializedCOCOCategoryType>,
  availableColors: Array<string> = [],
) => {
  const categoryMap: V02CategoryMap = {};
  const isolatedUnknownCats: Record<string, V02Category> = {};
  const kindMap: V02KindMap = {};
  if (availableColors.length === 0) {
    availableColors = ["#000000"];
  }
  let colorIdx = -1;

  for (const cocoCat of serializedCategories) {
    const existingCat = existingCategories.find(
      (c) =>
        c.name.toLowerCase() === cocoCat.name.toLowerCase() &&
        c.kind.toLowerCase() === cocoCat.supercategory.toLowerCase(),
    );
    const existingV02Kind = existingV02Kinds.find(
      (k) => k.id === cocoCat.supercategory,
    );

    if (existingCat) {
      /*
        CASE: V02Category exists, V02Kind exists
        ACTION: Add category and kind to existing categories and kinds
        REASON: If the category exists, then then its kind must also exist
      */
      categoryMap[cocoCat.id] = { existing: existingCat };
      kindMap[cocoCat.supercategory] = { existing: existingV02Kind! };
    } else {
      const newColor = availableColors[++colorIdx % availableColors.length];

      if (existingV02Kind) {
        /*
          CASE: V02Category doesnt exist, V02Kind exists 
          ACTION: Create a new category and add to new categories
          REASON: If the kind exists, then we generate a new category from the coco serialized category.
          We generate a "known" indicated uuid, since we know if the kind exists and the category
          doesnt, it cannot be an "unknown" category
        */
        const newId = generateUUID();
        const newCat: V02Category = {
          id: newId,
          kind: cocoCat.supercategory,
          name: cocoCat.name,
          color: newColor,
          containing: [],
          visible: true,
        };
        categoryMap[cocoCat.id] = { new: newCat };
      } else {
        /*
          CASE: V02Category doesnt exist, V02Kind doesnt exist
          ACTION: Check if kind has been handled already, if not then create a new kind with new cooresponding unknown category. Potentially create new category from serialized coco category
          If the kind doesnt exist, then in addition to creating a new category from the coco
          serialized category, we must also generate a new "unknown" category corresponding the the new kind
        */

        const newUnknownCatId = generateUUID({ definesUnknown: true });

        const newUnknownV02Category = {
          id: newUnknownCatId,
          name: "unknown",
          color: UNKNOWN_ANNOTATION_CATEGORY_COLOR,
          containing: [],
          kind: cocoCat.supercategory,
          visible: true,
        } as V02Category;

        let kind: V02Kind;
        if (cocoCat.supercategory in kindMap) {
          kind = kindMap[cocoCat.supercategory].new!;
        } else {
          const newV02Kind: V02Kind = {
            id: cocoCat.supercategory,
            displayName: cocoCat.supercategory,
            categories: [newUnknownCatId],
            containing: [],
            unknownCategoryId: newUnknownCatId,
          };

          kind = newV02Kind;
          kindMap[cocoCat.supercategory] = { new: newV02Kind };
        }

        /*
           If the category was an "unknown" category, then we dont need to create an additional category
         */
        if (
          cocoCat.name.toLowerCase() === UNKNOWN_CATEGORY_NAME.toLowerCase()
        ) {
          /*
             The serialized cat maps to the new unknown cat
           */
          categoryMap[cocoCat.id] = { new: newUnknownV02Category };

          const previouslyIsolated = Object.values(isolatedUnknownCats).find(
            (c) => c.kind === cocoCat.supercategory,
          );

          if (previouslyIsolated) {
            delete isolatedUnknownCats[previouslyIsolated.kind];
          }
        } else {
          /*
             If the category was not "unknown" then we need to create a new category based on the coco serialized cat.
             We also need to make sure the new unknown category gets added to the project, event though it will have no associated annotations.
           */
          const newId = generateUUID();
          const newV02Category: V02Category = {
            id: newId,
            name: cocoCat.name,
            color: newColor,
            containing: [],
            kind: cocoCat.supercategory,
            visible: true,
          };
          kind.categories.push(newId);

          categoryMap[cocoCat.id] = {
            new: newV02Category,
          };
          if (!(newUnknownV02Category.kind in isolatedUnknownCats)) {
            isolatedUnknownCats[newUnknownV02Category.kind] =
              newUnknownV02Category;
          }
        }
      }
    }
  }

  return { categoryMap, kindMap, isolatedUnknownCats };
};

const reconcileCOCOImages = (
  existingImages: Array<V02ImageObject>,
  serializedImages: Array<SerializedCOCOImageType>,
) => {
  const imageMap: ImageMap = {};
  serializedImages.forEach((cocoIm) => {
    const existingImage = existingImages.find(
      (i) => cocoIm.file_name === i.name,
    );
    imageMap[cocoIm.id] = { new: cocoIm };
    if (existingImage) {
      imageMap[cocoIm.id].existing = existingImage;
    }
  });
  return imageMap;
};

const deserializeCOCOAnnotation = (
  imageShape: Shape,
  cocoAnn: SerializedCOCOAnnotationType,
  crowded: Array<number>,
  multipart: Array<number>,
  malformed: Array<number>,
) => {
  let skip = false;

  if (cocoAnn.iscrowd) {
    crowded.push(cocoAnn.id);
    skip = true;
  }
  // will be number[][] when iscrowd is false
  const polygons = cocoAnn.segmentation as number[][];

  const numPolygons = polygons.length;

  if (numPolygons !== 1) {
    multipart.push(cocoAnn.id);
    skip = true;
  }

  // coco polygon points are arranged as: [x_1, y_1, x_2, y_2, ...]
  // where y_1 and x_1 are the y,x coordinates of point 1
  const polygon = polygons[0];

  if (polygon.length % 2 !== 0) {
    malformed.push(cocoAnn.id);
    skip = true;
  }

  const points: Point[] = [];
  for (let i = 0; i < polygon.length; i += 2) {
    points.push({ x: polygon[i], y: polygon[i + 1] });
  }

  // convert coco [x, y, width, height] to our [x1, y1, x2, y2]
  const bbox = [
    Math.round(cocoAnn.bbox[0]),
    Math.round(cocoAnn.bbox[1]),
    Math.round(cocoAnn.bbox[0] + cocoAnn.bbox[2]),
    Math.round(cocoAnn.bbox[1] + cocoAnn.bbox[3]),
  ] as [number, number, number, number];

  const decodedMask = maskFromPoints(
    points,
    { width: imageShape.width, height: imageShape.height },
    bbox,
    true,
  );

  const encodedMask = encode(decodedMask);
  return { encodedMask, decodedMask, bbox, skip };
};

export const v02_deserializeCOCOFile = async (
  cocoFile: SerializedCOCOFileType,
  existingImages: Array<V02ImageObject>,
  existingCategories: Array<V02Category>,
  existingV02Kinds: Array<V02Kind>,
  availableColors: Array<string> = [],
) => {
  const reconciledAnnotations: V02AnnotationObject[] = [];
  const annotationNames: Record<string, number> = {};
  const kindsToReconcile: Record<string, V02Kind> = {};
  const categoriesToReconcile: Record<string, V02Category> = {};
  const crowded: Array<number> = [];
  const multipart: Array<number> = [];
  const malformed: Array<number> = [];

  const { categoryMap, kindMap, isolatedUnknownCats } = reconcileCOCOCategories(
    existingCategories,
    existingV02Kinds,
    cocoFile.categories,
    availableColors,
  );

  const imageMap = reconcileCOCOImages(existingImages, cocoFile.images);

  for await (const cocoAnn of cocoFile.annotations) {
    const reconciledAnnotation: Partial<V02AnnotationObject> = {
      id: generateUUID(),
      partition: Partition.Unassigned,
      plane: 0,
    };
    const annImage = imageMap[cocoAnn.image_id];
    const category = categoryMap[cocoAnn.category_id];
    const kind = kindMap[category.new?.kind ?? category.existing!.kind];

    /*
      HANDLE IMAGE
    */
    // If no existing image we cant build the annotation
    if (!annImage.existing) continue;

    const image = annImage.existing;

    const { encodedMask, decodedMask, bbox, skip } = deserializeCOCOAnnotation(
      image.shape,
      cocoAnn,
      crowded,
      multipart,
      malformed,
    );
    if (skip) {
      continue;
    }

    Object.assign(reconciledAnnotation, {
      boundingBox: bbox,
      decodedMask,
      encodedMask,
    });

    const annPropsFromIm = await getPropertiesFromImage(
      image,
      reconciledAnnotation as RequireOnly<V02AnnotationObject, "boundingBox">,
    );
    Object.assign(reconciledAnnotation, annPropsFromIm);

    if (kind.existing) {
      reconciledAnnotation.kind = kind.existing.id;
    } else {
      reconciledAnnotation.kind = kind.new!.id;
      kind.new!.containing.push(reconciledAnnotation.id!);

      if (!(kind.new!.id in kindsToReconcile)) {
        const unknownCat = isolatedUnknownCats[kind.new!.id];
        if (unknownCat) categoriesToReconcile[unknownCat.id] = unknownCat;
        kindsToReconcile[kind.new!.id] = kind.new!;
      }
    }

    if (category.existing) {
      reconciledAnnotation.categoryId = category.existing.id;
    } else {
      reconciledAnnotation.categoryId = category.new!.id;
      if (!(category.new!.id in categoriesToReconcile))
        categoriesToReconcile[category.new!.id] = category.new!;
    }

    reconciledAnnotation.bitDepth = image.bitDepth;
    reconciledAnnotation.shape = {
      planes: 0,
      height: bbox[3] - bbox[1],
      width: bbox[2] - bbox[0],
      channels: image.shape.channels,
    };
    const name = `${image.name}_${reconciledAnnotation.kind}`;
    if (name in annotationNames) {
      annotationNames[name]++;
    } else {
      annotationNames[name] = 0;
    }

    reconciledAnnotation.name = name + "_" + annotationNames[name];

    reconciledAnnotations.push(reconciledAnnotation as V02AnnotationObject);
  }

  if (
    import.meta.env.NODE_ENV !== "production" &&
    import.meta.env.VITE_APP_LOG_LEVEL === "1"
  ) {
    const numMalformed = malformed.length;
    const numCrowded = crowded.length;
    const numMultipart = multipart.length;
    const numInFile = cocoFile.annotations.length;
    const numKept = numInFile - (numMalformed + numCrowded + numMultipart);

    malformed.length > 0 &&
      logger(
        `Dropped ${malformed.length} annotations with malformed polygon shapes: ${malformed}`,
      );
    crowded.length > 0 &&
      logger(`Dropped ${crowded.length} annotations with iscrowd=1`);
    multipart.length > 0 &&
      logger(
        `Dropped ${multipart.length} annotations with multiple polygon parts`,
      );
    logger(`Created ${numKept}/${numInFile} annotations`);
  }

  return {
    newAnnotations: reconciledAnnotations,
    newV02Kinds: Object.values(kindsToReconcile),
    newCategories: Object.values(categoriesToReconcile),
  };
};

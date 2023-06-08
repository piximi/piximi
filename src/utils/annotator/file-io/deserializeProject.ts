import { v4 as uuidv4 } from "uuid";

import {
  AnnotationType,
  Category,
  SerializedAnnotationType,
  SerializedFileType,
  ShadowImageType,
  SerializedAnnotatorImageType,
} from "types";

export const deserializeAnnotations = (
  serializedAnnotations: Array<SerializedAnnotationType>
) => {
  const annotations: Array<AnnotationType> = [];

  for (const annotation of serializedAnnotations) {
    annotations.push({
      id: uuidv4(),
      encodedMask: annotation.mask.split(" ").map((e) => Number(e)),
      plane: annotation.plane,
      boundingBox: annotation.boundingBox as [number, number, number, number],
      categoryId: annotation.categoryId,
    });
  }

  return annotations;
};

/*
We want to match incoming categories to existing categories, if their names are the same,
however their ids may differ. We can't change existing category ids because existing annotations
refer to them. Instead we have to ensure incoming categories are given the proper ids, and then
change the incoming annotations to refer to the updated incoming category id
*/
const reconcileCategories = (
  existingCategories: Array<Category>,
  serializedCategories: Array<Category>,
  serializedAnnotations: Array<SerializedAnnotationType>
) => {
  // incoming cat id -> existing cat id
  const catIdMap: { [catId: string]: string } = {};

  const matchedCats: Array<Category> = [];
  const newCats: Array<Category> = [];

  for (const cat of serializedCategories) {
    const existingCat = existingCategories.find((c) => c.name === cat.name);
    if (existingCat) {
      // map to existing id
      catIdMap[cat.id] = existingCat.id;
      matchedCats.push(cat);
    } else {
      // keeps its id
      catIdMap[cat.id] = cat.id;
      newCats.push(cat);
    }
  }

  const catModdedAnnotations = serializedAnnotations.map((ann) => ({
    ...ann,
    categoryId: catIdMap[ann.categoryId],
  }));

  if (
    process.env.NODE_ENV !== "production" &&
    process.env.REACT_APP_LOG_LEVEL === "1"
  ) {
    const numMatched = matchedCats.length;
    const numNew = newCats.length;
    const numExisting = existingCategories.length;

    numMatched > 0 &&
      console.log(`Matched ${numMatched} / ${numExisting} categories`);
    numNew > 0 && console.log(`Created ${numNew} / ${numExisting} categories`);
  }

  return { newCats, catModdedAnnotations };
};

/*
We want to match incoming images to existing images, where their names are the same,
however their ids may differ. We can't change existing image ids because existing components
may refer to them. Instead we have to ensure incoming images are given the proper ids, and then
change the incoming annotations to refer to the updated incoming image id.

If the image doesn't exist, then there's nothing to assign the annotation to, and it is discarded.
*/
const reconcileImages = (
  existingImages: Array<ShadowImageType>,
  serializedImages: Array<SerializedAnnotatorImageType>,
  serializedAnnotations: Array<SerializedAnnotationType>
) => {
  // incoming image id -> existing image id
  const imIdMap: { [imId: string]: string } = {};

  const discardedAnnotations: Array<SerializedAnnotationType> = [];
  const discardedIms: Array<SerializedAnnotatorImageType> = [];
  const matchedIms: Array<SerializedAnnotatorImageType> = [];

  for (const im of serializedImages) {
    const existingIm = existingImages.find((i) => i.name === im.name);
    if (existingIm) {
      // save id mapping
      imIdMap[im.id] = existingIm.id;
      matchedIms.push(existingIm);
    } else {
      // discarded
      discardedIms.push(im);
    }
  }

  const imModdedAnnotations = serializedAnnotations
    .filter((ann) => {
      if (imIdMap.hasOwnProperty(ann.imageId)) {
        return true;
      } else {
        discardedAnnotations.push(ann);
        return false;
      }
    })
    .map((ann) => ({ ...ann, imageId: imIdMap[ann.imageId] }));

  if (
    process.env.NODE_ENV !== "production" &&
    process.env.REACT_APP_LOG_LEVEL === "1"
  ) {
    const numImsDiscarded = discardedIms.length;
    const numAnnsDiscarded = discardedAnnotations.length;
    const numMatched = matchedIms.length;
    const numExisting = existingImages.length;

    numImsDiscarded > 0 &&
      console.log(
        `Discarded ${numImsDiscarded} / ${numExisting} images`,
        `and ${numAnnsDiscarded} associated annotations.`,
        `Image names: ${discardedIms.map((im) => im.name)}`
      );
    numMatched > 0 &&
      console.log(`Matched ${numMatched} / ${numExisting} images`);
  }

  return { matchedIms, imModdedAnnotations };
};

export const deserializeProjectFile = (
  serializedProject: SerializedFileType,
  existingImages: Array<ShadowImageType>,
  existingCategories: Array<Category>
) => {
  // this must come first
  const { newCats, catModdedAnnotations } = reconcileCategories(
    existingCategories,
    serializedProject.categories,
    serializedProject.annotations
  );

  // this must come second
  const { matchedIms, imModdedAnnotations } = reconcileImages(
    existingImages,
    serializedProject.images,
    catModdedAnnotations
  );

  const annMap = imModdedAnnotations.reduce((idMap, ann) => {
    if (idMap.hasOwnProperty(ann.imageId)) {
      idMap[ann.imageId].push(ann);
    } else {
      idMap[ann.imageId] = [ann];
    }
    return idMap;
  }, {} as { [imageId: string]: Array<SerializedAnnotationType> });

  const deserializedImages = matchedIms.reduce(
    (idMap, im) => {
      const annotations = deserializeAnnotations(annMap[im.id]);
      idMap[im.id] = annotations;
      return idMap;
    },
    {} as {
      [imageId: string]: Array<AnnotationType>;
    }
  );

  return {
    imsToAnnotate: deserializedImages, // nonexisting ims excluded
    newCategories: newCats, // existing cats excluded
  };
};

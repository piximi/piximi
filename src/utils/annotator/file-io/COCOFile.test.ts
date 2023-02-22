import { test } from "@jest/globals";
import { v4 as uuidv4 } from "uuid";

import {
  projectSlice,
  addAnnotationCategories,
  setAnnotationCategories,
  annotationCategoriesSelector,
} from "store/project";
import { addImages, AnnotatorSlice, setInstances } from "store/annotator";
import { CATEGORY_COLORS } from "utils/common/colorPalette";
import { annotatorFullImagesSelector } from "store/common";
import { serializeCOCOFile } from "./serializeCOCO";
import { deserializeCOCOFile } from "./deserializeCOCO";

import {
  encodedAnnotationType,
  ImageType,
  UNKNOWN_ANNOTATION_CATEGORY,
} from "types";

// import cocoLabels from "data/test-data/COCO/labels_coco_slim.json";
import expectedState from "data/test-data/COCO/labels_internal.json";

// Time 1 (T1) is pre-serialization state of piximi
// Time 2 (T2) is piximi state, after refresh, but before deserialization
// Time 3 (T3) is piximi state, after deserialization

//#region setup

// always has same info, including id
const T1T2UnmodifiedCat = UNKNOWN_ANNOTATION_CATEGORY; // (backpack)
// name exists in both T1 and T2, but with color and id change
const T1T2ModifiedCats = {
  // clock
  t1: {
    ...expectedState.project.annotationCategories[1],
    id: uuidv4(),
    color: CATEGORY_COLORS.black,
  },
  t2: {
    ...expectedState.project.annotationCategories[1],
    id: uuidv4(),
    color: CATEGORY_COLORS.citrus,
  },
};
// eixsts only in T1
const T1OnlyCat = {
  // sports ball
  ...expectedState.project.annotationCategories[2],
  id: uuidv4(),
  color: CATEGORY_COLORS.columbiablue,
};
// exists only in T2
const T2OnlyCat = {
  // sheep
  ...expectedState.project.annotationCategories[3],
  id: uuidv4(),
  color: CATEGORY_COLORS.darkcyan,
};

// annotations exist T1 and T2
const im1AnnotationsT1: Array<encodedAnnotationType> = [
  {
    // 1clockTower.jpg -> Unknown (backpack)
    ...expectedState.annotator.images[0].annotations[0],
    id: uuidv4(),
    categoryId: T1T2UnmodifiedCat.id,
  } as encodedAnnotationType,
  {
    // 1clockTower.jpg -> clock (1)
    ...expectedState.annotator.images[0].annotations[1],
    id: uuidv4(),
    categoryId: T1T2ModifiedCats.t1.id,
  } as encodedAnnotationType,
];

const im1AnnotationsT2: Array<encodedAnnotationType> = [
  {
    // 1clockTower.jpg -> clock (2)
    ...expectedState.annotator.images[0].annotations[2],
    id: uuidv4(),
    categoryId: T1T2ModifiedCats.t2.id,
  } as encodedAnnotationType,
];

// annotations exists T1, but not T2
const im2AnnotationsT1: Array<encodedAnnotationType> = [
  {
    // 2golfer.jpg -> sports ball
    ...expectedState.annotator.images[1].annotations[0],
    id: uuidv4(),
    categoryId: T1OnlyCat.id,
  } as encodedAnnotationType,
];

// annotations did not exist T1, exists T2
const im3AnnotationsT2: Array<encodedAnnotationType> = [
  {
    // 3twoSheep.jpg -> sheep
    ...expectedState.annotator.images[2].annotations[0],
    id: uuidv4(),
    categoryId: T2OnlyCat.id,
  } as encodedAnnotationType,
];

// image exists T1 and T2
const im1T1: ImageType = {
  // 1clockTower.jpg
  ...expectedState.annotator.images[0],
  id: uuidv4(),
  colors: undefined as unknown as ImageType["colors"],
  data: undefined as unknown as ImageType["data"],
  partition: undefined as unknown as ImageType["partition"],
  annotations: im1AnnotationsT1,
};

const im1T2: ImageType = {
  ...im1T1,
  id: uuidv4(),
  annotations: im1AnnotationsT2,
};

// image exists T1 only
const im2T1: ImageType = {
  // 2golfer.jpg
  ...expectedState.annotator.images[1],
  id: uuidv4(),
  colors: undefined as unknown as ImageType["colors"],
  data: undefined as unknown as ImageType["data"],
  partition: undefined as unknown as ImageType["partition"],
  annotations: im2AnnotationsT1,
};

// image exists T2 only
const im3T2: ImageType = {
  // 3twoSheep.jpg
  ...expectedState.annotator.images[2],
  id: uuidv4(),
  colors: undefined as unknown as ImageType["colors"],
  data: undefined as unknown as ImageType["data"],
  partition: undefined as unknown as ImageType["partition"],
  annotations: im3AnnotationsT2,
};

const categoriesT1 = [T1T2UnmodifiedCat, T1T2ModifiedCats.t1, T1OnlyCat];
const categoriesT2 = [T1T2UnmodifiedCat, T1T2ModifiedCats.t2, T2OnlyCat];
const categoriesT3Expected = [
  T1T2UnmodifiedCat, // always presnet
  T1T2ModifiedCats.t2, // modified T1-T2, but unmodified T3
  T2OnlyCat, // present during deserialization
  T1OnlyCat, // serialized category, re-created with deserialization
];

const imagesT1 = [im1T1, im2T1];
const imagesT2 = [im1T2, im3T2];
const imagesT3Expected = [im1T2, im3T2]; // same as T2, no images created/destroyed

// const annotationsT1 = [...im1T1.annotations, ...im2T1.annotations];
// const annotationsT2 = [...im1T2.annotations, ...im3T2.annotations];
const annotationsT3Expected = [
  ...im1T2.annotations, // im1 annotations present during deserialization
  ...im1T1.annotations, // im1 annotations that were serialized, recreated
  ...im3T2.annotations, // im3 annotations present during deserialization
  // im2T1 annotations serialized, but not re-created because no im2 present
];

//#endregion setup

test("serialize project", () => {
  // piximi initial state

  let projectState = projectSlice.reducer(undefined, { type: undefined });
  let annotatorState = AnnotatorSlice.reducer(undefined, { type: undefined });

  // T1 - pre-serialization

  projectState = projectSlice.reducer(
    projectState,
    setAnnotationCategories({ categories: categoriesT1 })
  );
  annotatorState = AnnotatorSlice.reducer(
    annotatorState,
    addImages({ newImages: imagesT1 })
  );

  // AnnotatorSlice.actions.setActiveImage({ imageId: "", prevImageId: "", execSaga: true })

  const serializedProject = serializeCOCOFile(imagesT1, categoriesT1);

  // T1 -> T2, piximi closed and new project started

  projectState = projectSlice.reducer(undefined, { type: undefined });
  annotatorState = AnnotatorSlice.reducer(undefined, { type: undefined });

  // T2 - pre-deserialization

  projectState = projectSlice.reducer(
    projectState,
    setAnnotationCategories({ categories: categoriesT2 })
  );
  annotatorState = AnnotatorSlice.reducer(
    annotatorState,
    addImages({ newImages: imagesT2 })
  );

  const { newCategories, imsToAnnotate } = deserializeCOCOFile(
    serializedProject,
    imagesT2,
    categoriesT2
  );

  // T2 -> T3 dispatch deserialized project

  projectState = projectSlice.reducer(
    projectState,
    addAnnotationCategories({ categories: newCategories })
  );
  annotatorState = AnnotatorSlice.reducer(
    annotatorState,
    setInstances({ instances: imsToAnnotate })
  );

  // AnnotatorSlice.actions.setActiveImage({ imageId: "", prevImageId: "", execSaga: true })

  // T3 - after deserialization

  const categoriesT3Actual = annotationCategoriesSelector({
    project: projectState,
  });
  const imagesT3Actual = annotatorFullImagesSelector({
    annotator: annotatorState,
    project: projectState,
  });

  const annotationsT3Actual = imagesT3Actual.reduce(
    (annotations, im) => [...annotations, ...im.annotations],
    [] as Array<encodedAnnotationType>
  );

  expect(categoriesT3Actual.length).toBe(categoriesT3Expected.length);
  expect(imagesT3Actual.length).toBe(imagesT3Expected.length);

  expect(categoriesT3Actual.map((c) => c.name)).toEqual(
    categoriesT3Expected.map((c) => c.name)
  );
  expect(imagesT3Actual.map((im) => im.name)).toEqual(
    imagesT3Expected.map((im) => im.name)
  );

  // expect category ids to be different, because they're uuid generated
  // jest ignores undefined property keys
  expect(
    annotationsT3Actual.map((ann) => ({ ...ann, categoryId: undefined }))
  ).toEqual(
    annotationsT3Expected.map((ann) => ({ ...ann, categoryId: undefined }))
  );
});

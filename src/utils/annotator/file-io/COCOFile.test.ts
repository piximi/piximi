import { test } from "@jest/globals";

import { CATEGORY_COLORS } from "utils/common/colorPalette";
import { serializeCOCOFile } from "./serializeCOCO";
import { deserializeCOCOFile } from "./deserializeCOCO";

import { AnnotationType, ImageType, UNKNOWN_ANNOTATION_CATEGORY } from "types";

// import cocoLabels from "data/test-data/COCO/labels_coco_slim.json";
import expectedState from "data/test-data/COCO/labels_internal.json";

import { productionStore } from "store";
import { generateUUID } from "utils/common/helpers";

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
    id: generateUUID(),
    color: CATEGORY_COLORS.black,
  },
  t2: {
    ...expectedState.project.annotationCategories[1],
    id: generateUUID(),
    color: CATEGORY_COLORS.citrus,
  },
};
// eixsts only in T1
const T1OnlyCat = {
  // sports ball
  ...expectedState.project.annotationCategories[2],
  id: generateUUID(),
  color: CATEGORY_COLORS.columbiablue,
};
// exists only in T2
const T2OnlyCat = {
  // sheep
  ...expectedState.project.annotationCategories[3],
  id: generateUUID(),
  color: CATEGORY_COLORS.darkcyan,
};

// below image fields not needed for serializing annotations file so fake it
const dummyImageFields = {
  colors: undefined as unknown as ImageType["colors"],
  data: undefined as unknown as ImageType["data"],
  partition: undefined as unknown as ImageType["partition"],
};

// image exists T1 and T2
const im1T1: ImageType = {
  // 1clockTower.jpg
  ...expectedState.annotator.images[0],
  ...dummyImageFields,
  id: generateUUID(),
};

const im1T2: ImageType = {
  ...im1T1,
  id: generateUUID(),
};

// image exists T1 only
const im2T1: ImageType = {
  // 2golfer.jpg
  ...expectedState.annotator.images[1],
  ...dummyImageFields,
  id: generateUUID(),
};

// image exists T2 only
const im3T2: ImageType = {
  // 3twoSheep.jpg
  ...expectedState.annotator.images[2],
  ...dummyImageFields,
  id: generateUUID(),
};

// annotations exist T1 and T2
const im1AnnotationsT1: Array<AnnotationType> = [
  {
    // 1clockTower.jpg -> Unknown (backpack)
    ...expectedState.annotator.images[0].annotations[0],
    id: generateUUID(),
    categoryId: T1T2UnmodifiedCat.id,
    imageId: im1T1.id,
  },
  {
    // 1clockTower.jpg -> clock (1)
    ...expectedState.annotator.images[0].annotations[1],
    id: generateUUID(),
    categoryId: T1T2ModifiedCats.t1.id,
    imageId: im1T1.id,
  },
].map(({ mask: encodedMask, boundingBox, ...props }) => ({
  encodedMask,
  boundingBox: boundingBox as [number, number, number, number],
  ...props,
}));

const im1AnnotationsT2: Array<AnnotationType> = [
  {
    // 1clockTower.jpg -> clock (2)
    ...expectedState.annotator.images[0].annotations[2],
    id: generateUUID(),
    categoryId: T1T2ModifiedCats.t2.id,
    imageId: im1T2.id,
  },
].map(({ mask: encodedMask, boundingBox, ...props }) => ({
  encodedMask,
  boundingBox: boundingBox as [number, number, number, number],
  ...props,
}));

// annotations exists T1, but not T2
const im2AnnotationsT1: Array<AnnotationType> = [
  {
    // 2golfer.jpg -> sports ball
    ...expectedState.annotator.images[1].annotations[0],
    id: generateUUID(),
    categoryId: T1OnlyCat.id,
    imageId: im2T1.id,
  },
].map(({ mask: encodedMask, boundingBox, ...props }) => ({
  encodedMask,
  boundingBox: boundingBox as [number, number, number, number],
  ...props,
}));

// annotations did not exist T1, exists T2
const im3AnnotationsT2: Array<AnnotationType> = [
  {
    // 3twoSheep.jpg -> sheep
    ...expectedState.annotator.images[2].annotations[0],
    id: generateUUID(),
    categoryId: T2OnlyCat.id,
    imageId: im3T2.id,
  },
].map(({ mask: encodedMask, boundingBox, ...props }) => ({
  encodedMask,
  boundingBox: boundingBox as [number, number, number, number],
  ...props,
}));

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

const annotationsT1 = [...im1AnnotationsT1, ...im2AnnotationsT1];
const annotationsT2 = [...im1AnnotationsT2, ...im3AnnotationsT2];
// order matters
const annotationsT3Expected = [
  ...im1AnnotationsT2, // im1 annotations present during deserialization
  ...im3AnnotationsT2, // im3 annotations present during deserialization
  ...im1AnnotationsT1, // im1 annotations that were serialized, recreated
  // im2T1 annotations serialized, but not re-created because no im2 present
];

//#endregion setup

// test("serialize COCO", () => {
//   // piximi initial state

//   // T1 - pre-serialization

//   productionStore.dispatch(
//     dataSlice.actions.setAnnotationCategories({
//       categories: categoriesT1,
//       isPermanent: true,
//     })
//   );
//   productionStore.dispatch(
//     dataSlice.actions.setImages({ images: imagesT1, isPermanent: true })
//   );
//   productionStore.dispatch(
//     dataSlice.actions.setAnnotations({
//       annotations: annotationsT1,
//       isPermanent: true,
//     })
//   );

//   // imageViewerSlice.actions.setActiveImageId({ imageId: "", prevImageId: "", execSaga: true })

//   const serializedProject = serializeCOCOFile(
//     imagesT1,
//     annotationsT1,
//     categoriesT1
//   );

//   // T1 -> T2, piximi closed and new project started

//   productionStore.dispatch(dataSlice.actions.resetData());

//   // T2 - pre-deserialization

//   productionStore.dispatch(
//     dataSlice.actions.setAnnotationCategories({
//       categories: categoriesT2,
//       isPermanent: true,
//     })
//   );
//   productionStore.dispatch(
//     dataSlice.actions.setImages({ images: imagesT2, isPermanent: true })
//   );
//   productionStore.dispatch(
//     dataSlice.actions.setAnnotations({
//       annotations: annotationsT2,
//       isPermanent: true,
//     })
//   );

//   const { newCategories, annotations: deserializedAnnotations } =
//     deserializeCOCOFile(serializedProject, imagesT2, categoriesT2);

//   // T2 -> T3 dispatch deserialized project

//   productionStore.dispatch(
//     dataSlice.actions.addAnnotationCategories({
//       categories: newCategories,
//       isPermanent: true,
//     })
//   );
//   productionStore.dispatch(
//     dataSlice.actions.addAnnotations({
//       annotations: deserializedAnnotations,
//       isPermanent: true,
//     })
//   );

//   // imageViewerSlice.actions.setActiveImageId({ imageId: "", prevImageId: "", execSaga: true })

//   // T3 - after deserialization

//   const rootState = productionStore.getState();
//   const categoriesT3Actual = selectAllAnnotationCategories(rootState);
//   const imagesT3Actual = selectAllImages(rootState);
//   const annotationsT3Actual = selectAllAnnotations(rootState);

//   expect(categoriesT3Actual.length).toBe(categoriesT3Expected.length);
//   expect(imagesT3Actual.length).toBe(imagesT3Expected.length);
//   expect(annotationsT3Actual.length).toBe(annotationsT3Expected.length);

//   expect(categoriesT3Actual.map((c) => c.name)).toEqual(
//     categoriesT3Expected.map((c) => c.name)
//   );
//   expect(imagesT3Actual.map((im) => im.name)).toEqual(
//     imagesT3Expected.map((im) => im.name)
//   );

//   /*
//     Below tests do not look at encodedMask values because annotations will
//     differ slightly after going from polygon -> mask -> polygon,
//     as in this test, and in a hard to predict manner.

//     The number, location, and opening/closing point of points will
//     differ from original polygon to polygons from contour finding.

//     I'm sure there's some clever approximately equal way to compare
//     them, but the findContours already has a tests, so we assume
//     it's doing enough to test mask -> polygon conversions.

//     The easier test is: open a coco file in piximi to get
//     polygon -> mask annotations, look and see if they make sense,
//     save them in coco format to get mask -> polygon, and then
//     open up the saved file to see if it looks more or less the
//     same as the original.
//  */

//   // expect ids to be different, because they're uuid generated
//   // jest ignores undefined property keys
//   expect(
//     annotationsT3Actual.map((ann) => ({
//       ...ann,
//       id: undefined,
//       categoryId: undefined,
//       imageId: undefined,
//       encodedMask: undefined,
//     }))
//   ).toEqual(
//     annotationsT3Expected.map((ann) => ({
//       ...ann,
//       id: undefined,
//       categoryId: undefined,
//       imageId: undefined,
//       encodedMask: undefined,
//     }))
//   );
// });

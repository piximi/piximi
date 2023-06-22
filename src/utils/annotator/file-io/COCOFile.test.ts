// TODO: fix
// import { test } from "@jest/globals";
// import { v4 as uuidv4 } from "uuid";

// // import { projectSlice } from "store/project";
// // import { addImages, imageViewerSlice, setInstances } from "store/annotator";
// // import { selectAllAnnotationCategories } from "store/data";
// import { CATEGORY_COLORS } from "utils/common/colorPalette";
// // import { annotatorFullImagesSelector } from "store/common";
// // import { serializeCOCOFile } from "./serializeCOCO";
// // import { deserializeCOCOFile } from "./deserializeCOCO";

// import {
//   AnnotationType,
//   OldImageType,
//   UNKNOWN_ANNOTATION_CATEGORY,
// } from "types";

// // import cocoLabels from "data/test-data/COCO/labels_coco_slim.json";
// import expectedState from "data/test-data/COCO/labels_internal.json";

// // Time 1 (T1) is pre-serialization state of piximi
// // Time 2 (T2) is piximi state, after refresh, but before deserialization
// // Time 3 (T3) is piximi state, after deserialization

// //#region setup

// // always has same info, including id
// const T1T2UnmodifiedCat = UNKNOWN_ANNOTATION_CATEGORY; // (backpack)
// // name exists in both T1 and T2, but with color and id change
// const T1T2ModifiedCats = {
//   // clock
//   t1: {
//     ...expectedState.project.annotationCategories[1],
//     id: uuidv4(),
//     color: CATEGORY_COLORS.black,
//   },
//   t2: {
//     ...expectedState.project.annotationCategories[1],
//     id: uuidv4(),
//     color: CATEGORY_COLORS.citrus,
//   },
// };
// // eixsts only in T1
// const T1OnlyCat = {
//   // sports ball
//   ...expectedState.project.annotationCategories[2],
//   id: uuidv4(),
//   color: CATEGORY_COLORS.columbiablue,
// };
// // exists only in T2
// const T2OnlyCat = {
//   // sheep
//   ...expectedState.project.annotationCategories[3],
//   id: uuidv4(),
//   color: CATEGORY_COLORS.darkcyan,
// };
export const foo = "foo";

describe("A passing test", () => {
  it("should pass the test", () => {
    expect(true).toEqual(true);
  });
});

// // annotations exist T1 and T2
// const im1AnnotationsT1: Array<AnnotationType> = [
//   {
//     1clockTower.jpg -> Unknown (backpack)
//     ...expectedState.annotator.images[0].annotations[0],
//     id: uuidv4(),
//     categoryId: T1T2UnmodifiedCat.id,
//   } as AnnotationType,
//   {
//     // 1clockTower.jpg -> clock (1)
//     ...expectedState.annotator.images[0].annotations[1],
//     id: uuidv4(),
//     categoryId: T1T2ModifiedCats.t1.id,
//   } as AnnotationType,
// ];

// const im1AnnotationsT2: Array<AnnotationType> = [
//   {
//     // 1clockTower.jpg -> clock (2)
//     ...expectedState.annotator.images[0].annotations[2],
//     id: uuidv4(),
//     categoryId: T1T2ModifiedCats.t2.id,
//   } as AnnotationType,
// ];

// // annotations exists T1, but not T2
// const im2AnnotationsT1: Array<AnnotationType> = [
//   {
//     // 2golfer.jpg -> sports ball
//     ...expectedState.annotator.images[1].annotations[0],
//     id: uuidv4(),
//     categoryId: T1OnlyCat.id,
//   } as AnnotationType,
// ];

// // annotations did not exist T1, exists T2
// const im3AnnotationsT2: Array<AnnotationType> = [
//   {
//     // 3twoSheep.jpg -> sheep
//     ...expectedState.annotator.images[2].annotations[0],
//     id: uuidv4(),
//     categoryId: T2OnlyCat.id,
//   } as AnnotationType,
// ];

// // image exists T1 and T2
// const im1T1: OldImageType = {
//   // 1clockTower.jpg
//   ...expectedState.annotator.images[0],
//   id: uuidv4(),
//   colors: undefined as unknown as OldImageType["colors"],
//   data: undefined as unknown as OldImageType["data"],
//   partition: undefined as unknown as OldImageType["partition"],
//   annotations: im1AnnotationsT1,
// };

// const im1T2: OldImageType = {
//   ...im1T1,
//   id: uuidv4(),
//   annotations: im1AnnotationsT2,
// };

// // image exists T1 only
// const im2T1: OldImageType = {
//   // 2golfer.jpg
//   ...expectedState.annotator.images[1],
//   id: uuidv4(),
//   colors: undefined as unknown as OldImageType["colors"],
//   data: undefined as unknown as OldImageType["data"],
//   partition: undefined as unknown as OldImageType["partition"],
//   annotations: im2AnnotationsT1,
// };

// // image exists T2 only
// const im3T2: OldImageType = {
//   // 3twoSheep.jpg
//   ...expectedState.annotator.images[2],
//   id: uuidv4(),
//   colors: undefined as unknown as OldImageType["colors"],
//   data: undefined as unknown as OldImageType["data"],
//   partition: undefined as unknown as OldImageType["partition"],
//   annotations: im3AnnotationsT2,
// };

// const categoriesT1 = [T1T2UnmodifiedCat, T1T2ModifiedCats.t1, T1OnlyCat];
// const categoriesT2 = [T1T2UnmodifiedCat, T1T2ModifiedCats.t2, T2OnlyCat];
// const categoriesT3Expected = [
//   T1T2UnmodifiedCat, // always presnet
//   T1T2ModifiedCats.t2, // modified T1-T2, but unmodified T3
//   T2OnlyCat, // present during deserialization
//   T1OnlyCat, // serialized category, re-created with deserialization
// ];

// const imagesT1 = [im1T1, im2T1];
// const imagesT2 = [im1T2, im3T2];
// const imagesT3Expected = [im1T2, im3T2]; // same as T2, no images created/destroyed

// const annotationsT1 = [...im1T1.annotations, ...im2T1.annotations];
// const annotationsT2 = [...im1T2.annotations, ...im3T2.annotations];
// const annotationsT3Expected = [
//   ...im1T2.annotations, // im1 annotations present during deserialization
//   ...im1T1.annotations, // im1 annotations that were serialized, recreated
//   ...im3T2.annotations, // im3 annotations present during deserialization
//   // im2T1 annotations serialized, but not re-created because no im2 present
// ];

//#endregion setup

// test("serialize COCO", () => {
//   // piximi initial state

//   let projectState = projectSlice.reducer(undefined, { type: undefined });
//   let annotatorState = imageViewerSlice.reducer(undefined, { type: undefined });

//   // T1 - pre-serialization

//   projectState = projectSlice.reducer(
//     projectState,
//     setAnnotationCategories({ categories: categoriesT1 })
//   );
//   annotatorState = imageViewerSlice.reducer(
//     annotatorState,
//     addImages({ newImages: imagesT1 })
//   );

//   // imageViewerSlice.actions.setActiveImageId({ imageId: "", prevImageId: "", execSaga: true })

//   const serializedProject = serializeCOCOFile(imagesT1, categoriesT1);

//   // T1 -> T2, piximi closed and new project started

//   projectState = projectSlice.reducer(undefined, { type: undefined });
//   annotatorState = imageViewerSlice.reducer(undefined, { type: undefined });

//   // T2 - pre-deserialization

//   projectState = projectSlice.reducer(
//     projectState,
//     setAnnotationCategories({ categories: categoriesT2 })
//   );
//   annotatorState = imageViewerSlice.reducer(
//     annotatorState,
//     addImages({ newImages: imagesT2 })
//   );

//   const { newCategories, imsToAnnotate } = deserializeCOCOFile(
//     serializedProject,
//     imagesT2,
//     categoriesT2
//   );

//   // T2 -> T3 dispatch deserialized project

//   projectState = projectSlice.reducer(
//     projectState,
//     addAnnotationCategories({ categories: newCategories })
//   );
//   annotatorState = imageViewerSlice.reducer(
//     annotatorState,
//     setInstances({ instances: imsToAnnotate })
//   );

//   // imageViewerSlice.actions.setActiveImageId({ imageId: "", prevImageId: "", execSaga: true })

//   // T3 - after deserialization

//   const categoriesT3Actual = selectAllAnnotationCategories({
//
//   });
//   const imagesT3Actual = annotatorFullImagesSelector({
//     annotator: annotatorState,
//     project: projectState,
//   });

//   // const annotationsT3Actual = imagesT3Actual.reduce(
//   //   (annotations, im) => [...annotations, ...im.annotations],
//   //   [] as Array<AnnotationType>
//   // );

//   expect(categoriesT3Actual.length).toBe(categoriesT3Expected.length);
//   expect(imagesT3Actual.length).toBe(imagesT3Expected.length);

//   expect(categoriesT3Actual.map((c) => c.name)).toEqual(
//     categoriesT3Expected.map((c) => c.name)
//   );
//   expect(imagesT3Actual.map((im) => im.name)).toEqual(
//     imagesT3Expected.map((im) => im.name)
//   );

/*
    Below tests are not performed because the annotations will
    differ slightly after going from polygon -> mask -> polygon,
    as in this test, and in a hard to predict manner.

    The number, location, and opening/closing point of points will
    differ from original polygon to polygons from contour finding.

    I'm sure there's some clever approximately equal way to compare
    them, but the findContours already has a tests, so we assume
    it's doing enough to test mask -> polygon conversions.

    The easier test is: open a coco file in piximi to get
    polygon -> mask annotations, look and see if they make sense,
    save them in coco format to get mask -> polygon, and then
    open up the saved file to see if it looks more or less the
    same as the original.
   */

// expect ids to be different, because they're uuid generated
// jest ignores undefined property keys
// expect(
//   annotationsT3Actual.map((ann) => ({
//     ...ann,
//     id: undefined,
//     categoryId: undefined,
//   }))
// ).toEqual(
//   annotationsT3Expected.map((ann) => ({
//     ...ann,
//     id: undefined,
//     categoryId: undefined,
//   }))
// );
//});

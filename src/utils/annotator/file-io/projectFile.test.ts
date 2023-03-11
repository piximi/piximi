import { test } from "@jest/globals";
import { v4 as uuidv4 } from "uuid";

import {
  projectSlice,
  addAnnotationCategories,
  setAnnotationCategories,
  annotationCategoriesSelector,
} from "store/project";
import { addImages, AnnotatorSlice, setInstances } from "store/annotator";
import { serializeProject } from "./serializeProject";
import {
  EncodedAnnotationType,
  ImageType,
  UNKNOWN_ANNOTATION_CATEGORY,
} from "types";
import { CATEGORY_COLORS } from "utils/common/colorPalette";
import { deserializeProjectFile } from "./deserializeProject";
import { annotatorFullImagesSelector } from "store/common";

// Time 1 (T1) is pre-serialization state of piximi
// Time 2 (T2) is piximi state, after refresh, but before deserialization
// Time 3 (T3) is piximi state, after deserialization

//#region setup

// always has same info, including id
const T1T2UnmodifiedCat = UNKNOWN_ANNOTATION_CATEGORY;
// name exists in both T1 and T2, but with color and id change
const _T1T2ModifiedCat = {
  color: CATEGORY_COLORS.black,
  id: uuidv4(),
  name: "cat 1",
  visible: true,
};
const T1T2ModifiedCats = {
  t1: _T1T2ModifiedCat,
  t2: { ..._T1T2ModifiedCat, id: uuidv4(), color: CATEGORY_COLORS.citrus },
};
// eixsts only in T1
const T1OnlyCat = {
  color: CATEGORY_COLORS.columbiablue,
  id: uuidv4(),
  name: "cat 2",
  visible: false,
};
// exists only in T2
const T2OnlyCat = {
  color: CATEGORY_COLORS.darkcyan,
  id: uuidv4(),
  name: "cat 3",
  visible: true,
};

// annotations exist T1 and T2
const im1AnnotationsT1: Array<EncodedAnnotationType> = [
  {
    categoryId: T1T2UnmodifiedCat.id, //unknown
    id: uuidv4(),
    mask: [
      40, 13, 86, 14, 85, 19, 77, 26, 72, 29, 70, 30, 68, 34, 63, 38, 59, 44,
      56, 44, 54, 47, 49, 51, 46, 57, 43, 57, 40, 63, 36, 65, 35, 65, 34, 69,
      29, 72, 28, 75, 25, 75, 24, 77, 23, 79, 19, 82, 18, 82, 18, 82, 18, 83,
      16, 84, 16, 85, 15, 86, 14, 87, 12, 88, 12, 89, 11, 89, 11, 89, 11, 89,
      11, 89, 9, 93, 7, 94, 6, 94, 6, 94, 6, 95, 5, 95, 5, 96, 4, 97, 3, 97, 3,
      97, 3, 97, 3, 97, 3, 98, 2, 98, 2, 98, 2, 98, 2, 1500, 2, 98, 2, 98, 3,
      97, 3, 97, 4, 96, 4, 96, 6, 94, 6, 94, 7, 93, 7, 93, 9, 91, 9, 89, 12, 88,
      12, 88, 13, 87, 15, 85, 15, 85, 16, 84, 16, 84, 16, 84, 17, 83, 17, 82,
      20, 80, 20, 80, 21, 79, 22, 78, 22, 78, 24, 76, 25, 75, 25, 73, 28, 72,
      31, 68, 32, 68, 34, 66, 35, 64, 37, 61, 39, 61, 41, 58, 46, 53, 47, 53,
      51, 47, 61, 37, 76, 22, 79, 21, 83, 16, 86, 12, 20,
    ],
    plane: 0,
    boundingBox: [1074, 904, 1174, 1018],
  },
  {
    categoryId: T1T2ModifiedCats.t1.id,
    id: uuidv4(),
    mask: [
      28, 7, 85, 11, 9, 7, 66, 12, 7, 8, 65, 17, 3, 12, 61, 33, 58, 37, 56, 37,
      56, 38, 54, 42, 51, 42, 49, 47, 46, 51, 41, 57, 36, 57, 35, 61, 30, 64,
      28, 67, 26, 68, 22, 71, 21, 73, 17, 79, 14, 79, 13, 84, 6, 88, 5, 88, 5,
      88, 4, 89, 2, 91, 2, 91, 1, 92, 1, 743, 1, 92, 2, 91, 2, 91, 4, 89, 5, 88,
      11, 82, 11, 82, 11, 82, 12, 81, 12, 81, 12, 81, 12, 81, 12, 81, 12, 81,
      12, 81, 12, 81, 12, 81, 12, 81, 11, 82, 9, 84, 9, 84, 9, 84, 9, 84, 9, 84,
      10, 83, 20, 73, 20, 72, 21, 72, 21, 72, 21, 72, 21, 71, 22, 71, 22, 71,
      21, 70, 21, 71, 22, 70, 23, 69, 23, 69, 24, 68, 25, 65, 28, 65, 27, 65,
      28, 65, 28, 65, 28, 65, 28, 65, 28, 65, 27, 66, 26, 67, 25, 68, 24, 69,
      24, 70, 23, 27, 9, 34, 25, 22, 15, 31, 28, 16, 22, 27, 28, 16, 22, 27, 28,
      15, 26, 24, 28, 14, 28, 22, 29, 12, 31, 21, 29, 12, 32, 20, 29, 11, 34,
      17, 79, 13, 80, 13, 81, 12, 16,
    ],
    plane: 0,
    boundingBox: [985, 820, 1078, 922],
  },
  {
    categoryId: T1OnlyCat.id,
    id: uuidv4(),
    mask: [
      44, 11, 76, 28, 74, 28, 73, 31, 68, 34, 66, 37, 65, 37, 64, 39, 62, 42,
      57, 45, 57, 46, 53, 49, 51, 53, 46, 56, 46, 57, 43, 59, 16, 3, 23, 63, 13,
      4, 22, 63, 13, 4, 21, 65, 12, 6, 17, 71, 7, 8, 15, 87, 15, 87, 15, 88, 13,
      89, 13, 91, 11, 91, 11, 91, 11, 92, 8, 94, 8, 95, 7, 95, 7, 97, 5, 98, 4,
      98, 4, 99, 3, 99, 3, 100, 2, 101, 1, 101, 1, 306, 2, 100, 2, 100, 2, 100,
      2, 100, 2, 100, 2, 100, 2, 100, 2, 100, 2, 99, 3, 99, 3, 99, 3, 99, 3, 99,
      3, 98, 4, 97, 5, 97, 5, 96, 6, 96, 6, 96, 6, 96, 6, 96, 6, 96, 6, 96, 6,
      96, 7, 95, 7, 95, 7, 95, 7, 95, 8, 94, 8, 94, 8, 94, 10, 92, 10, 92, 11,
      91, 11, 91, 12, 90, 12, 90, 14, 88, 14, 88, 15, 87, 15, 87, 15, 87, 15,
      87, 17, 85, 17, 85, 17, 84, 18, 84, 19, 83, 19, 83, 19, 83, 20, 80, 22,
      80, 22, 80, 24, 78, 25, 76, 26, 76, 27, 74, 31, 71, 32, 68, 35, 67, 37,
      64, 40, 61, 43, 56, 46, 56, 48, 50, 53, 41, 62, 39, 65, 35, 68, 33, 70,
      30, 72, 30, 74, 26, 77, 23, 80, 21, 81, 20, 40,
    ],
    plane: 0,
    boundingBox: [164, 884, 266, 1001],
  },
];

const im1AnnotationsT2: Array<EncodedAnnotationType> = [
  {
    categoryId: T1T2UnmodifiedCat.id,
    id: uuidv4(),
    mask: [
      28, 7, 56, 11, 45, 21, 41, 24, 38, 26, 36, 28, 35, 30, 31, 35, 28, 35, 27,
      37, 24, 40, 23, 40, 22, 41, 21, 42, 21, 43, 18, 45, 18, 45, 17, 46, 16,
      47, 15, 49, 13, 51, 12, 52, 10, 54, 9, 55, 8, 57, 6, 57, 6, 58, 5, 58, 5,
      59, 4, 59, 4, 59, 4, 59, 4, 59, 4, 59, 4, 59, 4, 59, 4, 59, 3, 60, 3, 60,
      3, 60, 3, 60, 3, 60, 2, 61, 2, 61, 2, 61, 2, 61, 2, 61, 2, 61, 2, 61, 2,
      61, 2, 61, 3, 60, 3, 60, 3, 60, 3, 60, 4, 59, 4, 59, 5, 58, 7, 56, 8, 55,
      8, 55, 8, 55, 8, 54, 9, 53, 8, 55, 7, 55, 8, 54, 549, 53, 9, 53, 10, 52,
      10, 52, 11, 51, 11, 51, 11, 51, 12, 50, 12, 50, 13, 49, 14, 47, 17, 44,
      19, 43, 21, 40, 24, 38, 25, 36, 28, 34, 30, 32, 32, 29, 35, 27, 43, 17,
      50, 12, 33,
    ],
    plane: 0,
    boundingBox: [138, 294, 201, 384],
  },
];

// annotations exists T1, but not T2
const im2AnnotationsT1: Array<EncodedAnnotationType> = [
  {
    categoryId: T1T2UnmodifiedCat.id, // unknown
    id: uuidv4(),
    mask: [
      114, 1, 66, 1, 66, 2, 65, 3, 64, 3, 64, 3, 64, 4, 64, 3, 64, 3, 64, 4, 40,
      2, 21, 4, 38, 5, 20, 5, 35, 9, 17, 7, 34, 9, 17, 7, 33, 12, 13, 11, 31,
      13, 10, 14, 30, 39, 28, 39, 28, 39, 28, 39, 28, 40, 27, 40, 27, 40, 27,
      41, 26, 42, 25, 44, 23, 45, 22, 45, 22, 46, 21, 46, 21, 46, 22, 46, 21,
      46, 21, 46, 21, 46, 20, 46, 21, 46, 20, 46, 20, 47, 2, 3, 14, 47, 3, 5,
      11, 47, 4, 6, 9, 46, 6, 8, 2, 27, 10, 13, 8, 33, 13, 12, 11, 29, 16, 9,
      17, 23, 20, 4, 22, 20, 51, 16, 54, 13, 56, 9, 59, 8, 60, 6, 41,
    ],
    plane: 0,
    boundingBox: [126, 40, 193, 93],
  },
  {
    categoryId: T1T2ModifiedCats.t1.id,
    id: uuidv4(),
    mask: [
      3, 4, 8, 7, 5, 9, 3, 11, 2, 12, 1, 26, 1, 12, 2, 11, 3, 10, 3, 10, 4, 9,
      5, 8, 4, 8, 4, 6, 7, 5, 5,
    ],
    plane: 0,
    boundingBox: [255, 287, 268, 303],
  },
  {
    categoryId: T1OnlyCat.id,
    id: uuidv4(),
    mask: [
      7, 3, 9, 5, 7, 6, 7, 7, 6, 7, 9, 4, 8, 5, 7, 7, 5, 8, 4, 9, 3, 9, 3, 10,
      2, 11, 1, 11, 2, 11, 2, 10, 4, 9, 4, 8, 6, 6, 8, 3, 7,
    ],
    plane: 0,
    boundingBox: [239, 285, 252, 305],
  },
];

// annotations did not exist T1, exists T2
const im3AnnotationsT2: Array<EncodedAnnotationType> = [
  {
    categoryId: T1T2UnmodifiedCat.id, // unknown
    id: uuidv4(),
    mask: [4, 2, 12, 10, 3, 13, 1, 89, 1, 13, 9, 5, 11, 3, 4],
    plane: 0,
    boundingBox: [261, 311, 276, 323],
  },
  {
    categoryId: T1T2ModifiedCats.t2.id,
    id: uuidv4(),
    mask: [
      5, 5, 5, 9, 4, 10, 2, 12, 1, 12, 1, 12, 1, 11, 1, 12, 1, 39, 1, 12, 2, 10,
      4, 8, 8, 5, 9, 3, 10, 2, 4,
    ],
    plane: 0,
    boundingBox: [281, 289, 294, 306],
  },
  {
    categoryId: T2OnlyCat.id, // category exists T2 only
    id: uuidv4(),
    mask: [
      9, 2, 12, 8, 9, 10, 7, 13, 4, 16, 1, 88, 2, 15, 4, 13, 6, 10, 9, 4, 2, 3,
      5,
    ],
    plane: 0,
    boundingBox: [277, 264, 295, 278],
  },
];

// image exists T1 and T2
const im1T1: ImageType = {
  annotations: im1AnnotationsT1,
  id: uuidv4(),
  name: "im1.png",
  shape: {
    planes: 1,
    height: 1200,
    width: 1600,
    channels: 3,
  },
  // below not needed for serializing annotations file so fake it
  bitDepth: 8,
  activePlane: 0,
  // TODO: COCO - add serialization of Colors?
  colors: undefined as unknown as ImageType["colors"],
  src: "",
  // full image props, also not needed so fake it
  categoryId: "",
  data: undefined as unknown as ImageType["data"],
  partition: undefined as unknown as ImageType["partition"],
  visible: true,
};

const im1T2: ImageType = {
  annotations: im1AnnotationsT2,
  id: uuidv4(),
  name: "im1.png",
  shape: {
    planes: 1,
    height: 1200,
    width: 1600,
    channels: 3,
  },
  // below not needed for serializing annotations file so fake it
  bitDepth: 8,
  activePlane: 0,
  colors: undefined as unknown as ImageType["colors"],
  src: "",
  // full image props, also not needed so fake it
  categoryId: "",
  data: undefined as unknown as ImageType["data"],
  partition: undefined as unknown as ImageType["partition"],
  visible: true,
};

// image exists T1 only
const im2T1: ImageType = {
  annotations: im2AnnotationsT1,
  id: uuidv4(),
  name: "im2.png",
  shape: {
    planes: 1,
    height: 512,
    width: 512,
    channels: 3,
  },
  // below not needed for serializing annotations file so fake it
  bitDepth: 8,
  activePlane: 0,
  colors: undefined as unknown as ImageType["colors"],
  src: "",
  // full image props, also not needed so fake it
  categoryId: "",
  data: undefined as unknown as ImageType["data"],
  partition: undefined as unknown as ImageType["partition"],
  visible: true,
};

// image exists T2 only
const im3T2: ImageType = {
  annotations: im3AnnotationsT2,
  id: uuidv4(),
  name: "im3.png",
  shape: {
    planes: 1,
    height: 512,
    width: 512,
    channels: 3,
  },
  // below not needed for serializing annotations file so fake it
  bitDepth: 8,
  activePlane: 0,
  colors: undefined as unknown as ImageType["colors"],
  src: "",
  // full image props, also not needed so fake it
  categoryId: "",
  data: undefined as unknown as ImageType["data"],
  partition: undefined as unknown as ImageType["partition"],
  visible: true,
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

  const serializedProject = serializeProject(imagesT1, categoriesT1);

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

  const { newCategories, imsToAnnotate } = deserializeProjectFile(
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
    [] as Array<EncodedAnnotationType>
  );

  expect(categoriesT3Actual.length).toBe(categoriesT3Expected.length);
  expect(imagesT3Actual.length).toBe(imagesT3Expected.length);

  expect(categoriesT3Actual.map((c) => c.name)).toEqual(
    categoriesT3Expected.map((c) => c.name)
  );
  expect(imagesT3Actual.map((im) => im.name)).toEqual(
    imagesT3Expected.map((im) => im.name)
  );

  // expect category and annotation ids to be different, because they're uuid generated
  // jest ignores undefined property keys
  expect(
    annotationsT3Actual.map((ann) => ({
      ...ann,
      id: undefined,
      categoryId: undefined,
    }))
  ).toEqual(
    annotationsT3Expected.map((ann) => ({
      ...ann,
      id: undefined,
      categoryId: undefined,
    }))
  );
});

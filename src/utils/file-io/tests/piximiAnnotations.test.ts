import { test } from "@jest/globals";
import Image from "image-js";
import * as tf from "@tensorflow/tfjs";

import { productionStore } from "store";
import { dataSlice } from "store/data";
import { DeferredEntityState } from "store/entities";
import {
  selectObjectCategoryDict,
  selectObjectKindDict,
  selectSplitThingDict,
} from "store/data/selectors";

import { data } from "data/test-data/annotatorToolsTestData.json";

import { generateUUID, isUnknownCategory } from "utils/common/helpers";

import { serializePiximiAnnotations } from "../serialize/serializePiximiAnnotations";
import { deserializePiximiAnnotations } from "../deserialize";

import { SerializedFileTypeV2 } from "../types";
import { CATEGORY_COLORS } from "utils/common/constants";
import {
  Kind,
  AnnotationObject,
  Category,
  ImageObject,
} from "store/data/types";
tf.setBackend("cpu");

//below image fields not needed for serializing annotations file so fake it
const dummyImFields = {
  bitDepth: 8,
  activePlane: 0,
  colors: undefined as unknown as ImageObject["colors"],
  src: data.image,
  kind: "Image",
  data: undefined as unknown as ImageObject["data"],
  // full image props, also not needed so fake it
  categoryId: "",
  partition: undefined as unknown as ImageObject["partition"],
  visible: true,
  containing: [],
};

// Time 1 (T1) is pre-serialization state of piximi

// image exists T1 and T2
const im1T1: ImageObject = {
  ...dummyImFields,
  id: generateUUID(),
  name: "im1.png",
  shape: {
    planes: 1,
    height: 1200,
    width: 1600,
    channels: 3,
  },
};

// image exists T1 only
const im2T1: ImageObject = {
  ...dummyImFields,
  id: generateUUID(),
  name: "im2.png",
  shape: {
    planes: 1,
    height: 512,
    width: 512,
    channels: 3,
  },
};

const k1T1: Kind = {
  id: "kT1",
  categories: [],
  containing: [],
  unknownCategoryId: "",
};

// eixsts only in T1
const uC1T1: Category = {
  color: CATEGORY_COLORS.columbiablue,
  id: generateUUID({ definesUnknown: true }),
  name: "unknown",
  kind: "kT1",
  containing: [],
  visible: false,
};

const c1T1: Category = {
  color: CATEGORY_COLORS.darkcyan,
  id: generateUUID(),
  name: "cat 1",
  kind: "kT1",
  containing: [],
  visible: true,
};

k1T1.categories = [uC1T1.id, c1T1.id];
k1T1.unknownCategoryId = uC1T1.id;

const im1AnnotationsT1: Array<AnnotationObject> = [
  {
    imageId: im1T1.id,
    name: `${im1T1.name}-${k1T1.id}_0`,
    src: "",
    data: undefined as unknown as AnnotationObject["data"],
    bitDepth: im1T1.bitDepth,
    kind: "kT1",
    categoryId: uC1T1.id, //unknown
    id: generateUUID(),
    encodedMask: [
      3, 4, 8, 7, 5, 9, 3, 11, 2, 12, 1, 26, 1, 12, 2, 11, 3, 10, 3, 10, 4, 9,
      5, 8, 4, 8, 4, 6, 7, 5, 5,
    ],
    activePlane: 0,
    boundingBox: [255, 287, 268, 303],
    shape: {
      width: 268 - 255,
      height: 303 - 287,
      channels: im1T1.shape.channels,
      planes: 1,
    },
    partition: undefined as unknown as AnnotationObject["partition"],
  },
  {
    imageId: im1T1.id,
    name: `${im1T1.name}-${k1T1.id}_1`,
    src: "",
    kind: "kT1",
    data: undefined as unknown as AnnotationObject["data"],
    bitDepth: im1T1.bitDepth,
    categoryId: c1T1.id, // cat 1
    id: generateUUID(),
    encodedMask: [
      3, 4, 8, 7, 5, 9, 3, 11, 2, 12, 1, 26, 1, 12, 2, 11, 3, 10, 3, 10, 4, 9,
      5, 8, 4, 8, 4, 6, 7, 5, 5,
    ],
    activePlane: 0,
    boundingBox: [255, 287, 268, 303],
    shape: {
      width: 268 - 255,
      height: 303 - 287,
      channels: im1T1.shape.channels,
      planes: 1,
    },
    partition: undefined as unknown as AnnotationObject["partition"],
  },
];
im1T1.containing = im1AnnotationsT1.map((ann) => ann.id);
k1T1.containing = im1AnnotationsT1.map((ann) => ann.id);
uC1T1.containing = [im1AnnotationsT1[0].id];
c1T1.containing = [im1AnnotationsT1[1].id];

const t1Categories = [uC1T1, c1T1];
const t1Kinds = [k1T1];
const t1Ims = [im1T1, im2T1];
const t1Objects = [...im1AnnotationsT1];

describe("serializes piximi project", () => {
  let serializedPiximi: SerializedFileTypeV2;

  beforeAll(async () => {
    serializedPiximi = serializePiximiAnnotations(
      [im1T1, im2T1],
      im1AnnotationsT1,
      [uC1T1, c1T1],
      [k1T1]
    );
    serializedPiximi.version = "0.2.0";
  });
  test("has version", () => {
    expect(serializedPiximi.version).toBe("0.2.0");
  });
  test("properly serialized images", () => {
    expect(serializedPiximi.images.length).toBe(t1Ims.length);
    expect(serializedPiximi.images).toEqual(
      t1Ims.map((im) => ({ id: im.id, name: im.name }))
    );
  });
  test("properly serialized kinds", () => {
    const kinds = serializedPiximi.kinds;
    expect(kinds.length).toBe(t1Kinds.length);
    expect(kinds).toEqual(t1Kinds);
  });
  test("properly serialized categories", () => {
    const categories = serializedPiximi.categories;
    expect(categories.length).toBe(t1Categories.length);
    expect(categories).toEqual(t1Categories);
  });
  test("properly serialized objects", () => {
    const objects = serializedPiximi.annotations;
    expect(objects.length).toBe(t1Objects.length);
    expect(objects).toEqual(
      t1Objects.map((ob) => {
        const { data, src, shape, encodedMask, bitDepth, ...rest } = ob;
        return {
          ...rest,
          shape: Object.values(shape),
          mask: ob.encodedMask.join(" "),
        };
      })
    );
  });
});

describe("deserialize into empty project (no matching images)", () => {
  let newAnnotations: AnnotationObject[];
  let newKinds: Kind[];
  let newCategories: Category[];

  beforeAll(async () => {
    const serializedPiximi = serializePiximiAnnotations(
      [im1T1, im2T1],
      im1AnnotationsT1,
      [uC1T1, c1T1],
      [k1T1]
    );
    serializedPiximi.version = "0.2.0";
    productionStore.dispatch(dataSlice.actions.resetData());
    const rootState = productionStore.getState();
    const { images } = selectSplitThingDict(rootState);
    const kinds = selectObjectKindDict(rootState);
    const categories = selectObjectCategoryDict(rootState);

    const deserialized = await deserializePiximiAnnotations(
      serializedPiximi,
      images,
      categories,
      kinds
    );
    newAnnotations = deserialized.newAnnotations;
    newKinds = deserialized.newKinds;
    newCategories = deserialized.newCategories;
  });
  test("should return empty annotation array", () => {
    expect(newAnnotations.length).toBe(0);
  });
  test("should return empty kind array", () => {
    expect(newKinds.length).toBe(0);
  });
  test("should return empty category array", () => {
    expect(newCategories.length).toBe(0);
  });
});

describe("deserialize into project with matching image, no matching kinds or categories", () => {
  let newAnnotations: AnnotationObject[];
  let newKinds: Kind[];
  let newCategories: Category[];

  beforeAll(async () => {
    const serializedPiximi = serializePiximiAnnotations(
      [im1T1, im2T1],
      im1AnnotationsT1,
      [uC1T1, c1T1],
      [k1T1]
    );
    serializedPiximi.version = "0.2.0";
    const image = await Image.load(im1T1.src);
    const imData = tf.browser.fromPixels(image).expandDims(0) as tf.Tensor4D;
    im1T1.data = imData;
    const thingsT2 = [...t1Ims].reduce(
      (
        entities: DeferredEntityState<AnnotationObject | ImageObject>,
        thing
      ) => {
        entities.ids.push(thing.id);
        entities.entities[thing.id] = { saved: thing, changes: {} };
        return entities;
      },
      { ids: [], entities: {} }
    );
    const kindsT2 = { ids: [], entities: {} };

    const categoriesT2 = { ids: [], entities: {} };

    productionStore.dispatch(dataSlice.actions.resetData());
    productionStore.dispatch(
      dataSlice.actions.initializeState({
        data: { things: thingsT2, categories: categoriesT2, kinds: kindsT2 },
      })
    );

    const rootState = productionStore.getState();
    const { images } = selectSplitThingDict(rootState);
    const kinds = selectObjectKindDict(rootState);
    const categories = selectObjectCategoryDict(rootState);

    const deserialized = await deserializePiximiAnnotations(
      serializedPiximi,
      images,
      categories,
      kinds
    );
    newAnnotations = deserialized.newAnnotations;
    newKinds = deserialized.newKinds;
    newCategories = deserialized.newCategories;
  });
  test("should return all new kinds", () => {
    expect(newKinds.length).toBe(t1Kinds.length);
    expect(newKinds).toEqual(t1Kinds);
  });
  test("should return all new categories", () => {
    expect(newCategories.length).toBe(t1Categories.length);
    expect(newCategories).toEqual(t1Categories);
  });
  test("should return all new annotations", () => {
    expect(newAnnotations.length).toBe(t1Objects.length);
    expect(
      newAnnotations.map((ann) => ({
        categoryId: ann.categoryId,
        kind: ann.kind,
      }))
    ).toEqual(
      im1AnnotationsT1.map((ann) => ({
        categoryId: ann.categoryId,
        kind: ann.kind,
      }))
    );
  });
});

describe("deserialize into project with matching image, matching kind", () => {
  let newAnnotations: AnnotationObject[];
  let newKinds: Kind[];
  let newCategories: Category[];
  let t2Kinds: Kind[];

  beforeAll(async () => {
    const serializedPiximi = serializePiximiAnnotations(
      [im1T1, im2T1],
      im1AnnotationsT1,
      [uC1T1, c1T1],
      [k1T1]
    );
    serializedPiximi.version = "0.2.0";

    const k1T2: Kind = {
      id: "kT1",
      categories: [],
      containing: [],
      unknownCategoryId: "",
    };

    // eixsts only in T1
    const uC1T2: Category = {
      color: CATEGORY_COLORS.columbiablue,
      id: generateUUID({ definesUnknown: true }),
      name: "unknown",
      kind: "kT1",
      containing: [],
      visible: false,
    };
    k1T2.categories = [uC1T2.id];
    k1T2.unknownCategoryId = uC1T2.id;
    const image = await Image.load(im1T1.src);
    const imData = tf.browser.fromPixels(image).expandDims(0) as tf.Tensor4D;
    const im1T2: ImageObject = { ...im1T1, containing: [], data: imData };
    const thingsT2 = [im1T2].reduce(
      (
        entities: DeferredEntityState<AnnotationObject | ImageObject>,
        thing
      ) => {
        entities.ids.push(thing.id);
        entities.entities[thing.id] = { saved: thing, changes: {} };
        return entities;
      },
      { ids: [], entities: {} }
    );
    const kindsT2 = [k1T2].reduce(
      (entities: DeferredEntityState<Kind>, kind) => {
        entities.ids.push(kind.id);
        entities.entities[kind.id] = { saved: kind, changes: {} };
        return entities;
      },
      { ids: [], entities: {} }
    );

    const categoriesT2 = [uC1T2].reduce(
      (entities: DeferredEntityState<Category>, category) => {
        entities.ids.push(category.id);
        entities.entities[category.id] = { saved: category, changes: {} };
        return entities;
      },
      { ids: [], entities: {} }
    );

    productionStore.dispatch(dataSlice.actions.resetData());
    productionStore.dispatch(
      dataSlice.actions.initializeState({
        data: { things: thingsT2, categories: categoriesT2, kinds: kindsT2 },
      })
    );

    const rootState = productionStore.getState();
    const { images } = selectSplitThingDict(rootState);
    const kinds = selectObjectKindDict(rootState);
    const categories = selectObjectCategoryDict(rootState);
    t2Kinds = Object.values(kinds);

    const deserialized = await deserializePiximiAnnotations(
      serializedPiximi,
      images,
      categories,
      kinds
    );
    newAnnotations = deserialized.newAnnotations;
    newKinds = deserialized.newKinds;
    newCategories = deserialized.newCategories;
  });
  test("should return no new kinds", () => {
    expect(newKinds.length).toBe(0);
  });
  test("should return one new category", () => {
    expect(newCategories.length).toBe(1);
    expect(newCategories).toEqual([c1T1]);
  });
  test("should return all new annotations", () => {
    expect(newAnnotations.length).toBe(t1Objects.length);
  });
  test("annotations with unknown categories should be updated to existing kind's unknown category", () => {
    const existingKindUnknownId = t2Kinds[0].unknownCategoryId;
    expect(
      newAnnotations.some(
        (ann) =>
          isUnknownCategory(ann.categoryId) &&
          ann.categoryId !== existingKindUnknownId
      )
    ).toBeFalsy();
  });
});

describe("deserialize into project with matching image, matching kind, and matching category", () => {
  let newAnnotations: AnnotationObject[];
  let newKinds: Kind[];
  let newCategories: Category[];
  let t2categories: Category[];

  beforeAll(async () => {
    const serializedPiximi = serializePiximiAnnotations(
      [im1T1, im2T1],
      im1AnnotationsT1,
      [uC1T1, c1T1],
      [k1T1]
    );
    serializedPiximi.version = "0.2.0";

    const k1T2: Kind = {
      id: "kT1",
      categories: [],
      containing: [],
      unknownCategoryId: "",
    };

    // eixsts only in T1
    const uC1T2: Category = {
      color: CATEGORY_COLORS.columbiablue,
      id: generateUUID({ definesUnknown: true }),
      name: "unknown",
      kind: "kT1",
      containing: [],
      visible: false,
    };
    const c1T2: Category = {
      color: CATEGORY_COLORS.columbiablue,
      id: generateUUID({ definesUnknown: true }),
      name: "cat 1",
      kind: "kT1",
      containing: [],
      visible: false,
    };
    k1T2.categories = [uC1T2.id, c1T2.id];
    k1T2.unknownCategoryId = uC1T2.id;
    const image = await Image.load(im1T1.src);
    const imData = tf.browser.fromPixels(image).expandDims(0) as tf.Tensor4D;
    const im1T2: ImageObject = { ...im1T1, containing: [], data: imData };
    const thingsT2 = [im1T2].reduce(
      (
        entities: DeferredEntityState<AnnotationObject | ImageObject>,
        thing
      ) => {
        entities.ids.push(thing.id);
        entities.entities[thing.id] = { saved: thing, changes: {} };
        return entities;
      },
      { ids: [], entities: {} }
    );
    const kindsT2 = [k1T2].reduce(
      (entities: DeferredEntityState<Kind>, kind) => {
        entities.ids.push(kind.id);
        entities.entities[kind.id] = { saved: kind, changes: {} };
        return entities;
      },
      { ids: [], entities: {} }
    );

    const categoriesT2 = [uC1T2, c1T2].reduce(
      (entities: DeferredEntityState<Category>, category) => {
        entities.ids.push(category.id);
        entities.entities[category.id] = { saved: category, changes: {} };
        return entities;
      },
      { ids: [], entities: {} }
    );

    productionStore.dispatch(dataSlice.actions.resetData());
    productionStore.dispatch(
      dataSlice.actions.initializeState({
        data: { things: thingsT2, categories: categoriesT2, kinds: kindsT2 },
      })
    );

    const rootState = productionStore.getState();
    const { images } = selectSplitThingDict(rootState);
    const kinds = selectObjectKindDict(rootState);
    const categories = selectObjectCategoryDict(rootState);
    t2categories = Object.values(categories);

    const deserialized = await deserializePiximiAnnotations(
      serializedPiximi,
      images,
      categories,
      kinds
    );
    newAnnotations = deserialized.newAnnotations;
    newKinds = deserialized.newKinds;
    newCategories = deserialized.newCategories;
  });
  test("should return no new kinds", () => {
    expect(newKinds.length).toBe(0);
  });
  test("should return no new categories", () => {
    expect(newCategories.length).toBe(0);
  });
  test("should return all new annotations", () => {
    expect(newAnnotations.length).toBe(t1Objects.length);
  });
  test("category ids of new annotations should match existing category ids", () => {
    expect(
      newAnnotations.every((ann) =>
        t2categories.map((c) => c.id).includes(ann.categoryId)
      )
    ).toBeTruthy();
  });
});

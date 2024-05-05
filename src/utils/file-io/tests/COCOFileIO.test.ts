import { test } from "@jest/globals";
import Image from "image-js";
import * as tf from "@tensorflow/tfjs";

import { productionStore } from "store/";
import { dataSlice } from "store/data";
import {
  selectObjectCategoryDict,
  selectObjectKindDict,
  selectSplitThingDict,
} from "store/data/selectors";

import initialState from "data/test-data/COCO/labels_internal.json";

import { fileFromPath } from "utils/file-io/nodeImageHelper";
import {
  convertArrayToShape,
  generateUUID,
  getPropertiesFromImageSync,
} from "utils/common/helpers";

import { serializeCOCOFile } from "../serialize/serializeCOCO";
import { deserializeCOCOFile } from "../deserialize/deserializeCOCO";

import { DeferredEntityState } from "store/entities";
import { Partition } from "utils/models/enums";
import { SerializedCOCOFileType } from "../types";
import { CATEGORY_COLORS } from "utils/common/constants";
import {
  Kind,
  AnnotationObject,
  Category,
  ImageObject,
} from "store/data/types";

tf.setBackend("cpu");
const imDataMap: Record<string, string> = {
  "1clockTower.jpg": "src/data/test-data/COCO/1clockTower.jpg",
  "2golfer.jpg": "src/data/test-data/COCO/2golfer.jpg",
  "3twoSheep.jpg": "src/data/test-data/COCO/3twoSheep.jpg",
};

const imagesT1: ImageObject[] = [];
const initialImages = initialState.annotator.images;
const annotationsT1: AnnotationObject[] = [];
const kindsT1: Kind[] = initialState.project.kinds;
const categoriesT1: Category[] = initialState.project.categories;

beforeAll(async () => {
  for await (const image of initialImages) {
    const { data, annotations, partition, colors, ...buildImage } = image;
    const imPath = imDataMap[image.name];
    const imFile = await fileFromPath(imPath, "image/jpeg");
    const imBuffer = await imFile.arrayBuffer();
    const rawImage = await Image.load(imBuffer);
    const imSrc = rawImage.toDataURL();
    const imData = tf.browser.fromPixels(rawImage).expandDims(0) as tf.Tensor4D;
    const finalImage = {
      ...buildImage,
      src: imSrc,
      data: imData,
      containing: image.annotations.map((a) => a.id),
      partition: Partition.Unassigned,
      colors: undefined as unknown as ImageObject["colors"],
    } as ImageObject;
    imagesT1.push(finalImage);
    for (const annotation of image.annotations) {
      const { plane, mask, boundingBox, ...buildAnn } = annotation;
      const imageProperties = getPropertiesFromImageSync(rawImage, finalImage, {
        boundingBox,
      });

      const finalAnn = {
        ...buildAnn,
        ...imageProperties,
        shape: convertArrayToShape(imageProperties.data.shape),
        encodedMask: mask,
        activePlane: 0,
        bitDepth: image.bitDepth,
        partition: Partition.Unassigned,
        boundingBox: boundingBox as [number, number, number, number],
      };

      annotationsT1.push(finalAnn);
    }
  }
});

describe("serializes to coco format", () => {
  let serializedCOCO: SerializedCOCOFileType;

  beforeAll(() => {
    serializedCOCO = serializeCOCOFile(imagesT1, annotationsT1, categoriesT1);
  });

  test("propery serializes images", () => {
    expect(serializedCOCO.images.length).toBe(imagesT1.length);
    expect(
      serializedCOCO.images.map((im) => ({
        id: im.id,
        width: im.width,
        height: im.height,
        file_name: im.file_name,
      }))
    ).toEqual(
      imagesT1.map((im, idx) => ({
        id: idx,
        width: im.shape.width,
        height: im.shape.height,
        file_name: im.name,
      }))
    );
  });
  test("properly serializes categories", () => {
    expect(serializedCOCO.categories.length).toBe(categoriesT1.length);
    expect(serializedCOCO.categories).toEqual(
      expect.arrayContaining(
        categoriesT1.map((c, idx) => ({
          id: idx,
          name: c.name,
          supercategory: c.kind,
        }))
      )
    );
  });
  test("properly serializes annotations", () => {
    expect(serializedCOCO.annotations.length).toBe(annotationsT1.length);
    expect(
      serializedCOCO.annotations.map((a) => ({
        id: a.id,
        image_id: a.image_id,
        category_id: a.category_id,
        bbox: a.bbox,
      }))
    ).toEqual(
      annotationsT1.map((a, idx) => ({
        id: idx,
        image_id: imagesT1.findIndex((i) => i.id === a.imageId),
        category_id: categoriesT1.findIndex((c) => c.id === a.categoryId),
        bbox: [
          a.boundingBox[0],
          a.boundingBox[1],
          a.shape.width,
          a.shape.height,
        ],
      }))
    );
  });
});

describe("deserialize into empty project (no matching images)", () => {
  let newAnnotations: AnnotationObject[];
  let newKinds: Kind[];
  let newCategories: Category[];
  beforeAll(async () => {
    const serializedCOCO = serializeCOCOFile(
      imagesT1,
      annotationsT1,
      categoriesT1
    );
    productionStore.dispatch(dataSlice.actions.resetData());
    const rootState = productionStore.getState();
    const { images } = selectSplitThingDict(rootState);
    const kinds = selectObjectKindDict(rootState);
    const categories = selectObjectCategoryDict(rootState);
    const deserializedCOCO = await deserializeCOCOFile(
      serializedCOCO,
      Object.values(images),
      Object.values(categories),
      Object.values(kinds),
      Object.values(CATEGORY_COLORS)
    );
    newAnnotations = deserializedCOCO.newAnnotations;
    newCategories = deserializedCOCO.newCategories;
    newKinds = deserializedCOCO.newKinds;
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
    const serializedCOCO = serializeCOCOFile(
      imagesT1,
      annotationsT1,
      categoriesT1
    );

    const thingsT2 = imagesT1.reduce(
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
    const deserializedCOCO = await deserializeCOCOFile(
      serializedCOCO,
      Object.values(images),
      Object.values(categories),
      Object.values(kinds),
      Object.values(CATEGORY_COLORS)
    );
    newAnnotations = deserializedCOCO.newAnnotations;
    newCategories = deserializedCOCO.newCategories;
    newKinds = deserializedCOCO.newKinds;
  });
  test("should return all new kinds", () => {
    expect(newKinds.length).toBe(kindsT1.length);
  });
  test("should return all new categories", () => {
    expect(newCategories.length).toBe(categoriesT1.length);
  });
  test("should return all new annotations", () => {
    expect(newAnnotations.length).toBe(annotationsT1.length);
    expect(
      newAnnotations.map((ann) => ({
        kind: ann.kind,
        bbox: ann.boundingBox,
      }))
    ).toEqual(
      annotationsT1.map((ann) => ({
        kind: ann.kind,
        bbox: ann.boundingBox,
      }))
    );
  });
});

describe("deserialize into project with matching image, matching kinds", () => {
  let newAnnotations: AnnotationObject[];
  let newKinds: Kind[];
  let newCategories: Category[];
  beforeAll(async () => {
    const serializedCOCO = serializeCOCOFile(
      imagesT1,
      annotationsT1,
      categoriesT1
    );

    const thingsT2 = imagesT1.reduce(
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
    const k1T2: Kind = {
      id: "clock",
      categories: [],
      containing: [],
      unknownCategoryId: "",
    };
    const k2T2: Kind = {
      id: "sports ball",
      categories: [],
      containing: [],
      unknownCategoryId: "",
    };
    const k3T2: Kind = {
      id: "sheep",
      categories: [],
      containing: [],
      unknownCategoryId: "",
    };

    const uC1T2: Category = {
      color: CATEGORY_COLORS.columbiablue,
      id: generateUUID({ definesUnknown: true }),
      name: "unknown",
      kind: "clock",
      containing: [],
      visible: false,
    };
    k1T2.categories = [uC1T2.id];
    k1T2.unknownCategoryId = uC1T2.id;
    const uC2T2: Category = {
      color: CATEGORY_COLORS.columbiablue,
      id: generateUUID({ definesUnknown: true }),
      name: "unknown",
      kind: "sports ball",
      containing: [],
      visible: false,
    };
    k2T2.categories = [uC2T2.id];
    k2T2.unknownCategoryId = uC2T2.id;
    const uC3T2: Category = {
      color: CATEGORY_COLORS.columbiablue,
      id: generateUUID({ definesUnknown: true }),
      name: "unknown",
      kind: "sheep",
      containing: [],
      visible: false,
    };
    k3T2.categories = [uC3T2.id];
    k3T2.unknownCategoryId = uC3T2.id;
    const kindsT2 = [k1T2, k2T2, k3T2].reduce(
      (entities: DeferredEntityState<Kind>, kind) => {
        entities.ids.push(kind.id);
        entities.entities[kind.id] = { saved: kind, changes: {} };
        return entities;
      },
      { ids: [], entities: {} }
    );

    const categoriesT2 = [uC1T2, uC2T2, uC3T2].reduce(
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
    const deserializedCOCO = await deserializeCOCOFile(
      serializedCOCO,
      Object.values(images),
      Object.values(categories),
      Object.values(kinds),
      Object.values(CATEGORY_COLORS)
    );
    newAnnotations = deserializedCOCO.newAnnotations;
    newCategories = deserializedCOCO.newCategories;
    newKinds = deserializedCOCO.newKinds;
  });
  test("should return no new kinds", () => {
    expect(newKinds).toHaveLength(0);
  });
  test("should return one new categories", () => {
    expect(newCategories).toHaveLength(1);
  });
  test("should return all new annotations", () => {
    expect(newAnnotations.length).toBe(annotationsT1.length);
    expect(
      newAnnotations.map((ann) => ({
        kind: ann.kind,
        bbox: ann.boundingBox,
      }))
    ).toEqual(
      annotationsT1.map((ann) => ({
        kind: ann.kind,
        bbox: ann.boundingBox,
      }))
    );
  });
});

describe("deserialize into project with matching image, matching kinds and category", () => {
  let newAnnotations: AnnotationObject[];
  let newKinds: Kind[];
  let newCategories: Category[];
  let t2categories: Category[];
  beforeAll(async () => {
    const serializedCOCO = serializeCOCOFile(
      imagesT1,
      annotationsT1,
      categoriesT1
    );

    const thingsT2 = imagesT1.reduce(
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
    const k1T2: Kind = {
      id: "clock",
      categories: [],
      containing: [],
      unknownCategoryId: "",
    };
    const k2T2: Kind = {
      id: "sports ball",
      categories: [],
      containing: [],
      unknownCategoryId: "",
    };
    const k3T2: Kind = {
      id: "sheep",
      categories: [],
      containing: [],
      unknownCategoryId: "",
    };

    const uC1T2: Category = {
      color: CATEGORY_COLORS.columbiablue,
      id: generateUUID({ definesUnknown: true }),
      name: "unknown",
      kind: "clock",
      containing: [],
      visible: false,
    };
    k1T2.categories = [uC1T2.id];
    k1T2.unknownCategoryId = uC1T2.id;
    const uC2T2: Category = {
      color: CATEGORY_COLORS.columbiablue,
      id: generateUUID({ definesUnknown: true }),
      name: "unknown",
      kind: "sports ball",
      containing: [],
      visible: false,
    };
    k2T2.categories = [uC2T2.id];
    k2T2.unknownCategoryId = uC2T2.id;
    const uC3T2: Category = {
      color: CATEGORY_COLORS.columbiablue,
      id: generateUUID({ definesUnknown: true }),
      name: "unknown",
      kind: "sheep",
      containing: [],
      visible: false,
    };
    k3T2.categories = [uC3T2.id];
    k3T2.unknownCategoryId = uC3T2.id;
    const c1T2: Category = {
      color: CATEGORY_COLORS.columbiablue,
      id: generateUUID({ definesUnknown: true }),
      name: "big",
      kind: "clock",
      containing: [],
      visible: false,
    };
    k1T2.categories = [c1T2.id];
    k1T2.unknownCategoryId = c1T2.id;
    const kindsT2 = [k1T2, k2T2, k3T2].reduce(
      (entities: DeferredEntityState<Kind>, kind) => {
        entities.ids.push(kind.id);
        entities.entities[kind.id] = { saved: kind, changes: {} };
        return entities;
      },
      { ids: [], entities: {} }
    );
    t2categories = [uC1T2, uC2T2, uC3T2, c1T2];
    const categoriesT2 = t2categories.reduce(
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
    const deserializedCOCO = await deserializeCOCOFile(
      serializedCOCO,
      Object.values(images),
      Object.values(categories),
      Object.values(kinds),
      Object.values(CATEGORY_COLORS)
    );
    newAnnotations = deserializedCOCO.newAnnotations;
    newCategories = deserializedCOCO.newCategories;
    newKinds = deserializedCOCO.newKinds;
  });
  test("should return no new kinds", () => {
    expect(newKinds).toHaveLength(0);
  });
  test("should return no new categories", () => {
    expect(newCategories).toHaveLength(0);
  });
  test("should return all new annotations", () => {
    expect(newAnnotations.length).toBe(annotationsT1.length);
    expect(
      newAnnotations.map((ann) => ({
        kind: ann.kind,
        bbox: ann.boundingBox,
      }))
    ).toEqual(
      annotationsT1.map((ann) => ({
        kind: ann.kind,
        bbox: ann.boundingBox,
      }))
    );
  });
  test("category ids of new annotations should match existing category ids", () => {
    expect(
      newAnnotations.every((ann) =>
        t2categories.map((c) => c.id).includes(ann.categoryId)
      )
    ).toBeTruthy();
  });
});

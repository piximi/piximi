import { initialState as initialProjectState } from "store/project/projectSlice";
import { CustomStore } from "utils/file-io/zarr/stores";
import {
  V02Category,
  V02Kind,
  V02PiximiState,
  V02RawAnnotationObject,
  V02RawImageObject,
} from "./version-types/v02Types";
import { Group, openGroup } from "zarr";
import { getAttr, getDataset, getGroup } from "../zarr/utils";
import { logger } from "utils/logUtils";
import { EntityState } from "@reduxjs/toolkit";
import { RawArray } from "zarr/types/rawArray";
import { BitDepth } from "store/data/types";
import {
  deserializeColorsRaw,
  deserializeSegmenterGroup,
  v01_02_deserializeClassifierGroup,
} from "./common";
import { Partition } from "utils/models/enums";
import { RawData } from "../types";

/**
 * Read a v0.2 project file.
 *
 * Key differences from v1.2:
 * - Uses "things" group (images + annotations unified)
 * - Discriminated by "kind" attribute (IMAGE_KIND vs annotation kind)
 * - Colors on images stored as Tensor colors (extracted as ColorsRaw here)
 * - Annotations have blank colors generated from channel count
 * - "contents" attribute on things tracks image→annotation relationships
 * - Categories and kinds have "contents" and "categories" arrays
 *
 * Nearly identical to v1.1 reader — consider sharing private helpers.
 */
export const readV02 = async (
  fileStore: CustomStore,
  onProgress: (progress: number) => void,
): Promise<V02PiximiState> => {
  const rootGroup = await openGroup(fileStore, fileStore.rootName, "r");
  const projectGroup = await getGroup(rootGroup, "project");
  const { project, data } = await deserializeProjectGroup(
    projectGroup,
    onProgress,
  );
  onProgress(90);
  const classifierGroup = await getGroup(rootGroup, "classifier");
  const classifier = await v01_02_deserializeClassifierGroup(classifierGroup);

  const segmenterGroup = await getGroup(rootGroup, "segmenter");
  const segmenter = await deserializeSegmenterGroup(segmenterGroup);
  onProgress(100);
  import.meta.env.VITE_APP_LOG_LEVEL === "1" &&
    logger(`closed ${fileStore.rootName}`);

  return { project, classifier, segmenter, data };
};

const deserializeProjectGroup = async (
  projectGroup: Group,
  onProgress: (value: number) => void,
): Promise<Omit<V02PiximiState, "classifier" | "segmenter">> => {
  const name = (await getAttr(projectGroup, "name")) as string;
  const imageChannels = (await getAttr(
    projectGroup,
    "imageChannels",
  )) as number;
  onProgress(15);
  const thingsGroup = await getGroup(projectGroup, "things");
  const things = await deserializeThingsGroup(thingsGroup, onProgress);
  onProgress(80);
  const kindsGroup = await getGroup(projectGroup, "kinds");
  const kinds = await deserializeKindsGroup(kindsGroup);
  onProgress(82);
  const categoriesGroup = await getGroup(projectGroup, "categories");
  const categories = await deserializeCategoriesGroup(categoriesGroup);
  onProgress(85);

  return {
    project: {
      ...initialProjectState,
      name,
      imageChannels,
    },
    data: { things, kinds, categories },
  };
};

const deserializeKindsGroup = async (
  kindsGroup: Group,
): Promise<EntityState<V02Kind, string>> => {
  const ids = (await getAttr(kindsGroup, "kind_id")) as string[];
  const contents = (await getAttr(kindsGroup, "contents")) as string[][];
  const categories = (await getAttr(kindsGroup, "categories")) as string[][];
  const unknownV02CategoryIds = (await getAttr(
    kindsGroup,
    "unknown_category_id",
  )) as string[];

  if (
    ids.length !== contents.length ||
    ids.length !== unknownV02CategoryIds.length
  ) {
    throw Error(
      `Expected categories group "${kindsGroup.path}" to have "${ids.length}" number of ids, colors, names, and visibilities`,
    );
  }

  const kinds: EntityState<V02Kind, string> = { ids: [], entities: {} };
  for (let i = 0; i < ids.length; i++) {
    kinds.ids.push(ids[i]);
    kinds.entities[ids[i]] = {
      id: ids[i],
      displayName: ids[i],
      containing: contents[i],
      categories: categories[i],
      unknownCategoryId: unknownV02CategoryIds[i],
    };
  }

  return kinds;
};

const deserializeCategoriesGroup = async (
  categoriesGroup: Group,
): Promise<EntityState<V02Category, string>> => {
  const ids = (await getAttr(categoriesGroup, "category_id")) as string[];
  const colors = (await getAttr(categoriesGroup, "color")) as string[];
  const names = (await getAttr(categoriesGroup, "name")) as string[];
  const kinds = (await getAttr(categoriesGroup, "kind")) as string[];
  const contents = (await getAttr(categoriesGroup, "contents")) as string[][];

  if (ids.length !== colors.length || ids.length !== names.length) {
    throw Error(
      `Expected categories group "${categoriesGroup.path}" to have "${ids.length}" number of ids, colors, names, and visibilities`,
    );
  }

  const categories: EntityState<V02Category, string> = {
    ids: [],
    entities: {},
  };
  for (let i = 0; i < ids.length; i++) {
    categories.ids.push(ids[i]);
    categories.entities[ids[i]] = {
      id: ids[i],
      color: colors[i],
      name: names[i],
      kind: kinds[i],
      containing: contents[i],
      visible: true,
    } as V02Category;
  }

  return categories;
};

const deserializeThingsGroup = async (
  thingsGroup: Group,
  onProgress: (value: number) => void,
) => {
  const thingNames = (await getAttr(thingsGroup, "thing_names")) as string[];

  const things: EntityState<
    V02RawImageObject | V02RawAnnotationObject,
    string
  > = {
    ids: [],
    entities: {},
  };

  for (const [i, name] of Object.entries(thingNames)) {
    // import.meta.env.VITE_APP_LOG_LEVEL === "1" &&
    //   logger(`deserializing image ${+i + 1}/${thingNames.length}`);

    const thingGroup = await getGroup(thingsGroup, name);
    const thing = await deserializeThingGroup(name, thingGroup);
    onProgress(15 + Math.floor((+i / thingNames.length) * 75));
    things.ids.push(thing.id);
    things.entities[thing.id] = thing;
  }

  // final image complete

  return things;
};

const deserializeThingGroup = async (
  name: string,
  thingGroup: Group,
): Promise<V02RawImageObject | V02RawAnnotationObject> => {
  const id = (await getAttr(thingGroup, "thing_id")) as string;
  const activePlane = (await getAttr(thingGroup, "active_plane")) as number;
  const categoryId = (await getAttr(thingGroup, "class_category_id")) as string;
  const partition = (await getAttr(
    thingGroup,
    "classifier_partition",
  )) as Partition;
  const kind = (await getAttr(thingGroup, "kind")) as string;
  // const classifierPartition = (await getAttr(
  //   imageGroup,
  //   "classifier_partition"
  // )) as Partition;

  const thingDataset = await getDataset(thingGroup, name);
  const rawArray = (await thingDataset.getRaw()) as RawArray;
  const data = rawArray.data as Float32Array;
  const [planes, height, width, channels] = rawArray.shape;
  const bitDepth = (await getAttr(thingDataset, "bit_depth")) as BitDepth;

  const tensorData: RawData = {
    buffer: data.buffer as ArrayBuffer,
    dtype: "float32",
    shape: rawArray.shape as [number, number, number, number],
  };
  const thing = {
    id,
    name,
    kind,
    activePlane,
    categoryId,
    partition,
    bitDepth,
    shape: {
      planes,
      height,
      width,
      channels,
    },
    tensorData,
  };

  if (kind === "Image") {
    const colorsGroup = await getGroup(thingGroup, "colors");
    const colors = await deserializeColorsRaw(colorsGroup);

    const contents = (await getAttr(thingGroup, "contents")) as string[];

    return { ...thing, colors, containing: contents };
  } else {
    const boundingBox = (await getAttr(thingGroup, "bbox")) as [
      number,
      number,
      number,
      number,
    ];
    const encodedMask = (await getAttr(thingGroup, "mask")) as number[];
    const plane = (await getAttr(thingGroup, "activePlane")) as number;
    const imageId = (await getAttr(thingGroup, "image_id")) as string;

    return {
      ...thing,
      boundingBox,
      encodedMask,
      imageId,
      plane,
    };
  }
};

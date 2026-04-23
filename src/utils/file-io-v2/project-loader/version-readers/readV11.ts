import { openGroup } from "zarr";

import { initialState as initialProjectState } from "store/project/projectSlice";
import type { BitDepth } from "store/data/types";

import type { Partition } from "utils/models/enums";
import type { CustomStore } from "utils/file-io/zarr/stores";
import { logger } from "utils/logUtils";

import { getAttr, getDataset, getGroup } from "../zarr/utils";
import {
  deserializeColorsRaw,
  deserializeSegmenterGroup,
  v11_v2_deserializeClassifierGroup,
} from "./common";
import { subProgress } from "../progress";

import type {
  V11Category,
  V11Kind,
  V11PiximiState,
  V11RawAnnotationObject,
  V11RawImageObject,
} from "./version-types/v11Types";
import type { EntityState } from "@reduxjs/toolkit";
import type { RawArray } from "zarr/types/rawArray";
import type { Group } from "zarr";
import type { RawData } from "../types";

const STAGES = {
  metadata: { start: 0.0, end: 0.05 },
  things: { start: 0.05, end: 0.7 },
  kinds: { start: 0.7, end: 0.8 },
  categories: { start: 0.8, end: 0.9 },
  models: { start: 0.9, end: 1.0 },
} as const;
/**
 * Read a v1.1 project file.
 *
 * Structurally identical to v0.2 — same "things" model, same attribute names.
 * The difference is in the classifier group format (per-kind classifiers).
 * Since classifier/segmenter are extracted as plain JSON, the reader code
 * for the data section is identical to v0.2.
 *
 * Consider sharing the "things" reading logic between readV02 and readV11,
 * or inlining if the duplication is small.
 */
export const readV11 = async (
  store: CustomStore,
  onProgress: (p: number) => void,
): Promise<V11PiximiState> => {
  const rootGroup = await openGroup(store, store.rootName, "r");
  const projectGroup = await getGroup(rootGroup, "project");
  const name = (await getAttr(projectGroup, "name")) as string;
  const imageChannels = (await getAttr(projectGroup, "imageChannels")) as
    | number
    | string;
  onProgress(STAGES.metadata.end);
  const thingsGroup = await getGroup(projectGroup, "things");
  const things = await deserializeThingsGroup(
    thingsGroup,
    subProgress(onProgress, STAGES.things),
  );

  const kindsGroup = await getGroup(projectGroup, "kinds");
  const kinds = await deserializeKindsGroup(kindsGroup);
  onProgress(STAGES.kinds.end);
  const categoriesGroup = await getGroup(projectGroup, "categories");
  const categories = await deserializeCategoriesGroup(categoriesGroup);
  onProgress(STAGES.categories.end);
  const classifierGroup = await getGroup(rootGroup, "classifier");
  const classifier = await v11_v2_deserializeClassifierGroup(classifierGroup);

  const segmenterGroup = await getGroup(rootGroup, "segmenter");
  const segmenter = await deserializeSegmenterGroup(segmenterGroup);
  onProgress(STAGES.models.end);
  import.meta.env.VITE_APP_LOG_LEVEL === "1" &&
    logger(`closed ${store.rootName}`);

  return {
    project: { ...initialProjectState, name, imageChannels: +imageChannels },
    classifier,
    segmenter,
    data: {
      things,
      kinds,
      categories,
    },
  };
};

const deserializeThingsGroup = async (
  thingsGroup: Group,
  onProgress: (p: number) => void,
) => {
  const thingNames = (await getAttr(thingsGroup, "thing_names")) as string[];

  const things: EntityState<
    V11RawImageObject | V11RawAnnotationObject,
    string
  > = {
    ids: [],
    entities: {},
  };

  for (const [i, name] of Object.entries(thingNames)) {
    const thingGroup = await getGroup(thingsGroup, name);
    const id = (await getAttr(thingGroup, "thing_id")) as string;
    const activePlane = (await getAttr(thingGroup, "active_plane")) as number;
    const categoryId = (await getAttr(
      thingGroup,
      "class_category_id",
    )) as string;
    const partition = (await getAttr(
      thingGroup,
      "classifier_partition",
    )) as Partition;
    const kind = (await getAttr(thingGroup, "kind")) as string;

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

    let completedThing: V11RawImageObject | V11RawAnnotationObject;
    if (kind === "Image") {
      const colorsGroup = await getGroup(thingGroup, "colors");
      const colors = await deserializeColorsRaw(colorsGroup);

      const contents = (await getAttr(thingGroup, "contents")) as string[];

      completedThing = { ...thing, colors, containing: contents };
    } else {
      const boundingBox = (await getAttr(thingGroup, "bbox")) as [
        number,
        number,
        number,
        number,
      ];
      const encodedMask = (await getAttr(thingGroup, "mask")) as number[];
      const plane = activePlane;
      const imageId = (await getAttr(thingGroup, "image_id")) as string;
      completedThing = { ...thing, boundingBox, encodedMask, imageId, plane };
    }
    things.ids.push(completedThing.id);
    things.entities[completedThing.id] = completedThing;
    onProgress(+i / thingNames.length);
  }

  return things;
};

const deserializeKindsGroup = async (
  kindsGroup: Group,
): Promise<EntityState<V11Kind, string>> => {
  const ids = (await getAttr(kindsGroup, "kind_id")) as string[];
  const contents = (await getAttr(kindsGroup, "contents")) as string[][];
  const categories = (await getAttr(kindsGroup, "categories")) as string[][];
  const unknownCategoryIds = (await getAttr(
    kindsGroup,
    "unknown_category_id",
  )) as string[];
  const displayNames = (await getAttr(kindsGroup, "display_name")) as string[];
  if (
    ids.length !== contents.length ||
    ids.length !== unknownCategoryIds.length
  ) {
    throw Error(
      `Expected categories group "${kindsGroup.path}" to have "${ids.length}" number of ids, colors, names, and visibilities`,
    );
  }

  const kinds: EntityState<V11Kind, string> = { ids: [], entities: {} };
  for (let i = 0; i < ids.length; i++) {
    kinds.ids.push(ids[i]);
    kinds.entities[ids[i]] = {
      id: ids[i],
      displayName: displayNames[i],
      containing: contents[i],
      categories: categories[i],
      unknownCategoryId: unknownCategoryIds[i],
    };
  }

  return kinds;
};

const deserializeCategoriesGroup = async (
  categoriesGroup: Group,
): Promise<EntityState<V11Category, string>> => {
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

  const categories: EntityState<V11Category, string> = {
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
    } as V11Category;
  }

  return categories;
};

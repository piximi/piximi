import { Group, openGroup } from "zarr";

import { logger } from "utils/logUtils";
import { initialState as initialProjectState } from "store/project/projectSlice";
import { deserializeColorsGroup } from "../common/group-deserializers/deserializeColorsGroup";
import { deserializeSegmenterGroup } from "../common/group-deserializers/deserializeSegmenterGroup";
import { getAttr, getDataset, getGroup } from "../../zarr/zarrUtils";
import { RawArray } from "zarr/types/rawArray";
import { tensor4d } from "@tensorflow/tfjs";
import { Partition } from "utils/models/enums";
import { createRenderedTensor, generateBlankColors } from "utils/tensorUtils";
import {
  LoadCB,
  V11AnnotationObject,
  V11ImageObject,
} from "utils/file-io/types";
import { CustomStore } from "utils/file-io/zarr/stores";
import { ProjectState } from "store/types";
import { BitDepth } from "store/data/types";
import { Kind, Category } from "store/data/types";
import { EntityState } from "@reduxjs/toolkit";
import { v11_deserializeClassifierGroup } from "./v11_deserializeClassifierGroup";

const deserializeThingGroup = async (
  name: string,
  thingGroup: Group,
): Promise<V11ImageObject | V11AnnotationObject> => {
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

  const imageDataset = await getDataset(thingGroup, name);
  const imageRawArray = (await imageDataset.getRaw()) as RawArray;
  const imageData = imageRawArray.data as Float32Array;
  const [planes, height, width, channels] = imageRawArray.shape;
  const bitDepth = (await getAttr(imageDataset, "bit_depth")) as BitDepth;

  const imageTensor = tensor4d(
    imageData,
    [planes, height, width, channels],
    "float32",
  );

  const thing = {
    id,
    name,
    kind,
    activePlane,
    categoryId,
    partition,
    data: imageTensor,
    bitDepth,
    shape: {
      planes,
      height,
      width,
      channels,
    },
  };

  if (kind === "Image") {
    const colorsGroup = await getGroup(thingGroup, "colors");
    const colors = await deserializeColorsGroup(colorsGroup);
    const src = await createRenderedTensor(
      imageTensor,
      colors,
      bitDepth,
      activePlane,
    );
    const contents = (await getAttr(thingGroup, "contents")) as string[];

    return { ...thing, colors, src, containing: contents } as V11ImageObject;
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
    const colors = generateBlankColors(thing.shape.channels);
    const src = await createRenderedTensor(
      thing.data,
      colors,
      bitDepth,
      activePlane,
    );

    return {
      ...thing,
      boundingBox,
      encodedMask,
      imageId,
      plane,
      src,
    } as V11AnnotationObject;
  }
};

const deserializeThingsGroup = async (thingsGroup: Group, loadCb: LoadCB) => {
  const thingNames = (await getAttr(thingsGroup, "thing_names")) as string[];

  const things: EntityState<V11ImageObject | V11AnnotationObject, string> = {
    ids: [],
    entities: {},
  };

  for (const [i, name] of Object.entries(thingNames)) {
    // import.meta.env.VITE_APP_LOG_LEVEL === "1" &&
    //   logger(`deserializing image ${+i + 1}/${thingNames.length}`);

    loadCb(
      +i / (thingNames.length - 1),
      `deserializing image ${+i + 1}/${thingNames.length}`,
    );

    const thingGroup = await getGroup(thingsGroup, name);
    const thing = await deserializeThingGroup(name, thingGroup);
    things.ids.push(thing.id);
    things.entities[thing.id] = thing;
  }

  // final image complete
  loadCb(1, "");

  return things;
};
const deserializeCategoriesGroup = async (
  categoriesGroup: Group,
): Promise<EntityState<Category, string>> => {
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

  const categories: EntityState<Category, string> = {
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
    } as Category;
  }

  return categories;
};

const deserializeKindsGroup = async (
  kindsGroup: Group,
): Promise<EntityState<Kind, string>> => {
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

  const kinds: EntityState<Kind, string> = { ids: [], entities: {} };
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

const deserializeProjectGroup = async (
  projectGroup: Group,
  loadCb: LoadCB,
): Promise<{
  project: ProjectState;
  data: {
    things: EntityState<V11ImageObject | V11AnnotationObject, string>;
    categories: EntityState<Category, string>;
    kinds: EntityState<Kind, string>;
  };
}> => {
  const name = (await getAttr(projectGroup, "name")) as string;
  const imageChannels = (await getAttr(projectGroup, "imageChannels")) as
    | number
    | string;
  const thingsGroup = await getGroup(projectGroup, "things");
  const things = await deserializeThingsGroup(thingsGroup, loadCb);
  const kindsGroup = await getGroup(projectGroup, "kinds");
  const kinds = await deserializeKindsGroup(kindsGroup);
  const categoriesGroup = await getGroup(projectGroup, "categories");
  const categories = await deserializeCategoriesGroup(categoriesGroup);

  return {
    project: {
      ...initialProjectState,
      name,
      imageChannels: imageChannels === "undefined" ? undefined : +imageChannels,
    },
    data: { things, kinds, categories },
  };
};

export const v11_deserializeProject = async (
  fileStore: CustomStore,
  loadCb: LoadCB,
) => {
  const rootGroup = await openGroup(fileStore, fileStore.rootName, "r");
  const projectGroup = await getGroup(rootGroup, "project");
  const { project, data } = await deserializeProjectGroup(projectGroup, loadCb);
  const classifierGroup = await getGroup(rootGroup, "classifier");
  const classifier = await v11_deserializeClassifierGroup(classifierGroup);

  const segmenterGroup = await getGroup(rootGroup, "segmenter");
  const segmenter = await deserializeSegmenterGroup(segmenterGroup);

  import.meta.env.VITE_APP_LOG_LEVEL === "1" &&
    logger(`closed ${fileStore.rootName}`);

  return { project, classifier, segmenter, data };
};

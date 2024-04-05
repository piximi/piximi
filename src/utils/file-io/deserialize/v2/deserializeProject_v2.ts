import { LoadCB, Partition, Project } from "types";
import { CustomStore } from "utils/common/zarrStores";
import { Group, openGroup } from "zarr";

import { logger } from "utils/common/logger";
import { initialState as initialProjectState } from "store/slices/project/projectSlice";
import {
  deserializeClassifierGroup,
  deserializeColorsGroup,
  deserializeSegmenterGroup,
} from "../common/groupDeserializers";
import { getAttr, getDataset, getGroup } from "../helpers";
import { NewAnnotationType, NewImageType } from "types/ThingType";
import { Kind, NewCategory } from "types/Category";
import { RawArray } from "zarr/types/rawArray";
import { BitDepth, createRenderedTensor } from "utils/common/image/imageHelper";
import { tensor4d } from "@tensorflow/tfjs";
import { DeferredEntityState } from "store/entities";

const deserializeThingGroup = async (
  name: string,
  thingGroup: Group
): Promise<NewImageType | NewAnnotationType> => {
  const id = (await getAttr(thingGroup, "image_id")) as string;
  const activePlane = (await getAttr(thingGroup, "active_plane")) as number;
  const categoryId = (await getAttr(thingGroup, "class_category_id")) as string;
  const partition = (await getAttr(
    thingGroup,
    "classifier_partition"
  )) as Partition;
  const kind = (await getAttr(thingGroup, "kind")) as string;
  // const classifierPartition = (await getAttr(
  //   imageGroup,
  //   "classifier_partition"
  // )) as Partition;

  const colorsGroup = await getGroup(thingGroup, "colors");
  const colors = await deserializeColorsGroup(colorsGroup);

  const imageDataset = await getDataset(thingGroup, name);
  const imageRawArray = (await imageDataset.getRaw()) as RawArray;
  const imageData = imageRawArray.data as Float32Array;
  const [planes, height, width, channels] = imageRawArray.shape;
  const bitDepth = (await getAttr(imageDataset, "bit_depth")) as BitDepth;

  const imageTensor = tensor4d(
    imageData,
    [planes, height, width, channels],
    "float32"
  );
  const src = await createRenderedTensor(
    imageTensor,
    colors,
    bitDepth,
    activePlane
  );

  const thing = {
    id,
    name,
    kind,
    activePlane,
    categoryId,
    partition,
    colors,
    data: imageTensor,
    bitDepth,
    shape: {
      planes,
      height,
      width,
      channels,
    },
    src,
  };

  if (kind === "Image") {
    const colorsGroup = await getGroup(thingGroup, "colors");
    const colors = await deserializeColorsGroup(colorsGroup);
    const contents = (await getAttr(thingGroup, "contents")) as string[];
    return { ...thing, colors, containing: contents } as NewImageType;
  } else {
    const boundingBox = (await getAttr(thingGroup, "bbox")) as [
      number,
      number,
      number,
      number
    ];
    const encodedMask = (await getAttr(thingGroup, "mask")) as number[];
    const imageId = (await getAttr(thingGroup, "image_id")) as string;

    return { ...thing, boundingBox, encodedMask, imageId } as NewAnnotationType;
  }
};

const deserializeThingsGroup = async (thingsGroup: Group, loadCb: LoadCB) => {
  const thingNames = (await getAttr(thingsGroup, "image_names")) as string[];

  const things: DeferredEntityState<NewImageType | NewAnnotationType> = {
    ids: [],
    entities: {},
  };

  for (const [i, name] of Object.entries(thingNames)) {
    // process.env.REACT_APP_LOG_LEVEL === "1" &&
    //   logger(`deserializing image ${+i + 1}/${thingNames.length}`);

    loadCb(
      +i / (thingNames.length - 1),
      `deserializing image ${+i + 1}/${thingNames.length}`
    );

    const thingGroup = await getGroup(thingsGroup, name);

    const thing = await deserializeThingGroup(name, thingGroup);
    things.ids.push(thing.id);
    things.entities[thing.id] = { saved: thing, changes: {} };
  }

  // final image complete
  loadCb(1, "");

  return things;
};
const deserializeCategoriesGroup = async (
  categoriesGroup: Group
): Promise<DeferredEntityState<NewCategory>> => {
  const ids = (await getAttr(categoriesGroup, "category_id")) as string[];
  const colors = (await getAttr(categoriesGroup, "color")) as string[];
  const names = (await getAttr(categoriesGroup, "name")) as string[];
  const kinds = (await getAttr(categoriesGroup, "kind")) as string[];
  const contents = (await getAttr(categoriesGroup, "contents")) as string[][];

  if (ids.length !== colors.length || ids.length !== names.length) {
    throw Error(
      `Expected categories group "${categoriesGroup.path}" to have "${ids.length}" number of ids, colors, names, and visibilities`
    );
  }

  const categories: DeferredEntityState<NewCategory> = {
    ids: [],
    entities: {},
  };
  for (let i = 0; i < ids.length; i++) {
    categories.ids.push(ids[i]);
    categories.entities[ids[i]] = {
      saved: {
        id: ids[i],
        color: colors[i],
        name: names[i],
        kind: kinds[i],
        containing: contents[i],
        visible: true,
      } as NewCategory,
      changes: {},
    };
  }

  return categories;
};

const deserializeKindsGroup = async (
  kindsGroup: Group
): Promise<DeferredEntityState<Kind>> => {
  const ids = (await getAttr(kindsGroup, "kind_id")) as string[];
  const contents = (await getAttr(kindsGroup, "contents")) as string[][];
  const categories = (await getAttr(kindsGroup, "categories")) as string[][];
  const unknownCategoryIds = (await getAttr(
    kindsGroup,
    "unknown_category_id"
  )) as string[];

  if (
    ids.length !== contents.length ||
    ids.length !== unknownCategoryIds.length
  ) {
    throw Error(
      `Expected categories group "${kindsGroup.path}" to have "${ids.length}" number of ids, colors, names, and visibilities`
    );
  }

  const kinds: DeferredEntityState<Kind> = { ids: [], entities: {} };
  for (let i = 0; i < ids.length; i++) {
    kinds.ids.push(ids[i]);
    kinds.entities[ids[i]] = {
      saved: {
        id: ids[i],
        containing: contents[i],
        categories: categories[i],
        unknownCategoryId: unknownCategoryIds[i],
      },
      changes: {},
    };
  }

  return kinds;
};

const deserializeProjectGroup = async (
  projectGroup: Group,
  loadCb: LoadCB
): Promise<{
  project: Project;
  data: {
    things: DeferredEntityState<NewImageType | NewAnnotationType>;
    categories: DeferredEntityState<NewCategory>;
    kinds: DeferredEntityState<Kind>;
  };
}> => {
  const name = (await getAttr(projectGroup, "name")) as string;

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
    },
    data: { things, kinds, categories },
  };
};

export const deserializeProject_v2 = async (
  fileStore: CustomStore,
  loadCb: LoadCB
) => {
  const rootGroup = await openGroup(fileStore, fileStore.rootName, "r");
  const projectGroup = await getGroup(rootGroup, "project");
  const { project, data } = await deserializeProjectGroup(projectGroup, loadCb);
  const classifierGroup = await getGroup(rootGroup, "classifier");
  const classifier = await deserializeClassifierGroup(classifierGroup);

  const segmenterGroup = await getGroup(rootGroup, "segmenter");
  const segmenter = await deserializeSegmenterGroup(segmenterGroup);

  process.env.REACT_APP_LOG_LEVEL === "1" &&
    logger(`closed ${fileStore.rootName}`);

  return { project, classifier, segmenter, data };
};

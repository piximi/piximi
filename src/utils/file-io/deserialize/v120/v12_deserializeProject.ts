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
import {
  BitDepth,
  ImageTimepointData,
  TSAnnotationObject,
  TSImageObject,
} from "store/data/types";
import { Kind, Category } from "store/data/types";
import { EntityState } from "@reduxjs/toolkit";
import { v11_deserializeClassifierGroup } from "../v110/v11_deserializeClassifierGroup";

const deserializeImageGroup = async (
  name: string,
  imageGroup: Group,
): Promise<TSImageObject> => {
  const id = (await getAttr(imageGroup, "image_id")) as string;
  const partition = (await getAttr(
    imageGroup,
    "classifier_partition",
  )) as Partition;
  const kind = (await getAttr(imageGroup, "kind")) as string;
  const containing = (await getAttr(imageGroup, "contents")) as string[];

  const timepoints = (await getAttr(imageGroup, "timepoints")) as string[];

  const tpProperties: Record<string, ImageTimepointData> = {};

  let bitDepth;
  let shape;

  for await (const tp of timepoints) {
    const tpGroup = await getGroup(imageGroup, tp);
    const categoryId = (await getAttr(tpGroup, "class_category_id")) as string;
    const activePlane = (await getAttr(tpGroup, "active_plane")) as number;
    const imageDataset = await getDataset(tpGroup, tp);
    const imageRawArray = (await imageDataset.getRaw()) as RawArray;
    const imageData = imageRawArray.data as Float32Array;
    const [planes, height, width, channels] = imageRawArray.shape;
    shape = { planes, height, width, channels };
    const bitDepth = (await getAttr(imageDataset, "bit_depth")) as BitDepth;

    const imageTensor = tensor4d(
      imageData,
      [planes, height, width, channels],
      "float32",
    );
    const colorsGroup = await getGroup(tpGroup, "colors");
    const colors = await deserializeColorsGroup(colorsGroup);
    const src = await createRenderedTensor(
      imageTensor,
      colors,
      bitDepth,
      activePlane,
    );

    tpProperties[tp] = {
      colors,
      src,
      data: imageTensor,
      categoryId,
      activePlane,
    };
  }

  return {
    id,
    name,
    kind,
    partition,
    containing,
    bitDepth: bitDepth!,
    shape: shape!,
    timepoints: tpProperties,
  };
};
const deserializeAnnotationGroup = async (
  name: string,
  annotationGroup: Group,
): Promise<TSAnnotationObject> => {
  const id = (await getAttr(annotationGroup, "annotation_id")) as string;
  const activePlane = (await getAttr(
    annotationGroup,
    "active_plane",
  )) as number;
  const categoryId = (await getAttr(
    annotationGroup,
    "class_category_id",
  )) as string;
  const partition = (await getAttr(
    annotationGroup,
    "classifier_partition",
  )) as Partition;
  const kind = (await getAttr(annotationGroup, "kind")) as string;
  const timepoint = (await getAttr(annotationGroup, "timepoint")) as string;

  const imageDataset = await getDataset(annotationGroup, name);
  const imageRawArray = (await imageDataset.getRaw()) as RawArray;
  const imageData = imageRawArray.data as Float32Array;
  const [planes, height, width, channels] = imageRawArray.shape;
  const bitDepth = (await getAttr(imageDataset, "bit_depth")) as BitDepth;

  const imageTensor = tensor4d(
    imageData,
    [planes, height, width, channels],
    "float32",
  );

  const boundingBox = (await getAttr(annotationGroup, "bbox")) as [
    number,
    number,
    number,
    number,
  ];
  const encodedMask = (await getAttr(annotationGroup, "mask")) as number[];
  const plane = activePlane;
  const imageId = (await getAttr(annotationGroup, "image_id")) as string;
  const colors = generateBlankColors(channels);
  const src = await createRenderedTensor(
    imageTensor,
    colors,
    bitDepth,
    activePlane,
  );

  return {
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
    boundingBox,
    encodedMask,
    imageId,
    plane,
    timepoint,
    src,
  };
};

const deserializeAnnotationsGroup = async (
  annotationsGroup: Group,
  loadCb: LoadCB,
) => {
  const annotationNames = (await getAttr(
    annotationsGroup,
    "annotation_names",
  )) as string[];

  const annotations: EntityState<TSAnnotationObject, string> = {
    ids: [],
    entities: {},
  };

  for (const [i, name] of Object.entries(annotationNames)) {
    // import.meta.env.VITE_APP_LOG_LEVEL === "1" &&
    //   logger(`deserializing image ${+i + 1}/${thingNames.length}`);

    loadCb(
      +i / (annotationNames.length - 1),
      `deserializing image ${+i + 1}/${annotationNames.length}`,
    );

    const annotationGroup = await getGroup(annotationsGroup, name);
    const annotation = await deserializeAnnotationGroup(name, annotationGroup);
    annotations.ids.push(annotation.id);
    annotations.entities[annotation.id] = annotation;
  }

  // final image complete
  loadCb(1, "");

  return annotations;
};
const deserializeImagesGroup = async (imagesGroup: Group, loadCb: LoadCB) => {
  const imageNames = (await getAttr(imagesGroup, "image_names")) as string[];

  const images: EntityState<TSImageObject, string> = {
    ids: [],
    entities: {},
  };

  for (const [i, name] of Object.entries(imageNames)) {
    // import.meta.env.VITE_APP_LOG_LEVEL === "1" &&
    //   logger(`deserializing image ${+i + 1}/${thingNames.length}`);

    loadCb(
      +i / (imageNames.length - 1),
      `deserializing image ${+i + 1}/${imageNames.length}`,
    );

    const imageGroup = await getGroup(imagesGroup, name);
    const image = await deserializeImageGroup(name, imageGroup);
    images.ids.push(image.id);
    images.entities[image.id] = image;
  }

  // final image complete
  loadCb(1, "");

  return images;
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
    images: EntityState<TSImageObject, string>;
    annotations: EntityState<TSAnnotationObject, string>;
    categories: EntityState<Category, string>;
    kinds: EntityState<Kind, string>;
  };
}> => {
  const name = (await getAttr(projectGroup, "name")) as string;
  const imageChannels = (await getAttr(projectGroup, "imageChannels")) as
    | number
    | string;
  const imagesGroup = await getGroup(projectGroup, "images");
  const images = await deserializeImagesGroup(imagesGroup, loadCb);
  const annotationsGroup = await getGroup(projectGroup, "annotations");
  const annotations = await deserializeAnnotationsGroup(
    annotationsGroup,
    loadCb,
  );
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
    data: { images, annotations, kinds, categories },
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

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
import { LoadCB } from "utils/file-io/types";
import { CustomStore } from "utils/file-io/zarr/stores";
import { DataState, ProjectState } from "store/types";
import {
  BitDepth,
  ImageData,
  AnnotationObject,
  ImageMetadata,
} from "store/data/types";
import { Kind, Category } from "store/data/types";
import { EntityState } from "@reduxjs/toolkit";
import { v11_deserializeClassifierGroup } from "../v110/v11_deserializeClassifierGroup";
import { generateDataRelationships } from "store/data/utils";

const deserializeMetadatumGroup = async (
  name: string,
  metadatumGroup: Group,
): Promise<ImageMetadata> => {
  const id = (await getAttr(metadatumGroup, "metadata_id")) as string;
  const imageDataIds = (await getAttr(
    metadatumGroup,
    "image_data_ids",
  )) as string[];
  const kind = (await getAttr(metadatumGroup, "kind")) as string;
  const planes = (await getAttr(metadatumGroup, "planes")) as number;
  const channels = (await getAttr(metadatumGroup, "channels")) as number;
  const width = (await getAttr(metadatumGroup, "width")) as number;
  const height = (await getAttr(metadatumGroup, "height")) as number;
  const shape = { planes, channels, width, height };
  const bitDepth = (await getAttr(metadatumGroup, "bit_depth")) as BitDepth;
  const defaultImageId = (await getAttr(
    metadatumGroup,
    "default_image_id",
  )) as string;
  const timeSeries = (await getAttr(metadatumGroup, "time_series")) as boolean;

  return {
    id,
    name,
    kind,
    imageDataIds,
    bitDepth,
    shape,
    defaultImageId,
    timeSeries,
  };
};
const deserializeMetadataGroup = async (
  metadataGroup: Group,
  loadCb: LoadCB,
) => {
  const metadataNames = (await getAttr(
    metadataGroup,
    "metadata_names",
  )) as string[];

  const metadata: EntityState<ImageMetadata, string> = {
    ids: [],
    entities: {},
  };

  for (const [i, name] of Object.entries(metadataNames)) {
    // import.meta.env.VITE_APP_LOG_LEVEL === "1" &&
    //   logger(`deserializing image ${+i + 1}/${thingNames.length}`);

    loadCb(
      +i / (metadataNames.length - 1),
      `deserializing image ${+i + 1}/${metadataNames.length}`,
    );

    const metadatumGroup = await getGroup(metadataGroup, name);
    const metadatum = await deserializeMetadatumGroup(name, metadatumGroup);
    metadata.ids.push(metadatum.id);
    metadata.entities[metadatum.id] = metadatum;
  }

  // final image complete
  loadCb(1, "");

  return metadata;
};

const deserializeImageGroup = async (
  name: string,
  imageGroup: Group,
  metadata: Record<string, ImageMetadata>,
): Promise<ImageData> => {
  const id = (await getAttr(imageGroup, "image_id")) as string;
  const partition = (await getAttr(
    imageGroup,
    "classifier_partition",
  )) as Partition;
  const timepoint = (await getAttr(imageGroup, "timepoint")) as number;
  const categoryId = (await getAttr(imageGroup, "class_category_id")) as string;
  const activePlane = (await getAttr(imageGroup, "active_plane")) as number;
  const metadataId = (await getAttr(imageGroup, "metadata_id")) as string;
  const imageDataset = await getDataset(imageGroup, name);
  const imageRawArray = (await imageDataset.getRaw()) as RawArray;
  const imageData = imageRawArray.data as Float32Array;
  const { shape, bitDepth } = metadata[metadataId];
  const data = tensor4d(
    imageData,
    [shape.planes, shape.height, shape.width, shape.channels],
    "float32",
  );
  const colorsGroup = await getGroup(imageGroup, "colors");
  const colors = await deserializeColorsGroup(colorsGroup);
  const src = await createRenderedTensor(data, colors, bitDepth, activePlane);

  return {
    id,
    metadataId,
    activePlane,
    name,
    partition,
    timepoint,
    categoryId,
    colors,
    src,
    data,
  };
};
const deserializeImagesGroup = async (
  imagesGroup: Group,
  loadCb: LoadCB,
  metadata: Record<string, ImageMetadata>,
) => {
  const imageNames = (await getAttr(imagesGroup, "image_names")) as string[];

  const images: EntityState<ImageData, string> = {
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
    const image = await deserializeImageGroup(name, imageGroup, metadata);
    images.ids.push(image.id);
    images.entities[image.id] = image;
  }

  // final image complete
  loadCb(1, "");

  return images;
};
const deserializeAnnotationGroup = async (
  name: string,
  annotationGroup: Group,
): Promise<AnnotationObject> => {
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
  const timepoint = (await getAttr(annotationGroup, "timepoint")) as number;

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

  const annotations: EntityState<AnnotationObject, string> = {
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
  data: DataState;
}> => {
  const name = (await getAttr(projectGroup, "name")) as string;
  const imageChannels = (await getAttr(projectGroup, "imageChannels")) as
    | number
    | string;
  const metadataGroup = await getGroup(projectGroup, "metadata");
  const metadata = await deserializeMetadataGroup(metadataGroup, loadCb);
  const imagesGroup = await getGroup(projectGroup, "images");
  const images = await deserializeImagesGroup(
    imagesGroup,
    loadCb,
    metadata.entities,
  );
  const annotationsGroup = await getGroup(projectGroup, "annotations");
  const annotations = await deserializeAnnotationsGroup(
    annotationsGroup,
    loadCb,
  );
  const kindsGroup = await getGroup(projectGroup, "kinds");
  const kinds = await deserializeKindsGroup(kindsGroup);
  const categoriesGroup = await getGroup(projectGroup, "categories");
  const categories = await deserializeCategoriesGroup(categoriesGroup);

  const relationships = generateDataRelationships(
    Object.values(kinds.entities),
    Object.values(categories.entities),
    Object.values(images.entities),
    Object.values(annotations.entities),
  );

  return {
    project: {
      ...initialProjectState,
      name,
      imageChannels: imageChannels === "undefined" ? undefined : +imageChannels,
    },
    data: {
      metadata,
      images,
      annotations,
      kinds,
      categories,
      relationships,
      linkGraph: {},
      globalAnnotations: {},
    },
  };
};

export const v12_deserializeProject = async (
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

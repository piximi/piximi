import { Group, openGroup } from "zarr";

import { logger } from "utils/logUtils";
import {
  METADATA_GROUP_ATTRS,
  IMAGE_GROUP_ATTRS,
  ANNOTATION_GROUP_ATTRS,
  CATEGORY_GROUP_ATTRS,
  KIND_GROUP_ATTRS,
} from "../../enums";
import { initialState as initialProjectState } from "store/project/projectSlice";
import { deserializeRawColorsGroup } from "../common/group-deserializers/deserializeRawColorsGroup";
import { deserializeSegmenterGroup } from "../common/group-deserializers/deserializeSegmenterGroup";
import { getAttr, getDataset, getGroup } from "../../zarr/zarrUtils";
import { RawArray } from "zarr/types/rawArray";
import { tensor4d } from "@tensorflow/tfjs";
import { Partition } from "utils/models/enums";
import { createRenderedTensor, generateBlankColors } from "utils/tensorUtils";
import {
  LoadCB,
  V12AnnotationObject,
  V12Category,
  V12ImageData,
  V12ImageMetadata,
  V12Kind,
} from "utils/file-io/types";
import { CustomStore } from "utils/file-io/zarr/stores";
import { DataState, ProjectState } from "store/types";
import { BitDepth } from "store/data/types";
import { EntityState } from "@reduxjs/toolkit";
import { v11_deserializeClassifierGroup } from "../v110/v11_deserializeClassifierGroup";
import { generateDataRelationships } from "store/data/utils";

const deserializeMetadatumGroup = async (
  name: string,
  metadatumGroup: Group,
): Promise<V12ImageMetadata> => {
  const id = (await getAttr(metadatumGroup, METADATA_GROUP_ATTRS.Id)) as string;
  const imageDataIds = (await getAttr(
    metadatumGroup,
    METADATA_GROUP_ATTRS.ImageDataIds,
  )) as string[];
  const kind = (await getAttr(
    metadatumGroup,
    METADATA_GROUP_ATTRS.Kinds,
  )) as string;
  const planes = (await getAttr(
    metadatumGroup,
    METADATA_GROUP_ATTRS.Planes,
  )) as number;
  const channels = (await getAttr(
    metadatumGroup,
    METADATA_GROUP_ATTRS.Channels,
  )) as number;
  const width = (await getAttr(
    metadatumGroup,
    METADATA_GROUP_ATTRS.Width,
  )) as number;
  const height = (await getAttr(
    metadatumGroup,
    METADATA_GROUP_ATTRS.Height,
  )) as number;
  const shape = { planes, channels, width, height };
  const bitDepth = (await getAttr(
    metadatumGroup,
    METADATA_GROUP_ATTRS.BitDepth,
  )) as BitDepth;
  const defaultImageId = (await getAttr(
    metadatumGroup,
    METADATA_GROUP_ATTRS.DefaultImageId,
  )) as string;
  const timeSeries = (await getAttr(
    metadatumGroup,
    METADATA_GROUP_ATTRS.TimeSeries,
  )) as boolean;

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
    METADATA_GROUP_ATTRS.MetadataNames,
  )) as string[];

  const metadata: EntityState<V12ImageMetadata, string> = {
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
  metadata: Record<string, V12ImageMetadata>,
): Promise<V12ImageData> => {
  const id = (await getAttr(imageGroup, IMAGE_GROUP_ATTRS.Id)) as string;
  const partition = (await getAttr(
    imageGroup,
    IMAGE_GROUP_ATTRS.ClassifierPartition,
  )) as Partition;
  const timepoint = (await getAttr(
    imageGroup,
    IMAGE_GROUP_ATTRS.Timepoint,
  )) as number;
  const categoryId = (await getAttr(
    imageGroup,
    IMAGE_GROUP_ATTRS.ClassCategoryId,
  )) as string;
  const activePlane = (await getAttr(
    imageGroup,
    IMAGE_GROUP_ATTRS.ActivePlane,
  )) as number;
  const metadataId = (await getAttr(
    imageGroup,
    IMAGE_GROUP_ATTRS.MetadataId,
  )) as string;
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
  const colors = await deserializeRawColorsGroup(colorsGroup);
  const src = await createRenderedTensor(
    data,
    colors,
    shape.channels,
    bitDepth,
    activePlane,
  );

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
  metadata: Record<string, V12ImageMetadata>,
) => {
  const imageNames = (await getAttr(
    imagesGroup,
    IMAGE_GROUP_ATTRS.ImageNames,
  )) as string[];

  const images: EntityState<V12ImageData, string> = {
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
): Promise<V12AnnotationObject> => {
  const id = (await getAttr(
    annotationGroup,
    ANNOTATION_GROUP_ATTRS.Id,
  )) as string;
  const activePlane = (await getAttr(
    annotationGroup,
    ANNOTATION_GROUP_ATTRS.ActivePlane,
  )) as number;
  const categoryId = (await getAttr(
    annotationGroup,
    ANNOTATION_GROUP_ATTRS.ClassCategoryId,
  )) as string;
  const partition = (await getAttr(
    annotationGroup,
    ANNOTATION_GROUP_ATTRS.ClassifierPartition,
  )) as Partition;
  const kind = (await getAttr(
    annotationGroup,
    ANNOTATION_GROUP_ATTRS.Kind,
  )) as string;
  const timepoint = (await getAttr(
    annotationGroup,
    ANNOTATION_GROUP_ATTRS.Timepoint,
  )) as number;

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

  const boundingBox = (await getAttr(
    annotationGroup,
    ANNOTATION_GROUP_ATTRS.Bbox,
  )) as [number, number, number, number];
  const encodedMask = (await getAttr(
    annotationGroup,
    ANNOTATION_GROUP_ATTRS.Mask,
  )) as number[];
  const plane = activePlane;
  const imageId = (await getAttr(
    annotationGroup,
    ANNOTATION_GROUP_ATTRS.ImageId,
  )) as string;
  const colors = generateBlankColors(channels);
  const src = await createRenderedTensor(
    imageTensor,
    colors,
    channels,
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
    ANNOTATION_GROUP_ATTRS.AnnotationNames,
  )) as string[];

  const annotations: EntityState<V12AnnotationObject, string> = {
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
): Promise<EntityState<V12Category, string>> => {
  const ids = (await getAttr(
    categoriesGroup,
    CATEGORY_GROUP_ATTRS.CategoryId,
  )) as string[];
  const colors = (await getAttr(
    categoriesGroup,
    CATEGORY_GROUP_ATTRS.Color,
  )) as string[];
  const names = (await getAttr(
    categoriesGroup,
    CATEGORY_GROUP_ATTRS.Name,
  )) as string[];
  const kinds = (await getAttr(
    categoriesGroup,
    CATEGORY_GROUP_ATTRS.Kind,
  )) as string[];

  if (ids.length !== colors.length || ids.length !== names.length) {
    throw Error(
      `Expected categories group "${categoriesGroup.path}" to have "${ids.length}" number of ids, colors, names, and visibilities`,
    );
  }

  const categories: EntityState<V12Category, string> = {
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
      visible: true,
    };
  }

  return categories;
};

const deserializeKindsGroup = async (
  kindsGroup: Group,
): Promise<EntityState<V12Kind, string>> => {
  const ids = (await getAttr(kindsGroup, KIND_GROUP_ATTRS.KindId)) as string[];
  const unknownCategoryIds = (await getAttr(
    kindsGroup,
    KIND_GROUP_ATTRS.UnknownCategoryId,
  )) as string[];
  const displayNames = (await getAttr(
    kindsGroup,
    KIND_GROUP_ATTRS.DisplayName,
  )) as string[];
  if (ids.length !== unknownCategoryIds.length) {
    throw Error(
      `Expected categories group "${kindsGroup.path}" to have "${ids.length}" number of ids, colors, names, and visibilities`,
    );
  }

  const kinds: EntityState<V12Kind, string> = { ids: [], entities: {} };
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

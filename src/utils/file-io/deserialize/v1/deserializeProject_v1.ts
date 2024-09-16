import { tensor4d } from "@tensorflow/tfjs";
import { openGroup, Group } from "zarr";

import { initialState as initialProjectState } from "store/project/projectSlice";

import { RawArray } from "zarr/types/rawArray";
import { logger } from "utils/common/helpers";
import { getAttr, getDataset, getDatasetSelection, getGroup } from "../helpers";
import {
  deserializeClassifierGroup,
  deserializeColorsGroup,
  deserializeSegmenterGroup,
} from "../common/groupDeserializers";
import { Partition } from "utils/models/enums";
import { createRenderedTensor } from "utils/common/tensorHelpers";
import { BitDepth, LoadCB } from "utils/file-io/types";
import { CustomStore } from "utils/file-io/zarrStores";
import { ProjectState } from "store/types";
import { OldAnnotationType, OldCategory, OldImageType } from "store/data/types";
import { UNKNOWN_IMAGE_CATEGORY_ID } from "store/data/constants";

/*
  ====================
  File Deserialization
  ====================
 */

const deserializeAnnotationsGroup = async (
  annotationsGroup: Group
): Promise<Array<OldAnnotationType>> => {
  const imageIds = (await getAttr(annotationsGroup, "image_id")) as string[];

  const categories = (await getAttr(
    annotationsGroup,
    "annotation_category_id"
  )) as string[];

  const ids = (await getAttr(annotationsGroup, "annotation_id")) as string[];

  const bboxes = await getDatasetSelection(annotationsGroup, "bounding_box", [
    null,
  ]).then((ra) => ra.data as Uint8Array);

  const maskLengths = await getDatasetSelection(
    annotationsGroup,
    "mask_length",
    [null]
  ).then((ra) => ra.data as Uint8Array);

  const masks = await getDatasetSelection(annotationsGroup, "mask", [
    null,
  ]).then((ra) => ra.data as Uint8Array);

  const planes = await getDatasetSelection(annotationsGroup, "plane", [
    null,
  ]).then((ra) => ra.data as Uint8Array);

  let annotations: Array<OldAnnotationType> = [];
  let bboxIdx = 0;
  let maskIdx = 0;
  for (let i = 0; i < ids.length; i++) {
    annotations.push({
      id: ids[i],
      categoryId: categories[i],
      plane: planes[i],
      boundingBox: Array.from(bboxes.slice(bboxIdx, bboxIdx + 4)) as [
        number,
        number,
        number,
        number
      ],
      encodedMask: Array.from(masks.slice(maskIdx, maskIdx + maskLengths[i])),
      imageId: imageIds[i],
    });

    bboxIdx += 4;
    maskIdx += maskLengths[i];
  }

  return annotations;
};

const deserializeImageGroup = async (
  name: string,
  imageGroup: Group
): Promise<OldImageType> => {
  const id = (await getAttr(imageGroup, "image_id")) as string;
  const activePlane = (await getAttr(imageGroup, "active_plane")) as number;
  const categoryId = (await getAttr(imageGroup, "class_category_id")) as string;
  // const classifierPartition = (await getAttr(
  //   imageGroup,
  //   "classifier_partition"
  // )) as Partition;

  const colorsGroup = await getGroup(imageGroup, "colors");
  const colors = await deserializeColorsGroup(colorsGroup);

  const imageDataset = await getDataset(imageGroup, name);
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

  return {
    id,
    name,
    activePlane,
    categoryId,
    partition:
      categoryId === UNKNOWN_IMAGE_CATEGORY_ID
        ? Partition.Inference
        : Partition.Unassigned,
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
};

const deserializeImagesGroup = async (imagesGroup: Group, loadCb: LoadCB) => {
  const imageNames = (await getAttr(imagesGroup, "image_names")) as string[];

  const images: Array<OldImageType> = [];

  for (const [i, name] of Object.entries(imageNames)) {
    // process.env.REACT_APP_LOG_LEVEL === "1" &&
    //   logger(`deserializing image ${+i + 1}/${imageNames.length}`);

    loadCb(
      +i / (imageNames.length - 1),
      `deserializing image ${+i + 1}/${imageNames.length}`
    );

    const imageGroup = await getGroup(imagesGroup, name);
    const image = await deserializeImageGroup(name, imageGroup);
    images.push(image);
  }

  // final image complete
  loadCb(1, "");

  return images;
};

const deserializeCategoriesGroup = async (
  categoriesGroup: Group
): Promise<Array<OldCategory>> => {
  const ids = (await getAttr(categoriesGroup, "category_id")) as string[];
  const colors = (await getAttr(categoriesGroup, "color")) as string[];
  const names = (await getAttr(categoriesGroup, "name")) as string[];

  if (ids.length !== colors.length || ids.length !== names.length) {
    throw Error(
      `Expected categories group "${categoriesGroup.path}" to have "${ids.length}" number of ids, colors, names, and visibilities`
    );
  }

  const categories: Array<OldCategory> = [];
  for (let i = 0; i < ids.length; i++) {
    categories.push({
      id: ids[i],
      color: colors[i],
      name: names[i],
      visible: true,
    });
  }

  return categories;
};

const deserializeProjectGroup = async (
  projectGroup: Group,
  loadCb: LoadCB
): Promise<{
  project: ProjectState;
  data: {
    images: Array<OldImageType>;
    annotations: Array<OldAnnotationType>;
    categories: Array<OldCategory>;
    annotationCategories: Array<OldCategory>;
  };
}> => {
  const name = (await getAttr(projectGroup, "name")) as string;

  const imagesGroup = await getGroup(projectGroup, "images");
  const images = await deserializeImagesGroup(imagesGroup, loadCb);

  const annotationsGroup = await getGroup(projectGroup, "annotations");
  const annotations = await deserializeAnnotationsGroup(annotationsGroup);

  const categoriesGroup = await getGroup(projectGroup, "categories");
  const categories = await deserializeCategoriesGroup(categoriesGroup);

  const annotationCategoriesGroup = await getGroup(
    projectGroup,
    "annotationCategories"
  );
  const annotationCategories = await deserializeCategoriesGroup(
    annotationCategoriesGroup
  );

  return {
    project: {
      ...initialProjectState,
      name,
    },
    data: { images, annotations, categories, annotationCategories },
  };
};

export const deserializeProject_v1 = async (
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

  return {
    project,
    classifier,
    data,
    segmenter,
  };
};

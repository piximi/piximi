import { v4 as uuidv4 } from "uuid";
import { union } from "lodash";
import IJSImage from "image-js";
import { tensor2d, image as tfImage } from "@tensorflow/tfjs";

import {
  ImageObject,
  TSImageObject,
  FullTimepointImage,
} from "store/data/types";
import {
  UNKNOWN_CATEGORY_NAME,
  UNKNOWN_IMAGE_CATEGORY_COLOR,
} from "./constants";

import { Category, Kind } from "./types";

export const generateUUID = (options?: { definesUnknown: boolean }) => {
  const id = uuidv4();
  let unknownFlag: string;
  if (options?.definesUnknown) {
    unknownFlag = "0";
  } else {
    unknownFlag = "1";
  }
  return unknownFlag + id.slice(1);
};

export const isUnknownCategory = (categoryId: string) => {
  return categoryId[0] === "0";
};

const generateUnknownCategory = (kind: string) => {
  const unknownCategoryId = generateUUID({ definesUnknown: true });
  const unknownCategory: Category = {
    id: unknownCategoryId,
    name: UNKNOWN_CATEGORY_NAME,
    color: UNKNOWN_IMAGE_CATEGORY_COLOR,
    containing: [],
    kind: kind,
    visible: true,
  };
  return unknownCategory;
};

export const generateCategory = (
  name: string,
  kindId: string,
  color: string,
) => {
  const id = generateUUID();
  return {
    name,
    id,
    kind: kindId,
    color,
    containing: [],
    visible: true,
  } as Category;
};

export const generateKind = (kindName: string, useUUID?: boolean) => {
  const kindId = useUUID ? generateUUID() : kindName;
  const unknownCategory = generateUnknownCategory(kindId);
  const kind: Kind = {
    id: kindId,
    displayName: kindName,
    categories: [unknownCategory.id],
    unknownCategoryId: unknownCategory.id,
    containing: [],
  };
  return { kind, unknownCategory };
};

export const updateContents = (
  previousContents: string[],
  contents: string[],
  updateType: "add" | "remove" | "replace",
) => {
  let newContents: string[];

  switch (updateType) {
    case "add":
      newContents = union(previousContents, contents);
      break;
    case "remove":
      newContents = previousContents.filter((a) => !contents.includes(a));
      break;
    case "replace":
      newContents = contents;
  }
  return newContents;
};

export const getPropertiesFromImage = async (
  image: ImageObject,
  annotation: { boundingBox: [number, number, number, number] },
) => {
  const renderedIm = await IJSImage.load(image.src);
  const normalizingWidth = image.shape.width - 1;
  const normalizingHeight = image.shape.height - 1;
  const bbox = annotation.boundingBox;
  const x1 = bbox[0] / normalizingWidth;
  const x2 = bbox[2] / normalizingWidth;
  const y1 = bbox[1] / normalizingHeight;
  const y2 = bbox[3] / normalizingHeight;
  const box = tensor2d([[y1, x1, y2, x2]]);
  const width = bbox[2] - bbox[0];
  const height = bbox[3] - bbox[1];
  const objectImage = renderedIm.crop({
    x: Math.abs(bbox[0]),
    y: Math.abs(bbox[1]),
    width: Math.abs(Math.min(image.shape.width, bbox[2]) - bbox[0]),
    height: Math.abs(Math.min(image.shape.height, bbox[3]) - bbox[1]),
  });
  const objSrc = objectImage.getCanvas().toDataURL();
  const data = tfImage.cropAndResize(image.data, box, [0], [height, width]);

  return {
    data: data,
    src: objSrc,
    imageId: image.id,
    boundingBox: bbox,
  };
};

export const getPropertiesFromImageSync = (
  renderedIm: IJSImage,
  image: ImageObject,
  annotation: { boundingBox: number[] },
) => {
  const normalizingWidth = image.shape.width - 1;
  const normalizingHeight = image.shape.height - 1;
  const bbox = annotation.boundingBox;
  const x1 = bbox[0] / normalizingWidth;
  const x2 = bbox[2] / normalizingWidth;
  const y1 = bbox[1] / normalizingHeight;
  const y2 = bbox[3] / normalizingHeight;
  const box = tensor2d([[y1, x1, y2, x2]]);
  const width = bbox[2] - bbox[0];
  const height = bbox[3] - bbox[1];
  const objectImage = renderedIm.crop({
    x: Math.abs(bbox[0]),
    y: Math.abs(bbox[1]),
    width: Math.abs(Math.min(image.shape.width, bbox[2]) - bbox[0]),
    height: Math.abs(Math.min(image.shape.height, bbox[3]) - bbox[1]),
  });
  const objSrc = objectImage.getCanvas().toDataURL();
  const data = tfImage.cropAndResize(image.data, box, [0], [height, width]);
  box.dispose();

  return {
    data: data,
    src: objSrc,
    imageId: image.id,
    boundingBox: bbox as [number, number, number, number],
    bitDepth: image.bitDepth,
  };
};

export const getFullTimepointImage = (
  timeSeriesImage: TSImageObject,
  timePoint: number,
): FullTimepointImage => {
  const timePointData = timeSeriesImage.timepoints[timePoint];
  if (!timePointData) {
    throw new Error(
      `Time point ${timePoint} does not exist in image ${timeSeriesImage.id}`,
    );
  }
  return {
    id: timeSeriesImage.id,
    name: timeSeriesImage.name,
    kind: timeSeriesImage.kind,
    bitDepth: timeSeriesImage.bitDepth,
    containing: timeSeriesImage.containing,
    partition: timeSeriesImage.partition,
    shape: timeSeriesImage.shape,
    src: timePointData.src,
    data: timePointData.data,
    colors: timePointData.colors,
    categoryId: timePointData.categoryId,
    activePlane: timePointData.activePlane,
    timepoint: timePoint,
  };
};

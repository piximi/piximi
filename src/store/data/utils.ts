import { v4 as uuidv4 } from "uuid";
import { union } from "lodash";
import IJSImage from "image-js";
import { tensor2d, image as tfImage, gather, Tensor4D } from "@tensorflow/tfjs";

import {
  ImageObject,
  TSImageObject,
  FullTimepointImage,
  TPKey,
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
  image: ImageObject | FullTimepointImage,
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
  image: ImageObject | FullTimepointImage,
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

export const extractTimepoint = (
  timeSeriesImage: TSImageObject,
  timepoint: TPKey,
): FullTimepointImage => {
  const timePointData = timeSeriesImage.timepoints[timepoint];
  if (!timePointData) {
    throw new Error(
      `Time point ${timepoint} does not exist in image ${timeSeriesImage.id}`,
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
    timepoint: timepoint,
  };
};

export const extractAllTimepoints = (
  imageSeries: TSImageObject,
): FullTimepointImage[] => {
  const tpImages = Object.keys(imageSeries.timepoints).reduce(
    (tpImages: FullTimepointImage[], tp) => {
      tpImages.push(extractTimepoint(imageSeries, tp));
      return tpImages;
    },
    [],
  );
  return tpImages;
};
export const extractZPlane = (
  image: FullTimepointImage,
  plane: number,
): FullTimepointImage | FullTimepointImage => {
  if (image.shape.planes === 1) return image;
  const planeData = gather(image.data, plane, 0).expandDims(0);

  return {
    id: image.id,
    name: image.name,
    kind: image.kind,
    bitDepth: image.bitDepth,
    containing: image.containing,
    partition: image.partition,
    shape: { ...image.shape, planes: 1 },
    src: image.src, //necessary to generate new source?
    data: planeData as Tensor4D,
    colors: image.colors,
    categoryId: image.categoryId,
    activePlane: plane,
    timepoint: image.timepoint,
  };
};
// export const extractAllZPlanes = (
//   image: FullTimepointImage,
// ): FullTimepointImage[] => {
//   const planes = image.shape.planes;
//   if (planes === 1) return [image];
//   const planeData = tfsplit(image.data, planes, 0);

//   const tzReducedImages = planeData.map((data, idx) => {
//     return {
//       id: image.id,
//       name: image.name,
//       kind: image.kind,
//       bitDepth: image.bitDepth,
//       containing: image.containing,
//       partition: image.partition,
//       shape: { ...image.shape, planes: 1 },
//       src: image.src, //necessary to generate new source?
//       data: data as Tensor4D,
//       colors: image.colors,
//       categoryId: image.categoryId,
//       activePlane: idx,
//       timepoint: image.timepoint,
//     };
//   });

//   return tzReducedImages;
// };

/**
 * Extracts all z-planes from a 3D image into separate `FullTimepointImage` objects,
 * each representing a single plane. If the image contains only one plane,
 * returns the original image in an array. Doesnt actually extract plane since
 * extraction is done in the segmentation preprocessing.
 *
 * @param {FullTimepointImage} image - The source image containing multiple z-planes.
 * @returns {FullTimepointImage[]} An array of images, each with one plane extracted
 *                                  and `activePlane` set accordingly.
 */
export const extractAllZPlanes = (
  image: FullTimepointImage,
): FullTimepointImage[] => {
  const planes = image.shape.planes;
  if (planes === 1) return [image];

  const extractedPlanes: FullTimepointImage[] = [];

  for (let i = 0; i < planes; i++) {
    extractedPlanes.push({
      id: image.id,
      name: image.name,
      kind: image.kind,
      bitDepth: image.bitDepth,
      containing: image.containing,
      partition: image.partition,
      shape: { ...image.shape, planes: 1 },
      src: image.src, //necessary to generate new source?
      data: image.data,
      colors: image.colors,
      categoryId: image.categoryId,
      activePlane: i,
      timepoint: image.timepoint,
    });
  }

  return extractedPlanes;
};

export const getTZReducedImage = (
  timeSeriesImage: TSImageObject,
  timepoint: TPKey,
  plane?: number,
): FullTimepointImage | FullTimepointImage => {
  const timePointData = timeSeriesImage.timepoints[timepoint];
  if (!timePointData) {
    throw new Error(
      `Time point ${timepoint} does not exist in image ${timeSeriesImage.id}`,
    );
  }
  const tzReducedImage = {
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
    timepoint: timepoint,
  };

  if (plane) {
    const planeData = gather(tzReducedImage.data, plane, 0);
    tzReducedImage.data = planeData;
  }

  return tzReducedImage;
};

export const extractChannel = (
  image: FullTimepointImage,
  channel: number,
): FullTimepointImage => {
  const numChannels = image.shape.channels;
  if (channel >= numChannels)
    throw new Error(
      `Provided channel "${channel}" is larger than the number of channels in the image (${numChannels})`,
    );
  const channelData = gather(image.data, channel, 3).expandDims(-1);

  return {
    id: image.id,
    name: image.name,
    kind: image.kind,
    bitDepth: image.bitDepth,
    containing: image.containing,
    partition: image.partition,
    shape: { ...image.shape, channels: 1 },
    src: image.src, //necessary to generate new source?
    data: channelData as Tensor4D,
    colors: image.colors,
    categoryId: image.categoryId,
    activePlane: image.activePlane,
    timepoint: image.timepoint,
  };
};

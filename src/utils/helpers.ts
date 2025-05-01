import IJSImage from "image-js";
import { tensor2d, image as tfImage } from "@tensorflow/tfjs";

import { availableImageSortKeys, defaultImageSortKey } from "./constants";
import { ImageSortKey } from "./enums";

import { ImageObject, Shape, ShapeArray } from "store/data/types";
import { DeferredEntity, ImageSortKeyType } from "./types";

//HACK: move shape functions to more specific file
export const convertShapeToArray = (shape: Shape): ShapeArray => {
  return Object.values(shape) as ShapeArray;
};

export const convertArrayToShape = (array: ShapeArray): Shape => {
  return {
    planes: array[0],
    height: array[1],
    width: array[2],
    channels: array[3],
  };
};

export const sortTypeByKey = (key: ImageSortKey): ImageSortKeyType => {
  const sortKeyIdx = availableImageSortKeys
    .map((e) => e.imageSortKey)
    .indexOf(key);

  if (sortKeyIdx >= 0) {
    return availableImageSortKeys[sortKeyIdx];
  } else {
    return defaultImageSortKey;
  }
};

/*
 =======================
 General Utility Methods
 =======================
 */

export const getInnerElementWidth = (el: HTMLElement) => {
  const {
    width: _elWidth,
    paddingLeft: _elPl,
    paddingRight: _elPr,
  } = getComputedStyle(el);
  const _elWidthVal = +_elWidth.slice(0, -2);
  const _elPlVal = +_elPl.slice(0, -2);
  const _elPrVal = +_elPr.slice(0, -2);
  return _elWidthVal - _elPlVal - _elPrVal;
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
const componentToHex = (c: number) => {
  const hex = (c * 255).toString(16);
  return hex.length === 1 ? "0" + hex : hex;
};

export const rgbToHex = (rgb: [number, number, number]) => {
  return (
    "#" +
    componentToHex(rgb[0]) +
    componentToHex(rgb[1]) +
    componentToHex(rgb[2])
  );
};

export function getCompleteEntity<T>(entity: DeferredEntity<T>): T | undefined {
  if (entity.changes.deleted) return;
  const {
    added: _added,
    deleted: _deleted,
    ...completeEntity
  } = {
    ...entity.saved,
    ...entity.changes,
  };
  return completeEntity as T;
}

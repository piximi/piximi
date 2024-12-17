// ignore-no-logs

import StackTrace from "stacktrace-js";
import { BitDepth, DataArray } from "utils/file-io/types";
import IJSImage from "image-js";
import { tensor2d, image as tfImage } from "@tensorflow/tfjs";

import {
  availableImageSortKeys,
  defaultImageSortKey,
  UNKNOWN_IMAGE_CATEGORY_COLOR,
} from "./constants";
import { UNKNOWN_CATEGORY_NAME } from "store/data/constants";
import { AlertType, ImageSortKey } from "./enums";

import { Category, ImageObject, Shape, ShapeArray } from "store/data/types";
import { FilterType, ImageSortKeyType, RecursivePartial } from "./types";

/* 
  ERROR HANDLING / LOGGING
*/
export const getStackTraceFromError = async (error: Error): Promise<string> => {
  let stacktrace = error.stack ? error.stack : "";
  try {
    const stackFrames = await StackTrace.fromError(error);
    stacktrace = stackFrames
      .map((stackFrame) => stackFrame.toString())
      .join("\n");
  } catch (error) {
    console.error("Could not resolve stacktrace", error);
  }

  return stacktrace;
};

export const createGitHubIssue = (
  title: string,
  body: string,
  alertType: AlertType = AlertType.Error,
) => {
  const label = alertType === AlertType.Error ? "bug" : "help%20wanted";
  const url =
    "https://github.com/piximi/piximi/issues/new?title=" +
    encodeURIComponent(title) +
    "&labels=" +
    label +
    "&body=" +
    encodeURIComponent(body);
  window.open(url);
};

export const logger = (
  message: any | any[],
  options?: { level?: "log" | "warn" | "error"; dev?: boolean },
) => {
  if (!options) {
    options = { level: "log" };
  } else {
    if (!options.level) {
      options.level = "log";
    }
  }
  if (Array.isArray(message)) {
    message = message.join("");
  }
  if (options?.dev) {
    if (import.meta.env.NODE_ENV !== "production") {
      switch (options.level) {
        case "log":
          console.log(message);
          break;
        case "warn":
          console.warn(message);
          break;
        case "error":
          console.error(message);
          break;
        default:
          break;
      }
    }
  } else {
    switch (options.level) {
      case "log":
        console.log(message);
        break;
      case "warn":
        console.warn(message);
        break;
      case "error":
        console.error(message);
        break;
      default:
        break;
    }
  }
};

/* 
  ARRAY / OBJECT HELPERS
*/

export const isObjectEmpty = <T extends Object>(obj: T) => {
  return Object.keys(obj).length === 0;
};

export const enumKeys = <O extends object, K extends keyof O = keyof O>(
  obj: O,
): K[] => {
  return Object.keys(obj).filter((k) => Number.isNaN(+k)) as K[];
};

export const mutatingFilter = <T>(
  array: Array<T>,
  condition: (arg: T) => boolean,
): void => {
  for (let l = array.length - 1; l >= 0; l -= 1) {
    if (!condition(array[l])) array.splice(l, 1);
  }
};

export const toUnique = <T>(array: T[]): T[] => {
  return [...new Set(array)];
};

export const isFiltered = <T extends object>(
  object: T,
  filters: FilterType<T>,
): boolean => {
  return Object.keys(object).some((key) => {
    const itemValue = object[key as keyof T];
    const filterValues = filters[key as keyof T];

    if (Array.isArray(filterValues)) {
      return (filterValues as Array<typeof itemValue>).includes(itemValue);
    }

    // If the key is not present in the record, include the item
    return false;
  });
};

export const filterObjects = <T extends object>(
  objectArr: T[],
  filters: FilterType<T>,
): T[] => {
  return objectArr.filter((item) => {
    return Object.keys(item).every((key) => {
      const itemValue = item[key as keyof T];
      const filterValues = filters[key as keyof T];

      if (Array.isArray(filterValues)) {
        return !(filterValues as Array<typeof itemValue>).includes(itemValue);
      }

      // If the key is not present in the record, include the item
      return true;
    });
  });
};

export const copyValues = <T extends object>(
  existingObject: T,
  updates: Partial<T>
) => {
  Object.entries(updates).forEach(([key, value]) => {
    existingObject[key as keyof T] = value as T[keyof T];
  });
};

export const recursiveAssign = <T extends object>(
  existingObject: T,
  updates: Partial<T>,
) => {
  Object.entries(updates).forEach(([key, value]) => {
    existingObject[key as keyof T] = value as T[keyof T];
  });
};

export const recursiveAssign = <T extends object>(
  existingObject: T,
  updates: RecursivePartial<T>,
) => {
  Object.entries(updates).forEach(([key, _value]) => {
    if (typeof existingObject[key as keyof T] === "object") {
      recursiveAssign(
        existingObject[key as keyof T] as object,
        updates[key as keyof T]!,
      );
    } else {
      Object.assign(
        existingObject[key as keyof T] as object,
        updates[key as keyof T]!,
      );
    }
  });
};

export const distinctFilter = <T>(value: T, index: number, self: T[]) => {
  return self.indexOf(value) === index;
};

export const getSubset = <T, K extends keyof T>(object: T, keys: K[]) => {
  const subset: Record<string, (typeof object)[K]> = {};

  keys.forEach((key) => {
    subset[key as string] = object[key];
  });
  return subset;
};

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

export const capitalize = (input: string) => {
  const capitalized: string[] = [];

  const words = input.split(" ");

  words.forEach((word) => {
    capitalized.push(word.charAt(0).toUpperCase() + word.slice(1));
  });
  return capitalized.join(" ");
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

export const updateRecord = <T extends string | number | symbol, K>(
  record: Record<T, K[]>,
  key: T,
  value: K
) => {
  if (key in record) {
    record[key].push(value);
  } else {
    record[key] = [value];
  }
};

/*
  CATEGORY HELPERS
*/

  if (sortKeyIdx >= 0) {
    return availableImageSortKeys[sortKeyIdx];
  } else {
    return defaultImageSortKey;
  }
};

export const updateRecordArray = <T extends string | number | symbol, K>(
  record: Record<T, K[]>,
  key: T,
  value: K | K[],
) => {
  if (!Array.isArray(value)) {
    value = [value];
  }
  if (key in record) {
    record[key].push(...value);
  } else {
    record[key] = [...value];
  }
};

/*
  FILE HELPERS
*/

export class PseudoFileList {
  private _files: File[];

  constructor(files: File[]) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    this._files = files;

    return new Proxy(this, {
      get(target, prop) {
        if (!isNaN(Number(prop)) && !(prop in target)) {
          return self._files[Number(prop)];
        } else {
          return Reflect.get(target, prop);
        }
      },
      // @ts-ignore only sort-of satisfies it, like when we use it
    }) satisfies FileList;
  }

  public item(elem: number) {
    return this._files[elem];
  }

  public get length() {
    return this._files.length;
  }

  [key: number]: File;

  [Symbol.iterator](): IterableIterator<File> {
    return this._files[Symbol.iterator]();
  }
}

/*
  STRING HELPERS
*/

export const pluralize = (word: string, count: number) => {
  return `${count > 1 ? word + "s" : word}`;
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

/*
 * Method to rename a cateogry/image if a category/image with this name already exists
 */
export const replaceDuplicateName = (
  newName: string,
  existingNames: Array<string>,
) => {
  let currentName = newName;
  let i = 1;
  while (existingNames.includes(currentName)) {
    currentName = newName + `_${i}`;
    i += 1;
  }
  return currentName;
};

//HACK: new
export const newReplaceDuplicateName = (
  newName: string,
  existingNames: Array<string>,
) => {
  const currentName = newName;
  let count = 0;
  // eslint-disable-next-line
  const nameRe = new RegExp(`${newName}(_\d+)?`, "g");
  existingNames.forEach((name) => {
    if (nameRe.exec(name)) {
      const suffix = +name.split("_")[1];
      if (suffix > count) {
        count = suffix;
      }
    }
  });
  return !count ? currentName : `${currentName}_${count + 1}`;
};

export const scaleUpRange = (
  range: [number, number],
  bitDepth: BitDepth,
): [number, number] => {
  return [
    Math.floor(range[0] * (2 ** bitDepth - 1)),
    Math.floor(range[1] * (2 ** bitDepth - 1)),
  ];
};

export const scaleUpRanges = (
  ranges: { [channel: number]: [number, number] },
  bitDepth: BitDepth,
  opts: { inPlace: boolean } = { inPlace: false },
): { [channel: number]: [number, number] } => {
  const operandRanges = opts.inPlace ? ranges : { ...ranges };

  for (const ch of Object.keys(ranges)) {
    const chKey = parseInt(ch);
    operandRanges[chKey] = scaleUpRange(ranges[chKey], bitDepth);
  }

  return ranges;
};

export const scaleDownRange = (
  range: [number, number],
  bitDepth: BitDepth,
): [number, number] => {
  return [range[0] / (2 ** bitDepth - 1), range[1] / (2 ** bitDepth - 1)];
};

export const scaleDownRanges = (
  ranges: { [channel: number]: [number, number] },
  bitDepth: BitDepth,
  opts: { inPlace: boolean } = { inPlace: false },
): { [channel: number]: [number, number] } => {
  const operandRanges = opts.inPlace ? ranges : { ...ranges };

  for (const ch of Object.keys(ranges)) {
    const chKey = parseInt(ch);
    operandRanges[chKey] = scaleDownRange(ranges[chKey], bitDepth);
  }

  return ranges;
};

export const extractMinMax = (ranges: {
  [channel: number]: [number, number];
}) => {
  const channels = Object.keys(ranges).map((ch) => parseInt(ch));
  const mins = Array(channels.length);
  const maxs = Array(channels.length);

  for (const ch of channels) {
    const [min, max] = ranges[ch];
    mins[ch] = min;
    maxs[ch] = max;
  }

  return { mins, maxs };
};

export const convertToDataArray = (
  depth: number,
  source: DataArray | Array<number>,
): DataArray => {
  switch (depth) {
    case 1:
      throw Error("Binary bit depth not (yet) supported");
    case 8:
      return Uint8Array.from(source);
    case 16:
      return Uint16Array.from(source);
    case 32:
      return Float32Array.from(source);
    default:
      throw Error("Unrecognized bit depth");
  }
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

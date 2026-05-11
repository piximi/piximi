import type {
  ExtendedAnnotationObject,
  ExtendedImageObject,
} from "store/dataV2/types";

import { AnnotationSortType, ImageSortType } from "./types";

import type { SortMap } from "./types";

// uuid -> numerical value (determenistic)
const hash = (id: string) => {
  let hashValue = 0;
  for (let i = 0; i < id.length; i++) {
    hashValue = (hashValue << 5) - hashValue + id.charCodeAt(i);
    hashValue |= 0; // Convert to 32-bit integer
  }
  return hashValue;
};

// taken from https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
// okay to use because security is not a concern for this use-case
const splitmix32 = (seed: number) => {
  seed |= 0;
  seed = (seed + 0x9e3779b9) | 0;
  let t = seed ^ (seed >>> 16);
  t = Math.imul(t, 0x21f0aaad);
  t = t ^ (t >>> 15);
  t = Math.imul(t, 0x735a2d97);
  return ((t = t ^ (t >>> 15)) >>> 0) / 4294967296;
};

// the number of possible values for this variable is equal to
// the number of possible "random" sortings that will be produced,
// e.g. if it's only one of `0` or `1`, then there will "randomly"
// be one of two possible sortings of Things.
// it must be a 32 bit number, therefore we generate across the largest
// distribution available to us by generatng a random positive 32 bit
// number. 2**31 because its signed, and we want a positive number
export const generateSeed = () => Math.floor(Math.random() * (2 ** 31 - 1));

const stringField =
  <T>(f: (i: T) => string) =>
  (a: T, b: T) =>
    f(a).localeCompare(f(b));
const numericField =
  <T>(f: (i: T) => number) =>
  (a: T, b: T) =>
    f(a) - f(b);

const randomSort =
  <T extends { id: string }>(seed: number) =>
  (a: T, b: T) =>
    splitmix32(hash(a.id) + seed) - splitmix32(hash(b.id) + seed);

const softmaxSort =
  <T extends { id: string }>(margined?: Record<string, number>) =>
  (a: T, b: T) =>
    (margined?.[a.id] ?? 1) - (margined?.[b.id] ?? 1);

export const noopSort = () => 0;

export const marginOf = (softmax: number[]): number => {
  let top1 = -Infinity,
    top2 = -Infinity;
  for (const p of softmax) {
    if (p > top1) {
      top2 = top1;
      top1 = p;
    } else if (p > top2) {
      top2 = p;
    }
  }
  return (top1 === -Infinity ? 0 : top1) - (top2 === -Infinity ? 0 : top2);
};

export const IMAGE_SORT_CASES: SortMap<ExtendedImageObject, ImageSortType> = {
  [ImageSortType.None]: () => noopSort,
  [ImageSortType.Random]: ({ seed }) => randomSort(seed),
  [ImageSortType.Name]: () => stringField((i) => i.name),
  [ImageSortType.FileName]: () => stringField((i) => i.name),
  [ImageSortType.Category]: () => stringField((i) => i.category.name),
  [ImageSortType.Softmax]: ({ margined }) => softmaxSort(margined),
};

export const ANNOTATION_SORT_CASES: SortMap<
  ExtendedAnnotationObject,
  AnnotationSortType
> = {
  [AnnotationSortType.None]: () => noopSort,
  [AnnotationSortType.Random]: ({ seed }) => randomSort(seed),
  [AnnotationSortType.Volume]: () => stringField((a) => a.volumeId),
  [AnnotationSortType.Image]: () => stringField((a) => a.imageName),
  [AnnotationSortType.Plane]: () => numericField((a) => a.planeIdx),
  [AnnotationSortType.Category]: () => stringField((a) => a.category.name),
  [AnnotationSortType.Softmax]: ({ margined }) => softmaxSort(margined),
};

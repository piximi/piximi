import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import { selectImageSortType } from "@ProjectViewer/state/selectors";
import { ImageSortType } from "@ProjectViewer/state/types";
import { ExtendedImageObject } from "store/dataV2/types";

// uuid -> numerical value (determenistic)
const hash = (id: ExtendedImageObject["id"]) => {
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
const generateSeed = () => Math.floor(Math.random() * (2 ** 31 - 1));

export const useImageSort = () => {
  const sortType = useSelector(selectImageSortType);
  const [previousSortType, setPreviousSortType] = useState<ImageSortType>(
    ImageSortType.None,
  );
  const theSortFunction = function (
    _a: ExtendedImageObject,
    _b: ExtendedImageObject,
  ) {
    return 0;
  };
  const [sortFunction, setSortFunction] = useState<
    (a: ExtendedImageObject, b: ExtendedImageObject) => number
  >(() => theSortFunction);

  useEffect(() => {
    if (sortType !== previousSortType && sortType !== ImageSortType.Category) {
      const randomSeed = generateSeed();
      setPreviousSortType(sortType);
      switch (sortType) {
        case ImageSortType.FileName:
          setSortFunction(
            () => (a: ExtendedImageObject, b: ExtendedImageObject) =>
              a.name.localeCompare(b.name),
          );
          break;

        case ImageSortType.Random:
          setSortFunction(
            () => (a: ExtendedImageObject, b: ExtendedImageObject) => {
              const aVal = splitmix32(hash(a.id) + randomSeed);
              const bVal = splitmix32(hash(b.id) + randomSeed);
              return aVal - bVal;
            },
          );
          break;
        case ImageSortType.Name:
          setSortFunction(
            () => (a: ExtendedImageObject, b: ExtendedImageObject) =>
              a.name.localeCompare(b.name),
          );
          break;
        case ImageSortType.None:
        default:
          setSortFunction(
            () => (_a: ExtendedImageObject, _b: ExtendedImageObject) => 0,
          );
      }
    }
  }, [sortType, previousSortType]);

  useEffect(() => {
    if (sortType === ImageSortType.Category) {
      setPreviousSortType(sortType);
      setSortFunction(
        () => (a: ExtendedImageObject, b: ExtendedImageObject) =>
          a.category.name.localeCompare(b.category.name),
      );
    }
  }, [sortType]);
  return sortFunction;
};

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectCategoriesDictionary } from "store/data/selectors";
import { Thing } from "store/data/types";
import { selectSortType } from "store/project/selectors";
import { ThingSortKey } from "utils/common/enums";

// uuid -> numerical value (determenistic)
const hash = (id: Thing["id"]) => {
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

export const useSortFunction = () => {
  const sortType = useSelector(selectSortType);
  const [previousSortType, setPreviousSortType] = useState<ThingSortKey>(
    ThingSortKey.None
  );
  const categories = useSelector(selectCategoriesDictionary);
  const theSortFunction = function (a: Thing, b: Thing) {
    return 0;
  };
  const [sortFunction, setSortFunction] = useState<
    (a: Thing, b: Thing) => number
  >(() => theSortFunction);

  useEffect(() => {
    if (sortType !== previousSortType && sortType !== ThingSortKey.Category) {
      const randomSeed = Math.floor(Math.random() * 100);
      setPreviousSortType(sortType);
      switch (sortType) {
        case ThingSortKey.FileName:
          setSortFunction(
            () => (a: Thing, b: Thing) => a.name.localeCompare(b.name)
          );
          break;

        case ThingSortKey.Random:
          setSortFunction(() => (a: Thing, b: Thing) => {
            const aHash = hash(a.name);
            const bHash = hash(b.name);
            const aVal = splitmix32(aHash + randomSeed);
            const bVal = splitmix32(bHash + randomSeed);
            return aVal - bVal;
          });
          break;
        case ThingSortKey.Name:
          setSortFunction(
            () => (a: Thing, b: Thing) => a.name.localeCompare(b.name)
          );
          break;
        case ThingSortKey.None:
        default:
          setSortFunction(() => (a: Thing, b: Thing) => 0);
      }
    }
  }, [sortType, categories, previousSortType]);

  useEffect(() => {
    if (sortType === ThingSortKey.Category) {
      setPreviousSortType(sortType);
      setSortFunction(
        () => (a: Thing, b: Thing) =>
          categories[a.categoryId].name.localeCompare(
            categories[b.categoryId].name
          )
      );
    }
  }, [sortType, categories]);
  return sortFunction;
};

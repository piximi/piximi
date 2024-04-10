import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectCategoriesDictionary } from "store/data/selectors";
import { Thing } from "store/data/types";
import { selectSortType } from "store/project/selectors";
import { ThingSortKey } from "utils/common/enums";

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
      setPreviousSortType(sortType);
      switch (sortType) {
        case ThingSortKey.FileName:
          setSortFunction(
            () => (a: Thing, b: Thing) => a.name.localeCompare(b.name)
          );
          break;

        case ThingSortKey.Random:
          setSortFunction(
            () => (a: Thing, b: Thing) =>
              Math.round(Math.random() * 10) >= 5 ? 1 : -1
          );
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

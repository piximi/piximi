import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectCategoriesDictionary } from "store/data/selectors/selectors";
import { Thing } from "store/data/types";
import { selectSortTypeNew } from "store/project/selectors";
import { ThingSortKey_new } from "utils/common/enums";

export const useSortFunctionNew = () => {
  const sortType = useSelector(selectSortTypeNew);
  const [previousSortType, setPreviousSortType] = useState<ThingSortKey_new>(
    ThingSortKey_new.None
  );
  const categories = useSelector(selectCategoriesDictionary);
  const theSortFunction = function (a: Thing, b: Thing) {
    return 0;
  };
  const [sortFunction, setSortFunction] = useState<
    (a: Thing, b: Thing) => number
  >(() => theSortFunction);

  useEffect(() => {
    if (
      sortType !== previousSortType &&
      sortType !== ThingSortKey_new.Category
    ) {
      setPreviousSortType(sortType);
      switch (sortType) {
        case ThingSortKey_new.FileName:
          setSortFunction(
            () => (a: Thing, b: Thing) => a.name.localeCompare(b.name)
          );
          break;

        case ThingSortKey_new.Random:
          setSortFunction(
            () => (a: Thing, b: Thing) =>
              Math.round(Math.random() * 10) >= 5 ? 1 : -1
          );
          break;
        case ThingSortKey_new.Name:
          setSortFunction(
            () => (a: Thing, b: Thing) => a.name.localeCompare(b.name)
          );
          break;
        case ThingSortKey_new.None:
        default:
          setSortFunction(() => (a: Thing, b: Thing) => 0);
      }
    }
  }, [sortType, categories, previousSortType]);

  useEffect(() => {
    if (sortType === ThingSortKey_new.Category) {
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

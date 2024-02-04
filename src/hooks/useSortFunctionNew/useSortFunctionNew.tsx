import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectCategoriesDictionary } from "store/slices/newData/selectors/selectors";
import { selectSortTypeNew } from "store/slices/project/selectors";
import { ThingSortKey_new } from "types/ImageSortType";
import { ThingType } from "types/ThingType";

export const useSortFunctionNew = () => {
  const sortType = useSelector(selectSortTypeNew);
  const [previousSortType, setPreviousSortType] = useState<ThingSortKey_new>(
    ThingSortKey_new.None
  );
  const categories = useSelector(selectCategoriesDictionary);
  const theSortFunction = function (a: ThingType, b: ThingType) {
    return 0;
  };
  const [sortFunction, setSortFunction] = useState<
    (a: ThingType, b: ThingType) => number
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
            () => (a: ThingType, b: ThingType) => a.name.localeCompare(b.name)
          );
          break;

        case ThingSortKey_new.Random:
          setSortFunction(
            () => (a: ThingType, b: ThingType) =>
              Math.round(Math.random() * 10) >= 5 ? 1 : -1
          );
          break;
        case ThingSortKey_new.Name:
          setSortFunction(
            () => (a: ThingType, b: ThingType) => a.name.localeCompare(b.name)
          );
          break;
        case ThingSortKey_new.None:
        default:
          setSortFunction(() => (a: ThingType, b: ThingType) => 0);
      }
    }
  }, [sortType, categories, previousSortType]);

  useEffect(() => {
    if (sortType === ThingSortKey_new.Category) {
      setPreviousSortType(sortType);
      setSortFunction(
        () => (a: ThingType, b: ThingType) =>
          categories[a.categoryId].name.localeCompare(
            categories[b.categoryId].name
          )
      );
    }
  }, [sortType, categories]);
  return sortFunction;
};

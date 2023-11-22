import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  dataSlice,
  selectImageCategoryNames,
  selectImagesByCategoryDict,
  selectUnusedImageCategoryColors,
} from "store/slices/data";

import {
  projectSlice,
  selectHiddenImageCategoryIds,
  updateHighlightedImageCategory,
  selectHighlightedImageCategory,
} from "store/slices/project";

import { Category, HotkeyView, PartialBy, UNKNOWN_IMAGE_CATEGORY } from "types";
import { CategoriesList } from "../CategoriesList";
import { useHotkeys } from "hooks";
import { selectSelectedImageIds } from "store/slices/project/selectors";
import { CategoryContext } from "contexts";

type ImageCategoryListProps = {
  createdCategories: Array<Category>;
  hasPredicted?: boolean;
  hotkeysActive?: boolean;
};

export const ImageCategoryList = (props: ImageCategoryListProps) => {
  const { createdCategories: categories, hasPredicted, hotkeysActive } = props;
  const dispatch = useDispatch();
  const highlightedCategory = useSelector(selectHighlightedImageCategory);
  const selectedImageIds = useSelector(selectSelectedImageIds);
  const [selectedCategory, setSelectedCategory] = useState<Category>();
  const [categoryIndex, setCategoryIndex] = useState("");
  const filteredImageCategories = useSelector(selectHiddenImageCategoryIds);
  const imagesByCategory = useSelector(selectImagesByCategoryDict);
  const unavailableNames = useSelector(selectImageCategoryNames);
  const availableColors = useSelector(selectUnusedImageCategoryColors);

  const selectCategory = useCallback(
    (category: Category) => {
      setSelectedCategory(category);

      dispatch(
        projectSlice.actions.updateHighlightedImageCategory({
          categoryId: category.id,
        })
      );
    },
    [dispatch]
  );

  const toggleCategoryFilter = useCallback(
    (category: Category) => {
      if (filteredImageCategories.includes(category.id)) {
        dispatch(
          projectSlice.actions.removeImageCategoryFilters({
            categoryIds: [category.id],
          })
        );
      } else {
        dispatch(
          projectSlice.actions.addImageCategoryFilters({
            categoryIds: [category.id],
          })
        );
      }
    },
    [dispatch, filteredImageCategories]
  );

  const filterOthers = useCallback(
    (category?: Category) => {
      let otherCategories: string[] = [
        ...categories,
        UNKNOWN_IMAGE_CATEGORY,
      ].reduce((otherIds: string[], otherCategory: Category) => {
        if (!category || otherCategory.id !== category.id) {
          otherIds.push(otherCategory.id);
        }
        return otherIds;
      }, []);

      dispatch(
        projectSlice.actions.addImageCategoryFilters({
          categoryIds: otherCategories,
        })
      );
    },
    [categories, dispatch]
  );

  const unfilterCategories = useCallback(() => {
    dispatch(projectSlice.actions.removeImageCategoryFilters({ all: true }));
  }, [dispatch]);

  const isCategoryFiltered = useCallback(
    (categoryId: string) => {
      return !filteredImageCategories.includes(categoryId);
    },
    [filteredImageCategories]
  );

  const anyFiltered = useMemo(() => {
    return filteredImageCategories.length > 0;
  }, [filteredImageCategories]);

  const imageCountByCategory = useCallback(
    (categoryId: string): number => {
      return imagesByCategory[categoryId].length ?? 0;
    },
    [imagesByCategory]
  );

  const deleteCategories = useCallback(
    (categories: Category | Category[]) => {
      if (!Array.isArray(categories)) {
        categories = [categories];
      }

      dispatch(
        dataSlice.actions.deleteImageCategories({
          categoryIds: categories.map((category) => category.id),
          isPermanent: true,
        })
      );
    },
    [dispatch]
  );

  const deleteImagesOfCategory = useCallback(
    (categoryId: string) => {
      const imageIds = imagesByCategory[categoryId];
      dispatch(
        dataSlice.actions.deleteImages({
          imageIds,
          disposeColorTensors: false,
          isPermanent: true,
        })
      );
    },
    [imagesByCategory, dispatch]
  );

  const upsertCategory = useCallback(
    (category: PartialBy<Category, "id" | "visible">) => {
      dispatch(
        dataSlice.actions.upsertImageCategory({ category, isPermanent: true })
      );
    },
    [dispatch]
  );

  useHotkeys(
    "shift+1,shift+2,shift+3,shift+4,shift+5,shift+6,shift+7,shift+8,shift+9,shift+0",
    (event: any, _handler) => {
      if (!event.repeat) {
        setCategoryIndex((index) => {
          return index + _handler.key.at(-1)!.toString();
        });
      }
    },
    [HotkeyView.Annotator, HotkeyView.ProjectView],
    { enabled: hotkeysActive },
    []
  );

  useHotkeys(
    "shift+backspace",
    (event) => {
      if (!event.repeat) {
        setCategoryIndex((index) => {
          return index.slice(0, index.length - 1);
        });
      }
    },
    [HotkeyView.ProjectView],
    { enabled: hotkeysActive },
    []
  );

  useHotkeys(
    "shift",
    () => {
      if (selectedImageIds.length > 0) {
        dispatch(
          dataSlice.actions.updateImages({
            updates: selectedImageIds.map((imageId) => ({
              id: imageId,
              categoryId: highlightedCategory,
            })),
            isPermanent: true,
          })
        );
      }

      setCategoryIndex("");
    },
    [HotkeyView.Annotator, HotkeyView.ProjectView],
    { keyup: true, enabled: hotkeysActive },
    [dispatch, selectedImageIds]
  );

  useEffect(() => {
    const allCategories = [UNKNOWN_IMAGE_CATEGORY, ...categories];
    if (categoryIndex.length === 0) {
      dispatch(
        updateHighlightedImageCategory({
          categoryId: undefined,
        })
      );
    } else if (!Number.isNaN(+categoryIndex) && allCategories[+categoryIndex]) {
      dispatch(
        updateHighlightedImageCategory({
          categoryId: allCategories[+categoryIndex].id,
        })
      );
    }
  }, [dispatch, categoryIndex, categories]);
  return (
    <CategoryContext.Provider
      value={{
        isCategoryFiltered,
        selectedCategory,
        highlightedCategory,
        anyFiltered,
        unavailableNames,
        availableColors,
        selectCategory,
        toggleCategoryFilter,
        filterOthers,
        unfilterCategories,
        deleteCategories,
        upsertCategory,
        createdCategories: categories,
        hasPredictions: !!hasPredicted,
        unknownCategory: UNKNOWN_IMAGE_CATEGORY,
        getObjectCountPerCategory: imageCountByCategory,
        deleteObjectsOfCategory: deleteImagesOfCategory,
      }}
    >
      <CategoriesList />
    </CategoryContext.Provider>
  );
};

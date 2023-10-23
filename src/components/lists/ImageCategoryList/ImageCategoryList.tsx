import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  dataSlice,
  selectImageCategoryNames,
  selectImagesByCategoryDict,
  selectUnusedImageCategoryColors,
} from "store/data";

import {
  projectSlice,
  selectHiddenImageCategoryIds,
  updateHighlightedImageCategory,
  selectHighlightedImageCategory,
} from "store/project";

import {
  Category,
  CategoryType,
  HotkeyView,
  PartialBy,
  UNKNOWN_IMAGE_CATEGORY,
} from "types";
import { CategoriesList } from "../CategoriesList";
import { useHotkeys } from "hooks";
import { selectSelectedImageIds } from "store/project/selectors";

type ImageCategoryListProps = {
  createdCategories: Array<Category>;
  categoryType: CategoryType;
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
  const hiddenImageCategories = useSelector(selectHiddenImageCategoryIds);
  const imagesByCategories = useSelector(selectImagesByCategoryDict);
  const usedImageCategoryNames = useSelector(selectImageCategoryNames);

  const unusedImageCategoryColors = useSelector(
    selectUnusedImageCategoryColors
  );

  const handleSelectCategory = useCallback(
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

  const handleToggleCategoryVisibility = useCallback(
    (category: Category) => {
      dispatch(
        projectSlice.actions.toggleCategoryVisibility({
          categoryId: category.id,
        })
      );
    },
    [dispatch]
  );

  const handleHideOtherCategories = useCallback(
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
        projectSlice.actions.hideCategories({
          categoryIds: otherCategories,
        })
      );
    },
    [categories, dispatch]
  );

  const handleShowAllCategories = useCallback(() => {
    dispatch(projectSlice.actions.showCategories({}));
  }, [dispatch]);

  const imageCategoryIsVisible = useCallback(
    (categoryId: string) => {
      return !hiddenImageCategories.includes(categoryId);
    },
    [hiddenImageCategories]
  );

  const hasHiddenImageCategories = useMemo(() => {
    return hiddenImageCategories.length > 0;
  }, [hiddenImageCategories]);

  const ImageCountByCategory = useCallback(
    (categoryId: string): number => {
      return imagesByCategories[categoryId].length ?? 0;
    },
    [imagesByCategories]
  );

  const dispatchDeleteCategories = useCallback(
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

  const dispatchDeleteImagesOfCategory = useCallback(
    (categoryId: string) => {
      const imageIds = imagesByCategories[categoryId];
      dispatch(
        dataSlice.actions.deleteImages({
          imageIds,
          disposeColorTensors: false,
          isPermanent: true,
        })
      );
    },
    [imagesByCategories, dispatch]
  );

  const dispatchUpsertCategory = useCallback(
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
    <CategoriesList
      createdCategories={categories}
      predicted={hasPredicted}
      categoryIsVisible={imageCategoryIsVisible}
      selectedCategory={selectedCategory}
      highlightedCategory={highlightedCategory}
      unknownCategory={UNKNOWN_IMAGE_CATEGORY}
      hasHidden={hasHiddenImageCategories}
      objectCountByCategory={ImageCountByCategory}
      usedCategoryNames={usedImageCategoryNames}
      usedCategoryColors={unusedImageCategoryColors}
      handleSelectCategory={handleSelectCategory}
      handleToggleCategoryVisibility={handleToggleCategoryVisibility}
      handleHideOtherCategories={handleHideOtherCategories}
      handleShowAllCategories={handleShowAllCategories}
      dispatchDeleteObjectsOfCategory={dispatchDeleteImagesOfCategory}
      dispatchDeleteCategories={dispatchDeleteCategories}
      dispatchUpsertCategory={dispatchUpsertCategory}
    />
  );
};

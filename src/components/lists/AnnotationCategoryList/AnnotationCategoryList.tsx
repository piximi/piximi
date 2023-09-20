import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Category,
  CategoryType,
  HotkeyView,
  PartialBy,
  UNKNOWN_ANNOTATION_CATEGORY,
} from "types";
import { CategoriesList } from "../CategoriesList/CategoriesList";
import { batch, useDispatch, useSelector } from "react-redux";
import {
  selectActiveImageId,
  imageViewerSlice,
  selectHiddenAnnotationCategoryIds,
  selectSelectedAnnotationIds,
  updateHighlightedAnnotationCategory,
  selectHighligtedAnnotationCatogory,
} from "store/imageViewer";
import {
  dataSlice,
  selectActiveAnnotationCountsByCategory,
  selectAnnotationCategoryNames,
  selectAnnotationsByCategoryDict,
  selectUnusedAnnotationCategoryColors,
} from "store/data";

import { selectSelectedAnnotations } from "store/project";
import { useHotkeys } from "hooks";

type AnnotationCategoryListProps = {
  createdCategories: Array<Category>;
  categoryType: CategoryType;
  hasPredicted?: boolean;
  hotkeysActive?: boolean;
};

export const AnnotationCategoryList = (props: AnnotationCategoryListProps) => {
  const { createdCategories: categories, hasPredicted, hotkeysActive } = props;
  const dispatch = useDispatch();
  const [selectedCategory, setSelectedCategory] = useState<Category>();
  const selectedAnnotations = useSelector(selectSelectedAnnotationIds);
  const selectedAnnotationObjects = useSelector(selectSelectedAnnotations);
  const [categoryIndex, setCategoryIndex] = useState("");
  const highlightedCategory = useSelector(selectHighligtedAnnotationCatogory);
  const hiddenAnnotationCategories = useSelector(
    selectHiddenAnnotationCategoryIds
  );
  const annotationsByCategory = useSelector(selectAnnotationsByCategoryDict);
  const usedAnnotationCategoryNames = useSelector(
    selectAnnotationCategoryNames
  );
  const unusedAnnotationCategoryColors = useSelector(
    selectUnusedAnnotationCategoryColors
  );
  const activeAnnotationCountsByCategory = useSelector(
    selectActiveAnnotationCountsByCategory
  );
  const activeImageId = useSelector(selectActiveImageId);

  const handleSelectCategory = useCallback(
    (category: Category) => {
      setSelectedCategory(category);

      dispatch(
        imageViewerSlice.actions.setSelectedCategoryId({
          selectedCategoryId: category.id,
          execSaga: true,
        })
      );
    },
    [dispatch]
  );

  const handleToggleCategoryVisibility = useCallback(
    (category: Category) => {
      dispatch(
        imageViewerSlice.actions.toggleCategoryVisibility({
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
        UNKNOWN_ANNOTATION_CATEGORY,
      ].reduce((otherIds: string[], otherCategory: Category) => {
        if (!category || otherCategory.id !== category.id) {
          otherIds.push(otherCategory.id);
        }
        return otherIds;
      }, []);
      dispatch(
        imageViewerSlice.actions.hideCategories({
          categoryIds: otherCategories,
        })
      );
    },
    [categories, dispatch]
  );

  const handleShowAllCategories = useCallback(() => {
    dispatch(imageViewerSlice.actions.showCategories({}));
  }, [dispatch]);

  const annotationCategoryIsVisible = useCallback(
    (categoryId: string) => {
      return !hiddenAnnotationCategories.includes(categoryId);
    },
    [hiddenAnnotationCategories]
  );

  const hasHiddenAnnotationCategories = useMemo(() => {
    return hiddenAnnotationCategories.length > 0;
  }, [hiddenAnnotationCategories]);

  const annotationCountByCategory = useCallback(
    (categoryId: string): number => {
      if (!activeImageId) {
        return annotationsByCategory[categoryId]
          ? annotationsByCategory[categoryId].length
          : 0;
      }
      return activeAnnotationCountsByCategory[categoryId] ?? 0;
    },
    [activeAnnotationCountsByCategory, annotationsByCategory, activeImageId]
  );

  const dispatchDeleteCategories = useCallback(
    (categories: Category | Category[]) => {
      if (!Array.isArray(categories)) {
        categories = [categories];
      }

      batch(() => {
        dispatch(
          imageViewerSlice.actions.setSelectedCategoryId({
            selectedCategoryId: UNKNOWN_ANNOTATION_CATEGORY.id,
            execSaga: true,
          })
        );

        dispatch(
          dataSlice.actions.deleteAnnotationCategories({
            // need to recast catagories as an array because inside batch
            categoryIds: (categories as Category[]).map(
              (category) => category.id
            ),
          })
        );
      });
    },
    [dispatch]
  );

  const dispatchDeleteAnnotationsOfCategory = useCallback(
    (categoryId: string) => {
      const annotationIds = annotationsByCategory[categoryId];
      batch(() => {
        dispatch(
          imageViewerSlice.actions.removeActiveAnnotationIds({ annotationIds })
        );
        dispatch(dataSlice.actions.deleteAnnotations({ annotationIds }));
      });
    },
    [annotationsByCategory, dispatch]
  );

  const dispatchUpsertCategory = useCallback(
    (category: PartialBy<Category, "id" | "visible">) => {
      dispatch(dataSlice.actions.upsertAnnotationCategory({ category }));
    },
    [dispatch]
  );

  useHotkeys(
    "shift",
    () => {
      //TODO : in Image Viewer, change only takes place when confirm button clicked
      if (selectedAnnotations.length > 0) {
        dispatch(
          dataSlice.actions.updateAnnotations({
            updates: selectedAnnotations.map((annotationId) => ({
              id: annotationId,
              categoryId: highlightedCategory,
            })),
          })
        );
      }

      setCategoryIndex("");
    },
    [HotkeyView.Annotator],
    { keyup: true },
    [dispatch, selectedAnnotations]
  );
  useHotkeys(
    "shift",
    () => {
      //TODO : in Image Viewer, change only takes place when confirm button clicked
      if (selectedAnnotationObjects.length > 0) {
        dispatch(
          dataSlice.actions.updateAnnotations({
            updates: selectedAnnotationObjects.map((annotationId) => ({
              id: annotationId,
              categoryId: highlightedCategory,
            })),
          })
        );
      }

      setCategoryIndex("");
    },
    [HotkeyView.ProjectView],
    { keyup: true, enabled: hotkeysActive },
    [dispatch, selectedAnnotations]
  );

  useEffect(() => {
    const allCategories = [UNKNOWN_ANNOTATION_CATEGORY, ...categories];
    if (categoryIndex.length === 0) {
      dispatch(
        updateHighlightedAnnotationCategory({
          categoryId: undefined,
        })
      );
    } else if (!Number.isNaN(+categoryIndex) && allCategories[+categoryIndex]) {
      dispatch(
        updateHighlightedAnnotationCategory({
          categoryId: allCategories[+categoryIndex].id,
        })
      );
    }
  }, [dispatch, categoryIndex, categories]);

  return (
    <CategoriesList
      createdCategories={categories}
      predicted={hasPredicted}
      categoryIsVisible={annotationCategoryIsVisible}
      selectedCategory={selectedCategory}
      highlightedCategory={highlightedCategory}
      unknownCategory={UNKNOWN_ANNOTATION_CATEGORY}
      hasHidden={hasHiddenAnnotationCategories}
      usedCategoryNames={usedAnnotationCategoryNames}
      usedCategoryColors={unusedAnnotationCategoryColors}
      objectCountByCategory={annotationCountByCategory}
      handleSelectCategory={handleSelectCategory}
      handleToggleCategoryVisibility={handleToggleCategoryVisibility}
      handleHideOtherCategories={handleHideOtherCategories}
      handleShowAllCategories={handleShowAllCategories}
      dispatchDeleteObjectsOfCategory={dispatchDeleteAnnotationsOfCategory}
      dispatchDeleteCategories={dispatchDeleteCategories}
      dispatchUpsertCategory={dispatchUpsertCategory}
    />
  );
};

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Category,
  HotkeyView,
  PartialBy,
  UNKNOWN_ANNOTATION_CATEGORY,
  UNKNOWN_ANNOTATION_CATEGORY_ID,
} from "types";
import { CategoriesList } from "../CategoriesList/CategoriesList";
import { batch, useDispatch, useSelector } from "react-redux";
import {
  selectActiveImageId,
  imageViewerSlice,
  selectFilteredAnnotationCategoryIds as selectImageViewerFilteredAnnotationCategoryIds,
  selectSelectedAnnotationIds,
  selectWorkingAnnotation,
} from "store/slices/imageViewer";
import {
  dataSlice,
  selectActiveAnnotationCountsByCategory,
  selectAnnotationCategoryNames,
  selectAnnotationsByCategoryDict,
  selectUnusedAnnotationCategoryColors,
} from "store/slices/data";

import {
  projectSlice,
  selectSelectedAnnotations,
  selectFilteredAnnotationCategoryIds as selectProjectFilteredAnnotationCategoryIds,
} from "store/slices/project";
import { useHotkeys } from "hooks";
import { CategoryContext } from "contexts";

type AnnotationCategoryListProps = {
  createdCategories: Array<Category>;
  hasPredicted?: boolean;
  hotkeysActive?: boolean;
  changesPermanent?: boolean;
  view: "Project" | "ImageViewer";
};

export const AnnotationCategoryList = (props: AnnotationCategoryListProps) => {
  const {
    createdCategories: categories,
    hasPredicted,
    hotkeysActive,
    changesPermanent,
    view,
  } = props;
  const dispatch = useDispatch();
  const [selectedCategory, setSelectedCategory] = useState<Category>();
  const [highlightedCategory, setHighlightedCategory] = useState<string>();
  const selectedAnnotations = useSelector(selectSelectedAnnotationIds);
  const selectedAnnotationObjects = useSelector(selectSelectedAnnotations);
  const [categoryIndex, setCategoryIndex] = useState("");
  const imageViewerFilteredAnnotationCategories = useSelector(
    selectImageViewerFilteredAnnotationCategoryIds
  );
  const projectFilteredAnnotationCategories = useSelector(
    selectProjectFilteredAnnotationCategoryIds
  );
  const annotationsByCategory = useSelector(selectAnnotationsByCategoryDict);
  const workingAnnotation = useSelector(selectWorkingAnnotation);
  const unavailableNames = useSelector(selectAnnotationCategoryNames);
  const availableColors = useSelector(selectUnusedAnnotationCategoryColors);
  const activeAnnotationCountsByCategory = useSelector(
    selectActiveAnnotationCountsByCategory
  );
  const activeImageId = useSelector(selectActiveImageId);

  const selectCategory = useCallback(
    (category: Category) => {
      setSelectedCategory(category);
      setHighlightedCategory(category.id);

      if (view === "ImageViewer") {
        dispatch(
          imageViewerSlice.actions.setSelectedCategoryId({
            selectedCategoryId: category.id,
            execSaga: true,
          })
        );

        if (selectedAnnotations.length > 0) {
          dispatch(
            dataSlice.actions.updateAnnotations({
              updates: selectedAnnotations.map((id) => ({
                id,
                categoryId: category.id,
              })),
            })
          );
        } else if (selectedAnnotationObjects.length > 0) {
          dispatch(
            dataSlice.actions.updateAnnotations({
              updates: selectedAnnotationObjects.map((id) => ({
                id,
                categoryId: category.id,
              })),
              isPermanent: true,
            })
          );
        } else if (workingAnnotation) {
          dispatch(
            imageViewerSlice.actions.updateWorkingAnnotation({
              changes: { categoryId: category.id },
            })
          );
        }
      }
    },
    [
      dispatch,
      selectedAnnotations,
      selectedAnnotationObjects,
      workingAnnotation,
      view,
    ]
  );

  const toggleCategoryFilter = useCallback(
    (category: Category) => {
      console.log(view);
      if (view === "ImageViewer") {
        if (imageViewerFilteredAnnotationCategories.includes(category.id)) {
          dispatch(
            imageViewerSlice.actions.removeAnnotationCategoryFilters({
              categoryIds: [category.id],
            })
          );
        } else {
          dispatch(
            imageViewerSlice.actions.addAnnotationCategoryFilters({
              categoryIds: [category.id],
            })
          );
        }
      } else {
        if (projectFilteredAnnotationCategories.includes(category.id)) {
          dispatch(
            projectSlice.actions.removeAnnotationCategoryFilters({
              categoryIds: [category.id],
            })
          );
        } else {
          dispatch(
            projectSlice.actions.addAnnotationCategoryFilters({
              categoryIds: [category.id],
            })
          );
        }
      }
    },
    [
      dispatch,
      imageViewerFilteredAnnotationCategories,
      projectFilteredAnnotationCategories,
      view,
    ]
  );

  const filterOthers = useCallback(
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
      if (view === "ImageViewer") {
        dispatch(
          imageViewerSlice.actions.addAnnotationCategoryFilters({
            categoryIds: otherCategories,
          })
        );
      } else {
        dispatch(
          projectSlice.actions.addAnnotationCategoryFilters({
            categoryIds: otherCategories,
          })
        );
      }
    },
    [categories, dispatch, view]
  );

  const unfilterCategories = useCallback(() => {
    if (view === "ImageViewer") {
      dispatch(
        imageViewerSlice.actions.removeAnnotationCategoryFilters({ all: true })
      );
    } else {
      dispatch(
        projectSlice.actions.removeAnnotationCategoryFilters({ all: true })
      );
    }
  }, [dispatch, view]);

  const isCategoryFiltered = useCallback(
    (categoryId: string) => {
      if (view === "ImageViewer") {
        return !imageViewerFilteredAnnotationCategories.includes(categoryId);
      } else {
        return !projectFilteredAnnotationCategories.includes(categoryId);
      }
    },
    [
      imageViewerFilteredAnnotationCategories,
      projectFilteredAnnotationCategories,
      view,
    ]
  );

  const anyFiltered = useMemo(() => {
    if (view === "ImageViewer") {
      return imageViewerFilteredAnnotationCategories.length > 0;
    } else {
      return projectFilteredAnnotationCategories.length > 0;
    }
  }, [
    imageViewerFilteredAnnotationCategories,
    projectFilteredAnnotationCategories,
    view,
  ]);

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

  const deleteCategories = useCallback(
    (categories: Category | Category[]) => {
      if (!Array.isArray(categories)) {
        categories = [categories];
      }

      batch(() => {
        if (view === "ImageViewer") {
          dispatch(
            imageViewerSlice.actions.setSelectedCategoryId({
              selectedCategoryId: UNKNOWN_ANNOTATION_CATEGORY.id,
              execSaga: true,
            })
          );
          dispatch(
            imageViewerSlice.actions.updateWorkingAnnotation({
              changes: { categoryId: UNKNOWN_ANNOTATION_CATEGORY_ID },
            })
          );
        }
        dispatch(
          dataSlice.actions.deleteAnnotationCategories({
            // need to recast catagories as an array because inside batch
            categoryIds: (categories as Category[]).map(
              (category) => category.id
            ),
            isPermanent: changesPermanent,
          })
        );
      });
    },
    [dispatch, changesPermanent, view]
  );

  const deleteObjectsOfCategory = useCallback(
    (categoryId: string) => {
      const annotationIds = annotationsByCategory[categoryId];
      batch(() => {
        if (view === "ImageViewer") {
          dispatch(
            imageViewerSlice.actions.removeActiveAnnotationIds({
              annotationIds,
            })
          );
        }
        dispatch(
          dataSlice.actions.deleteAnnotations({
            annotationIds,
            isPermanent: changesPermanent,
          })
        );
      });
    },
    [annotationsByCategory, dispatch, changesPermanent, view]
  );

  const upsertCategory = useCallback(
    (category: PartialBy<Category, "id" | "visible">) => {
      dispatch(
        dataSlice.actions.upsertAnnotationCategory({
          category,
          isPermanent: changesPermanent,
        })
      );
    },
    [dispatch, changesPermanent]
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
            isPermanent: changesPermanent,
          })
        );
      }

      setCategoryIndex("");
    },
    [HotkeyView.ProjectView],
    { keyup: true, enabled: hotkeysActive },
    [dispatch, selectedAnnotations, changesPermanent]
  );

  useEffect(() => {
    const allCategories = [UNKNOWN_ANNOTATION_CATEGORY, ...categories];
    if (categoryIndex.length === 0) {
      setHighlightedCategory(undefined);
    } else if (!Number.isNaN(+categoryIndex) && allCategories[+categoryIndex]) {
      setHighlightedCategory(allCategories[+categoryIndex].id);
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
        deleteObjectsOfCategory,
        deleteCategories,
        upsertCategory,
        createdCategories: categories,
        hasPredictions: !!hasPredicted,
        unknownCategory: UNKNOWN_ANNOTATION_CATEGORY,
        getObjectCountPerCategory: annotationCountByCategory,
      }}
    >
      <CategoriesList />
    </CategoryContext.Provider>
  );
};

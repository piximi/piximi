import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectImagesByCategoryDict } from "store/data";
import { selectAnnotationsByCategoryDict } from "store/data/selectors/annotationSelectors";
import {
  imageViewerSlice,
  selectHiddenAnnotationCategoryIds,
} from "store/imageViewer";
import { projectSlice, selectHiddenImageCategoryIds } from "store/project";
import {
  Category,
  CategoryType,
  UNKNOWN_ANNOTATION_CATEGORY,
  UNKNOWN_CLASS_CATEGORY,
} from "types";

export const useCategoryHandlers = (
  categoryType: CategoryType,
  categories: Category[]
) => {
  const dispatch = useDispatch();
  const [selectedCategory, setSelectedCategory] = useState<Category>();
  const hiddenAnnotationCategories = useSelector(
    selectHiddenAnnotationCategoryIds
  );
  const hiddenImageCategories = useSelector(selectHiddenImageCategoryIds);
  const imagesByCategories = useSelector(selectImagesByCategoryDict);
  const annotationsByCategory = useSelector(selectAnnotationsByCategoryDict);

  const handleSelectAnnotationCategory = (category: Category) => {
    setSelectedCategory(category);

    dispatch(
      imageViewerSlice.actions.setSelectedCategoryId({
        selectedCategoryId: category.id,
        execSaga: true,
      })
    );
  };

  const handleSelectImageCategory = (category: Category) => {
    dispatch(
      projectSlice.actions.updateHighlightedCategory({
        categoryIndex: 0,
      })
    );
  };

  const handleToggleImageCategory = (category: Category) => {
    dispatch(
      imageViewerSlice.actions.toggleCategoryVisibility({
        categoryId: category.id,
      })
    );
  };

  const handleToggleAnnotationCategory = (category: Category) => {
    dispatch(
      imageViewerSlice.actions.toggleCategoryVisibility({
        categoryId: category.id,
      })
    );
  };
  const handleHideOtherAnnotationCategories = (
    event: React.MouseEvent<HTMLElement, MouseEvent>,
    category: Category
  ) => {
    const otherCategories = [...categories, UNKNOWN_ANNOTATION_CATEGORY].reduce(
      (otherIds: string[], otherCategory: Category) => {
        if (otherCategory.id !== category.id) {
          otherIds.push(otherCategory.id);
        }
        return otherIds;
      },
      []
    );
    dispatch(
      imageViewerSlice.actions.hideCategories({
        categoryIds: otherCategories,
      })
    );
  };

  const handleHideOtherImageCategories = (
    event: React.MouseEvent<HTMLElement, MouseEvent>,
    category: Category
  ) => {
    const otherCategories = [...categories, UNKNOWN_CLASS_CATEGORY].reduce(
      (otherIds: string[], otherCategory: Category) => {
        if (otherCategory.id !== category.id) {
          otherIds.push(otherCategory.id);
        }
        return otherIds;
      },
      []
    );
    dispatch(
      imageViewerSlice.actions.hideCategories({
        categoryIds: otherCategories,
      })
    );
  };
  const showAllAnnotationCategories = (
    event: React.MouseEvent<HTMLElement, MouseEvent>
  ) => {
    dispatch(imageViewerSlice.actions.showAllCategories({}));
  };
  const showAllImageCategories = (
    event: React.MouseEvent<HTMLElement, MouseEvent>
  ) => {
    dispatch(imageViewerSlice.actions.showAllCategories({}));
  };

  const categoryIsVisible = (categoryId: string) => {
    if (categoryType === CategoryType.ClassifierCategory) {
      return !hiddenImageCategories.includes(categoryId);
    }
    return !hiddenAnnotationCategories.includes(categoryId);
  };

  const hasHidden = () => {
    if (categoryType === CategoryType.ClassifierCategory) {
      return hiddenImageCategories.length > 0;
    }
    return hiddenAnnotationCategories.length > 0;
  };

  const objectCountByCategory = (categoryId: string): number => {
    if (categoryType === CategoryType.ClassifierCategory) {
      return imagesByCategories[categoryId].length ?? 0;
    }
    return annotationsByCategory[categoryId].length ?? 0;
  };

  if (categoryType === CategoryType.ClassifierCategory) {
    return {
      categoryIsVisible,
      selectedCategory,
      hasHidden,
      objectCountByCategory,
      unknownCategory: UNKNOWN_CLASS_CATEGORY,
      handleSelectCategory: handleSelectImageCategory,
      handleToggleCategory: handleToggleImageCategory,
      handleHideOtherCategories: handleHideOtherImageCategories,
      handleShowAllCategories: showAllImageCategories,
    };
  } else {
    return {
      categoryIsVisible,
      selectedCategory,
      hasHidden,
      objectCountByCategory,
      unknownCategory: UNKNOWN_ANNOTATION_CATEGORY,
      handleSelectCategory: handleSelectAnnotationCategory,
      handleToggleCategory: handleToggleAnnotationCategory,
      handleHideOtherCategories: handleHideOtherAnnotationCategories,
      handleShowAllCategories: showAllAnnotationCategories,
    };
  }
};

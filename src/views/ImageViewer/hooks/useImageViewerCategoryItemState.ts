import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { imageViewerSlice } from "views/ImageViewer/state/imageViewer";
import { selectFilteredImageViewerCategoryIds } from "views/ImageViewer/state/imageViewer/selectors";

import { Category } from "store/data/types";
import { selectCategoryToAnnotations } from "store/data/selectors";
import { dataSlice } from "store/data";
import {
  selectHighligtedIVCatogory,
  selectSelectedIVCategoryId,
} from "../state/image-viewer-data/selectors";
import { imageViewerDataSlice } from "../state/image-viewer-data/ImageViewerDataSlice";

export const useImageViewerCategoryItemState = (category: Category) => {
  const [isSelected, setIsSelected] = useState<boolean>(false);
  const [isHighlighted, setIsHighlighted] = useState<boolean>(false);
  const [isFiltered, setIsFiltered] = useState<boolean>(false);

  const dispatch = useDispatch();
  const filteredCategoryIds = useSelector(selectFilteredImageViewerCategoryIds);
  const selectedCategory = useSelector(selectSelectedIVCategoryId);
  const highlightedCategory = useSelector(selectHighligtedIVCatogory);
  const categoryToAnnotations = useSelector(selectCategoryToAnnotations);

  const objectCount = useMemo(() => {
    return categoryToAnnotations[category.id].length;
  }, [categoryToAnnotations]);

  const handleSelect = useCallback(() => {
    dispatch(imageViewerDataSlice.actions.setSelectedCategoryId(category.id));
  }, [category.id, dispatch]);

  const deleteCategory = (category: Category) => {
    dispatch(dataSlice.actions.deleteCategory(category.id));
  };

  const editCategory = (id: string, name: string, color: string) => {
    dispatch(
      dataSlice.actions.updateCategory({
        id,
        changes: { name, color },
      }),
    );
  };

  const clearObjects = (categoryId: string) => {
    dispatch(dataSlice.actions.deleteAnnotationsOfCategory(categoryId));
  };

  const handleToggleCategoryVisibility = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>, categoryId: string) => {
      event.stopPropagation();
      if (filteredCategoryIds.includes(categoryId)) {
        dispatch(
          imageViewerSlice.actions.removeFilters({
            categoryIds: [category.id],
          }),
        );
      } else {
        dispatch(
          imageViewerSlice.actions.addFilters({
            categoryIds: [categoryId],
          }),
        );
      }
    },
    [category.id, dispatch, filteredCategoryIds],
  );

  useEffect(() => {
    setIsSelected(category.id === selectedCategory);
  }, [selectedCategory, category.id]);

  useEffect(() => {
    setIsHighlighted(category.id === highlightedCategory);
  }, [highlightedCategory, category.id]);

  useEffect(() => {
    setIsFiltered(filteredCategoryIds.includes(category.id));
  }, [filteredCategoryIds, category.id]);

  return {
    isSelected,
    isHighlighted,
    isFiltered,
    objectCount,
    handleSelect,
    handleToggleCategoryVisibility,
    editCategory,
    deleteCategory,
    clearObjects,
  };
};

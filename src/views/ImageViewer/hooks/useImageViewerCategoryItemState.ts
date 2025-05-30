import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { annotatorSlice } from "../state/annotator";
import { imageViewerSlice } from "views/ImageViewer/state/imageViewer";
import {
  selectImageViewerKinds,
  selectImageViewerObjects,
} from "../state/annotator/reselectors";
import {
  selectFilteredImageViewerCategoryIds,
  selectHighligtedIVCatogory,
  selectSelectedIVCategoryId,
} from "views/ImageViewer/state/imageViewer/selectors";

import { Category } from "store/data/types";
import { ProtoAnnotationObject } from "../utils/types";

export const useImageViewerCategoryItemState = (category: Category) => {
  const [isSelected, setIsSelected] = useState<boolean>(false);
  const [isHighlighted, setIsHighlighted] = useState<boolean>(false);
  const [isFiltered, setIsFiltered] = useState<boolean>(false);

  const objectCount = useMemo(() => {
    return category.containing.length;
  }, [category.containing]);
  const dispatch = useDispatch();
  const kindDictionary = useSelector(selectImageViewerKinds);
  const things = useSelector(selectImageViewerObjects);
  const filteredCategoryIds = useSelector(selectFilteredImageViewerCategoryIds);
  const selectedCategory = useSelector(selectSelectedIVCategoryId);
  const highlightedCategory = useSelector(selectHighligtedIVCatogory);

  const handleSelect = useCallback(() => {
    dispatch(
      imageViewerSlice.actions.setSelectedCategoryId({
        selectedCategoryId: category.id,
      }),
    );
  }, [category.id, dispatch]);

  const deleteCategory = (category: Category, kindId: string) => {
    dispatch(
      annotatorSlice.actions.deleteCategory({
        category: category,
        associatedUnknownKind: kindDictionary[kindId].unknownCategoryId,
      }),
    );
  };

  const editCategory = (id: string, name: string, color: string) => {
    dispatch(
      annotatorSlice.actions.updateCategory({
        category: { id, name, color },
      }),
    );
  };

  const clearObjects = (category: Category) => {
    dispatch(
      annotatorSlice.actions.deleteThings({
        things: category.containing.map(
          (thingId) => things[thingId] as ProtoAnnotationObject,
        ),
      }),
    );
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

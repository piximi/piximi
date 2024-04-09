import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { imageViewerSlice } from "store/imageViewer";
import { selectFilteredImageViewerCategoryIds } from "store/imageViewer/selectors/selectFilteredAnnotationCategoryIds";
import { selectHighligtedIVCatogory } from "store/imageViewer/selectors/selectHighlightedAnnotationCategory";
import { selectSelectedIVCategoryId } from "store/imageViewer/selectors/selectSelectedAnnotationCategoryId";
import { selectActiveImageCategoryObjectCount } from "store/data/selectors/reselectors";
import { isUnknownCategory } from "utils/common/helpers";
import { Category } from "store/data/types";

export const useImageViewerCategoryItemState = (
  category: Category,
  kind: string
) => {
  const [isSelected, setIsSelected] = useState<boolean>(false);
  const [isHighlighted, setIsHighlighted] = useState<boolean>(false);
  const [isFiltered, setIsFiltered] = useState<boolean>(false);
  const [objectCount, setObjectCount] = useState<number>(0);

  const dispatch = useDispatch();
  const getObjectCount = useSelector(selectActiveImageCategoryObjectCount);
  const filteredCategoryIds = useSelector(selectFilteredImageViewerCategoryIds);
  const selectedCategory = useSelector(selectSelectedIVCategoryId);
  const highlightedCategory = useSelector(selectHighligtedIVCatogory);

  const handleSelect = () => {
    dispatch(
      imageViewerSlice.actions.setSelectedCategoryId({
        selectedCategoryId: category.id,
      })
    );
  };

  const handleToggleCategoryVisibility = (
    event: React.ChangeEvent<HTMLInputElement>,
    categoryId: string
  ) => {
    event.stopPropagation();
    if (filteredCategoryIds.includes(categoryId)) {
      dispatch(
        imageViewerSlice.actions.removeFilters({
          categoryIds: [category.id],
        })
      );
    } else {
      dispatch(
        imageViewerSlice.actions.addFilters({
          categoryIds: [categoryId],
        })
      );
    }
  };

  useEffect(() => {
    setIsSelected(category.id === selectedCategory);
  }, [selectedCategory, category.id]);

  useEffect(() => {
    setIsHighlighted(category.id === highlightedCategory);
  }, [highlightedCategory, category.id]);

  useEffect(() => {
    setIsFiltered(filteredCategoryIds.includes(category.id));
  }, [filteredCategoryIds, category.id]);

  useEffect(() => {
    if (!isUnknownCategory(category.id)) {
      setObjectCount(getObjectCount(category, kind));
    } else {
      setObjectCount(getObjectCount(category));
    }
  }, [category, kind, getObjectCount]);
  return {
    isSelected,
    isHighlighted,
    isFiltered,
    objectCount,
    handleSelect,
    handleToggleCategoryVisibility,
  };
};

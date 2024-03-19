import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { imageViewerSlice } from "store/slices/imageViewer";
import { selectFilteredImageViewerCategoryIds } from "store/slices/imageViewer/selectors/selectFilteredAnnotationCategoryIds";
import { selectHighligtedIVCatogory } from "store/slices/imageViewer/selectors/selectHighlightedAnnotationCategory";
import { selectSelectedIVCategoryId } from "store/slices/imageViewer/selectors/selectSelectedAnnotationCategoryId";
import { selectActiveImageCategoryObjectCount } from "store/slices/newData/selectors/reselectors";
import { NewCategory } from "types/Category";
import { isUnknownCategory } from "utils/common/helpers";

export const useImageViewerCategoryItemState = (
  category: NewCategory,
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
        execSaga: true,
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

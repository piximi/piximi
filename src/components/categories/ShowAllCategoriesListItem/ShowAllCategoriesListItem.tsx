import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import { Visibility as VisibilityIcon } from "@mui/icons-material";

import { DataSlice, selectVisibleImages, selectAllImages } from "store/data";

import { CategoryType } from "types";

export const ShowAllCategoriesListItem = ({
  categoryType,
}: {
  categoryType: CategoryType;
}) => {
  const dispatch = useDispatch();

  const images = useSelector(selectAllImages);
  const visibleImages = useSelector(selectVisibleImages);

  const disabled = visibleImages.length === images.length;

  const showOtherCategories = (
    event: React.MouseEvent<HTMLElement, MouseEvent>
  ) => {
    if (categoryType === CategoryType.ClassifierCategory) {
      dispatch(DataSlice.actions.setOtherCategoriesInvisible({}));
    } else {
      dispatch(DataSlice.actions.setOtherAnnotationCategoriesInvisible({}));
    }
  };

  return (
    <ListItemButton disabled={disabled} onClick={showOtherCategories}>
      <ListItemIcon>
        <VisibilityIcon color="disabled" />
      </ListItemIcon>
      <ListItemText primary="Show All Categories" />
    </ListItemButton>
  );
};

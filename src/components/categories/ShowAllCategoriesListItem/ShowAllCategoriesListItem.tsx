import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import { Visibility as VisibilityIcon } from "@mui/icons-material";

import {
  updateOtherCategoryVisibility,
  updateOtherAnnotationCategoryVisibility,
  imagesSelector,
} from "store/project";
import { visibleImagesSelector } from "store/common";

import { CategoryType } from "types";

export const ShowAllCategoriesListItem = ({
  categoryType,
}: {
  categoryType: CategoryType;
}) => {
  const dispatch = useDispatch();

  const images = useSelector(imagesSelector);
  const visibleImages = useSelector(visibleImagesSelector);

  const disabled = visibleImages.length === images.length;

  const showOtherCategories = (
    event: React.MouseEvent<HTMLElement, MouseEvent>
  ) => {
    if (categoryType === CategoryType.ClassifierCategory) {
      dispatch(updateOtherCategoryVisibility({}));
    } else {
      dispatch(updateOtherAnnotationCategoryVisibility({}));
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

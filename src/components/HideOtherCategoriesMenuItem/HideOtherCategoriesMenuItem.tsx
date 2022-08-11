import React from "react";
import { useDispatch } from "react-redux";

import { MenuItem, Typography } from "@mui/material";

import {
  updateOtherAnnotationCategoryVisibility,
  updateOtherCategoryVisibility,
} from "store/slices";

import { Category, CategoryType } from "types";

type HideOtherCategoriesMenuItemProps = {
  category: Category;
  categoryType: CategoryType;
  onCloseCategoryMenu: (
    event: React.MouseEvent<HTMLElement, MouseEvent>
  ) => void;
};

export const HideOtherCategoriesMenuItem = ({
  category,
  categoryType,
  onCloseCategoryMenu,
}: HideOtherCategoriesMenuItemProps) => {
  const dispatch = useDispatch();

  const hideOtherCategories = (
    event: React.MouseEvent<HTMLElement, MouseEvent>
  ) => {
    if (categoryType === CategoryType.ClassifierCategory) {
      dispatch(updateOtherCategoryVisibility({ id: category.id }));
    } else {
      dispatch(updateOtherAnnotationCategoryVisibility({ id: category.id }));
    }

    onCloseCategoryMenu(event);
  };

  return (
    <MenuItem onClick={hideOtherCategories}>
      <Typography variant="inherit">Hide other categories</Typography>
    </MenuItem>
  );
};

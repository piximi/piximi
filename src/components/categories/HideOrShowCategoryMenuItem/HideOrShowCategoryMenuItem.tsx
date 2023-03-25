import React from "react";
import { useDispatch } from "react-redux";

import { MenuItem, Typography } from "@mui/material";

import { dataSlice } from "store/data";

import { Category, CategoryType } from "types";

type HideOrShowCategoryMenuItemProps = {
  category: Category;
  categoryType: CategoryType;
  onCloseCategoryMenu: (
    event: React.MouseEvent<HTMLLIElement, MouseEvent>
  ) => void;
};

export const HideOrShowCategoryMenuItem = ({
  category,
  categoryType,
  onCloseCategoryMenu,
}: HideOrShowCategoryMenuItemProps) => {
  const dispatch = useDispatch();

  const onHideCategory = (
    event: React.MouseEvent<HTMLLIElement, MouseEvent>
  ) => {
    const payload = {
      categoryId: category.id,
      visible: !category.visible,
    };

    if (categoryType === CategoryType.ClassifierCategory) {
      dispatch(dataSlice.actions.setCategoryVisibility(payload));
    } else {
      dispatch(dataSlice.actions.setAnnotationCategoryVisibility(payload));
    }

    onCloseCategoryMenu(event);
  };

  return (
    <MenuItem onClick={onHideCategory}>
      <Typography variant="inherit">
        {category.visible ? "Hide" : "Show"} category
      </Typography>
    </MenuItem>
  );
};

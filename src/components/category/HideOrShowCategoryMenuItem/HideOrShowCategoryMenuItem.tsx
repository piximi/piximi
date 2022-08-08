import React from "react";
import { useDispatch } from "react-redux";

import { MenuItem, Typography } from "@mui/material";

import { updateCategoryVisibility } from "store/slices";

import { Category } from "types";

type HideOrShowCategoryMenuItemProps = {
  category: Category;
  onCloseCategoryMenu: (
    event: React.MouseEvent<HTMLLIElement, MouseEvent>
  ) => void;
};

export const HideOrShowCategoryMenuItem = ({
  category,
  onCloseCategoryMenu,
}: HideOrShowCategoryMenuItemProps) => {
  const dispatch = useDispatch();

  const onClick = (event: React.MouseEvent<HTMLLIElement, MouseEvent>) => {
    onCloseCategoryMenu(event);

    const payload = { id: category.id, visible: !category.visible };

    dispatch(updateCategoryVisibility(payload));
  };

  return (
    <MenuItem onClick={onClick}>
      <Typography variant="inherit">
        {category.visible ? "Hide" : "Show"} category
      </Typography>
    </MenuItem>
  );
};

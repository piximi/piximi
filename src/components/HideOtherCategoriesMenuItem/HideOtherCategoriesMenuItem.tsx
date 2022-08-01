import React from "react";
import { useDispatch } from "react-redux";

import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";

import { updateOtherCategoryVisibility } from "../../store/slices";

import { Category } from "types/Category";

type HideOtherCategoriesMenuItemProps = {
  category: Category;
  onCloseCategoryMenu: (
    event: React.MouseEvent<HTMLElement, MouseEvent>
  ) => void;
};

export const HideOtherCategoriesMenuItem = ({
  category,
  onCloseCategoryMenu,
}: HideOtherCategoriesMenuItemProps) => {
  const dispatch = useDispatch();

  const onClick = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
    onCloseCategoryMenu(event);

    dispatch(updateOtherCategoryVisibility({ id: category.id }));
  };

  return (
    <MenuItem onClick={onClick}>
      <Typography variant="inherit">Hide other categories</Typography>
    </MenuItem>
  );
};

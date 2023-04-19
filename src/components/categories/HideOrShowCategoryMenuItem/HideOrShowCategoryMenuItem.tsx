import React from "react";

import { MenuItem, Typography } from "@mui/material";

import { Category } from "types";

type HideOrShowCategoryMenuItemProps = {
  category: Category;
  handleHideCategory: (
    event: React.MouseEvent<HTMLLIElement, MouseEvent>
  ) => void;
};

export const HideOrShowCategoryMenuItem = ({
  category,
  handleHideCategory,
}: HideOrShowCategoryMenuItemProps) => {
  return (
    <MenuItem onClick={handleHideCategory}>
      <Typography variant="inherit">
        {category.visible ? "Hide" : "Show"} category
      </Typography>
    </MenuItem>
  );
};

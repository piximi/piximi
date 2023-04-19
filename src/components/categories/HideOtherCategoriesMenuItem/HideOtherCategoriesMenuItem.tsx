import React from "react";

import { MenuItem, Typography } from "@mui/material";

type HideOtherCategoriesMenuItemProps = {
  handleHideOtherCategories: (
    event: React.MouseEvent<HTMLElement, MouseEvent>
  ) => void;
};

export const HideOtherCategoriesMenuItem = ({
  handleHideOtherCategories,
}: HideOtherCategoriesMenuItemProps) => {
  return (
    <MenuItem onClick={handleHideOtherCategories}>
      <Typography variant="inherit">Hide other categories</Typography>
    </MenuItem>
  );
};

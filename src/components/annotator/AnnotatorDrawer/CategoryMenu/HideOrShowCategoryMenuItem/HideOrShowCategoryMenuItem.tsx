import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { MenuItem, Typography } from "@mui/material";

import { useTranslation } from "hooks";

import { selectedCategorySelector } from "store/selectors";

import { imageViewerSlice } from "store/slices";

import { Category } from "types";

type HideOrShowCategoryMenuItemProps = {
  category: Category;
  onCloseCategoryMenu: (
    event: React.MouseEvent<HTMLLIElement, MouseEvent>
  ) => void;
};

export const HideOrShowCategoryMenuItem = ({
  onCloseCategoryMenu,
}: HideOrShowCategoryMenuItemProps) => {
  const dispatch = useDispatch();

  const category = useSelector(selectedCategorySelector);

  const onClick = (event: React.MouseEvent<HTMLLIElement, MouseEvent>) => {
    dispatch(
      imageViewerSlice.actions.setCategoryVisibility({
        category: category,
        visible: !category.visible,
      })
    );

    onCloseCategoryMenu(event);
  };

  const t = useTranslation();

  const translatedHide = t("Hide category");
  const translatedShow = t("Show category");

  return (
    <MenuItem onClick={onClick}>
      <Typography variant="inherit">
        {category.visible ? translatedHide : translatedShow}
      </Typography>
    </MenuItem>
  );
};

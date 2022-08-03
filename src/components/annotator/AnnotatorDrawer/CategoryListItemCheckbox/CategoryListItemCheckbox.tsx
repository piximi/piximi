import React from "react";
import { useDispatch } from "react-redux";

import { Checkbox, ListItemIcon } from "@mui/material";

import {
  Label as LabelIcon,
  LabelOutlined as LabelOutlinedIcon,
} from "@mui/icons-material";

import { imageViewerSlice } from "store/slices";

import { Category } from "types";

type CategoryListItemCheckboxProps = {
  category: Category;
};

export const CategoryListItemCheckbox = ({
  category,
}: CategoryListItemCheckboxProps) => {
  const dispatch = useDispatch();

  const onCheckboxClick = () => {
    dispatch(
      imageViewerSlice.actions.setCategoryVisibility({
        category: category,
        visible: !category.visible,
      })
    );
  };

  return (
    <ListItemIcon>
      <Checkbox
        checked={category.visible}
        checkedIcon={<LabelIcon style={{ color: category.color }} />}
        disableRipple
        edge="start"
        icon={<LabelOutlinedIcon style={{ color: category.color }} />}
        onClick={onCheckboxClick}
        tabIndex={-1}
      />
    </ListItemIcon>
  );
};

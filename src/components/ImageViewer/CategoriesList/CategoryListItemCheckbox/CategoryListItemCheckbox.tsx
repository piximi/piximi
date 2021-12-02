import React from "react";
import ListItemIcon from "@mui/material/ListItemIcon";
import Checkbox from "@mui/material/Checkbox";
import LabelIcon from "@mui/icons-material/Label";
import LabelOutlinedIcon from "@mui/icons-material/LabelOutlined";
import { Category } from "../../../../types/Category";
import { useDispatch } from "react-redux";
import { imageViewerSlice } from "../../../../store/slices";

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

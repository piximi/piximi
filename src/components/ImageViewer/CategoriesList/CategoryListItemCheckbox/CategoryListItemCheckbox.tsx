import React from "react";
import ListItemIcon from "@mui/material/ListItemIcon";
import Checkbox from "@mui/material/Checkbox";
import LabelIcon from "@mui/icons-material/Label";
import LabelOutlinedIcon from "@mui/icons-material/LabelOutlined";
import { CategoryType } from "../../../../annotator/types/CategoryType";
import { useDispatch } from "react-redux";
import { applicationSlice } from "../../../../annotator/store";

type CategoryListItemCheckboxProps = {
  category: CategoryType;
};

export const CategoryListItemCheckbox = ({
  category,
}: CategoryListItemCheckboxProps) => {
  const dispatch = useDispatch();

  const onCheckboxClick = () => {
    dispatch(
      applicationSlice.actions.setCategoryVisibility({
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

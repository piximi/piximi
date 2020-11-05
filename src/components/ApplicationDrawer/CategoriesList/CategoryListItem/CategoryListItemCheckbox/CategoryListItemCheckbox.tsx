import React from "react";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import Checkbox from "@material-ui/core/Checkbox";
import LabelIcon from "@material-ui/icons/Label";
import LabelOutlinedIcon from "@material-ui/icons/LabelOutlined";
import { Category } from "../../../../../types/Category";
import { useDispatch } from "react-redux";
import { updateCategoryVisibilityAction } from "../../../../../store/slices";

type CategoryListItemCheckboxProps = {
  category: Category;
};

export const CategoryListItemCheckbox = ({
  category,
}: CategoryListItemCheckboxProps) => {
  const dispatch = useDispatch();

  const onChange = () => {
    const payload = {
      id: category.id,
      visible: !category.visible,
    };

    dispatch(updateCategoryVisibilityAction(payload));
  };

  return (
    <ListItemIcon>
      <Checkbox
        checked={category.visible}
        checkedIcon={<LabelIcon style={{ color: category.color }} />}
        disableRipple
        edge="start"
        icon={<LabelOutlinedIcon style={{ color: category.color }} />}
        tabIndex={-1}
        onChange={onChange}
      />
    </ListItemIcon>
  );
};

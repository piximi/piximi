import { useDispatch } from "react-redux";

import { Checkbox, ListItemIcon } from "@mui/material";
import {
  Label as LabelIcon,
  LabelOutlined as LabelOutlinedIcon,
} from "@mui/icons-material";

import { dataSlice } from "store/data";

import { Category } from "types";

type CategoryItemCheckboxProps = {
  category: Category;
};

export const AnnotationCategoryItemCheckbox = ({
  category,
}: CategoryItemCheckboxProps) => {
  const dispatch = useDispatch();

  const onHideCategory = () => {
    const payload = {
      categoryId: category.id,
      visible: !category.visible,
    };

    dispatch(dataSlice.actions.setAnnotationCategoryVisibility(payload));
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
        onChange={onHideCategory}
      />
    </ListItemIcon>
  );
};

import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { Checkbox, ListItemIcon } from "@mui/material";

import {
  Label as LabelIcon,
  LabelOutlined as LabelOutlinedIcon,
} from "@mui/icons-material";

import { visibleImagesSelector } from "store/selectors";

import { deselectImages, updateCategoryVisibility } from "store/slices";

import { Category, ImageType } from "types";

type CategoryListItemCheckboxProps = {
  category: Category;
};

export const CategoryListItemCheckbox = ({
  category,
}: CategoryListItemCheckboxProps) => {
  const dispatch = useDispatch();

  const images = useSelector(visibleImagesSelector);

  const onChange = () => {
    const payload = {
      id: category.id,
      visible: !category.visible,
    };

    if (category.visible) {
      dispatch(
        deselectImages({
          ids: images
            .filter((image: ImageType) => {
              return image.categoryId === category.id;
            })
            .map((image: ImageType) => image.id),
        })
      );
    }

    dispatch(updateCategoryVisibility(payload));
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

import React from "react";
import { Category } from "../../types/Category";
import { useDispatch, useSelector } from "react-redux";
import { deselectImages, updateCategoryVisibility } from "../../store/slices";
import { visibleImagesSelector } from "../../store/selectors";
import { Image } from "../../types/Image";
import { Checkbox, ListItemIcon } from "@mui/material";
import LabelIcon from "@mui/icons-material/Label";
import LabelOutlinedIcon from "@mui/icons-material/LabelOutlined";

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
            .filter((image: Image) => {
              return image.categoryId === category.id;
            })
            .map((image: Image) => image.id),
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

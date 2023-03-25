import { useDispatch, useSelector } from "react-redux";

import { Checkbox, ListItemIcon } from "@mui/material";
import {
  Label as LabelIcon,
  LabelOutlined as LabelOutlinedIcon,
} from "@mui/icons-material";

import { deselectImages } from "store/project";

import { dataSlice, selectImagesByCategory } from "store/data";

import { Category, CategoryType } from "types";

type CategoryItemCheckboxProps = {
  category: Category;
  categoryType: CategoryType;
};

export const CategoryItemCheckbox = ({
  category,
  categoryType,
}: CategoryItemCheckboxProps) => {
  const dispatch = useDispatch();

  const categoryImages = useSelector(selectImagesByCategory(category.id));

  const onHideCategory = () => {
    const payload = {
      categoryId: category.id,
      visible: !category.visible,
    };

    if (categoryType === CategoryType.ClassifierCategory) {
      if (category.visible) {
        dispatch(
          deselectImages({
            ids: categoryImages,
          })
        );
      }

      dispatch(dataSlice.actions.setCategoryVisibility(payload));
    } else {
      dispatch(dataSlice.actions.setAnnotationCategoryVisibility(payload));
    }
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

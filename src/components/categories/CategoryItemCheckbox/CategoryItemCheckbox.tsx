import { useDispatch, useSelector } from "react-redux";

import { Checkbox, ListItemIcon } from "@mui/material";
import {
  Label as LabelIcon,
  LabelOutlined as LabelOutlinedIcon,
} from "@mui/icons-material";

import { deselectImages } from "store/application";
import { visibleImagesSelector } from "store/common";
import {
  updateCategoryVisibility,
  setAnnotationCategoryVisibility,
} from "store/project";

import { Category, CategoryType, OldImageType } from "types";

type CategoryItemCheckboxProps = {
  category: Category;
  categoryType: CategoryType;
};

export const CategoryItemCheckbox = ({
  category,
  categoryType,
}: CategoryItemCheckboxProps) => {
  const dispatch = useDispatch();

  const images = useSelector(visibleImagesSelector);

  const onHideCategory = () => {
    const payload = {
      categoryId: category.id,
      visible: !category.visible,
    };

    if (categoryType === CategoryType.ClassifierCategory) {
      if (category.visible) {
        dispatch(
          deselectImages({
            ids: images
              .filter((image: OldImageType) => {
                return image.categoryId === category.id;
              })
              .map((image: OldImageType) => image.id),
          })
        );
      }

      dispatch(updateCategoryVisibility(payload));
    } else {
      dispatch(setAnnotationCategoryVisibility(payload));
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

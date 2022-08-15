import { useDispatch, useSelector } from "react-redux";

import { Checkbox, ListItemIcon } from "@mui/material";
import {
  Label as LabelIcon,
  LabelOutlined as LabelOutlinedIcon,
} from "@mui/icons-material";

import { visibleImagesSelector } from "store/selectors";
import {
  deselectImages,
  setAnnotationCategoryVisibility,
  updateCategoryVisibility,
} from "store/slices";

import { Category, CategoryType, ImageType } from "types";

type CategoryListItemCheckboxProps = {
  category: Category;
  categoryType: CategoryType;
};

export const CategoryListItemCheckbox = ({
  category,
  categoryType,
}: CategoryListItemCheckboxProps) => {
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
              .filter((image: ImageType) => {
                return image.categoryId === category.id;
              })
              .map((image: ImageType) => image.id),
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

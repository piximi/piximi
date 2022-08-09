import React from "react";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import { Category, CategoryType } from "types/Category";
import { useDispatch } from "react-redux";
import {
  updateOtherAnnotationCategoryVisibility,
  updateOtherCategoryVisibility,
} from "store/slices";

type HideOtherCategoriesMenuItemProps = {
  category: Category;
  categoryType: CategoryType;
  onCloseCategoryMenu: (
    event: React.MouseEvent<HTMLElement, MouseEvent>
  ) => void;
};

export const HideOtherCategoriesMenuItem = ({
  category,
  categoryType,
  onCloseCategoryMenu,
}: HideOtherCategoriesMenuItemProps) => {
  const dispatch = useDispatch();

  const hideOtherCategories = (
    event: React.MouseEvent<HTMLElement, MouseEvent>
  ) => {
    if (categoryType === CategoryType.ClassifierCategory) {
      dispatch(updateOtherCategoryVisibility({ id: category.id }));
    } else {
      dispatch(updateOtherAnnotationCategoryVisibility({ id: category.id }));
    }

    onCloseCategoryMenu(event);
  };

  return (
    <MenuItem onClick={hideOtherCategories}>
      <Typography variant="inherit">Hide other categories</Typography>
    </MenuItem>
  );
};

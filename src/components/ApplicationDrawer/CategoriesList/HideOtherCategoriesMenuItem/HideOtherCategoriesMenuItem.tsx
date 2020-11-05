import React from "react";
import MenuItem from "@material-ui/core/MenuItem";
import Typography from "@material-ui/core/Typography";
import { Category } from "../../../../types/Category";
import { useDispatch } from "react-redux";
import { projectSlice } from "../../../../store/slices";

type HideOtherCategoriesMenuItemProps = {
  category: Category;
  onCloseCategoryMenu: () => void;
};

export const HideOtherCategoriesMenuItem = ({
  category,
  onCloseCategoryMenu,
}: HideOtherCategoriesMenuItemProps) => {
  const dispatch = useDispatch();

  const onHideOtherCategories = (category: Category) => {
    onCloseCategoryMenu();
    dispatch(
      projectSlice.actions.updateOtherCategoryVisibilityAction({
        id: category.id,
      })
    );
  };

  return (
    <MenuItem onClick={() => onHideOtherCategories(category)}>
      <Typography variant="inherit">Hide other categories</Typography>
    </MenuItem>
  );
};

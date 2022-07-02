import React from "react";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import { useTranslation } from "hooks/useTranslation";
import { useDispatch, useSelector } from "react-redux";
import {
  annotationCategoriesSelector,
  selectedCategorySelector,
} from "store/selectors";
import { projectSlice } from "store/slices";

type HideOtherCategoriesMenuItemProps = {
  onCloseCategoryMenu: (
    event: React.MouseEvent<HTMLElement, MouseEvent>
  ) => void;
};

export const HideOtherCategoriesMenuItem = ({
  onCloseCategoryMenu,
}: HideOtherCategoriesMenuItemProps) => {
  const annotatorCategories = useSelector(annotationCategoriesSelector);

  const selectedCategory = useSelector(selectedCategorySelector);

  const dispatch = useDispatch();

  const onHideOtherCategoriesClick = (
    event: React.MouseEvent<HTMLElement, MouseEvent>
  ) => {
    annotatorCategories.forEach((category) => {
      if (selectedCategory.id !== category.id) {
        dispatch(
          projectSlice.actions.setAnnotationCategoryVisibility({
            categoryId: category.id,
            visible: false,
          })
        );
      }
    });
    onCloseCategoryMenu(event);
  };

  const t = useTranslation();

  return (
    <MenuItem onClick={onHideOtherCategoriesClick}>
      <Typography variant="inherit">{t("Hide other categories")}</Typography>
    </MenuItem>
  );
};

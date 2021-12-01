import React from "react";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import { Category } from "../../../../../types/Category";
import { useTranslation } from "../../../../../hooks/useTranslation";
import { useDispatch, useSelector } from "react-redux";
import { selectedCategorySelector } from "../../../../../store/selectors";
import { projectSlice } from "../../../../../store/slices";

type HideOrShowCategoryMenuItemProps = {
  category: Category;
  onCloseCategoryMenu: (
    event: React.MouseEvent<HTMLLIElement, MouseEvent>
  ) => void;
};

export const HideOrShowCategoryMenuItem = ({
  onCloseCategoryMenu,
}: HideOrShowCategoryMenuItemProps) => {
  const dispatch = useDispatch();

  const category = useSelector(selectedCategorySelector);

  const onClick = (event: React.MouseEvent<HTMLLIElement, MouseEvent>) => {
    dispatch(
      projectSlice.actions.updateCategoryVisibility({
        id: category.id,
        visible: !category.visible,
      })
    );

    onCloseCategoryMenu(event);
  };

  const t = useTranslation();

  const translatedHide = t("Hide category");
  const translatedShow = t("Show category");

  return (
    <MenuItem onClick={onClick}>
      <Typography variant="inherit">
        {category.visible ? translatedHide : translatedShow}
      </Typography>
    </MenuItem>
  );
};

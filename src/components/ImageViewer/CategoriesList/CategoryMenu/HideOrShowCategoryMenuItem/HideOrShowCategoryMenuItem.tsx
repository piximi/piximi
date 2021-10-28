import React from "react";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import { CategoryType } from "../../../../../annotator/types/CategoryType";
import { useTranslation } from "../../../../../annotator/hooks/useTranslation";
import { useDispatch, useSelector } from "react-redux";
import { applicationSlice } from "../../../../../annotator/store";
import { selectedCategorySelector } from "../../../../../annotator/store/selectors";

type HideOrShowCategoryMenuItemProps = {
  category: CategoryType;
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
      applicationSlice.actions.setCategoryVisibility({
        category: category,
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

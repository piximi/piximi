import React, { useContext, useMemo } from "react";

import { Checkbox, Chip } from "@mui/material";
import {
  Label as LabelIcon,
  LabelOutlined as LabelOutlinedIcon,
  MoreHoriz as MoreHorizIcon,
} from "@mui/icons-material";

import { Category } from "types";

import { APPLICATION_COLORS } from "utils/common/colorPalette";
import { CustomListItemButton } from "../CustomListItemButton";
import { CategoryContext } from "contexts";

type CategoryItemProps = {
  category: Category;
  isFiltered: boolean;
  isSelected: boolean;
  isHighlighted: boolean;
  handleOpenCategoryMenu: (
    event: React.MouseEvent<HTMLButtonElement>,
    category: Category
  ) => void;
};

export const CategoryItem = ({
  category,
  isSelected,
  isHighlighted,
  isFiltered,
  handleOpenCategoryMenu,
}: CategoryItemProps) => {
  const { getObjectCountPerCategory, toggleCategoryFilter, selectCategory } =
    useContext(CategoryContext);

  const numObjects = useMemo(
    () => getObjectCountPerCategory(category.id),
    [category, getObjectCountPerCategory]
  );
  const handleOpenMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    handleOpenCategoryMenu(event, category);
  };
  const handleSelect = () => {
    selectCategory(category);
  };

  return (
    <CustomListItemButton
      selected={isSelected}
      primaryText={category.name}
      icon={
        <Checkbox
          checked={isFiltered}
          checkedIcon={<LabelIcon />}
          disableRipple
          edge="start"
          sx={{
            color: category.color,
            py: 0,
            "&.Mui-checked": { color: category.color },
          }}
          icon={<LabelOutlinedIcon />}
          tabIndex={-1}
          onChange={() => toggleCategoryFilter(category)}
          size="small"
        />
      }
      sx={{
        backgroundColor: isHighlighted ? category.color + "33" : "inherit",
      }}
      onClick={handleSelect}
      secondaryIcon={<MoreHorizIcon />} //TODO: Fix Display -- on load buttons offset, then move after interaction
      onSecondary={handleOpenMenu}
      additionalComponent={
        <Chip
          label={numObjects}
          size="small"
          sx={(theme) => {
            return {
              height: "1.5em",
              minWidth: "2.5em",
              borderWidth: "2px",
              fontSize: "0.875rem",
              color: theme.palette.text.primary,
              backgroundColor: APPLICATION_COLORS.highlightColor,
            };
          }}
        />
      }
      dense
    />
  );
};
